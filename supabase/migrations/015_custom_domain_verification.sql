-- Migration 015 — Vérification + provisioning des custom domains
--
-- Contexte : jusque-là, `portfolios.custom_domain` était juste un texte
-- stocké en DB sans aucun effet d'infra (pas d'appel Railway, pas de check
-- DNS, pas de routage côté middleware). Cette migration prépare le backend
-- pour un flow complet : l'user saisit un domaine → on l'enregistre en
-- `pending`, on crée le domaine côté Railway (TLS auto), on vérifie le
-- CNAME DNS, puis on marque `verified` → le middleware commence à router.
--
-- États :
--   - pending  : enregistré en DB + créé côté Railway, DNS pas encore OK
--   - verified : CNAME + TLS OK, le domaine est live
--   - failed   : erreur côté Railway ou DNS invalide (l'user peut retry)

alter table public.portfolios
  add column if not exists custom_domain_status text
    check (custom_domain_status is null
      or custom_domain_status in ('pending', 'verified', 'failed')),
  add column if not exists custom_domain_verified_at timestamptz,
  -- ID Railway du CustomDomain (retour de la mutation customDomainCreate).
  -- Nécessaire pour pouvoir appeler customDomainDelete(id) à la suppression
  -- sans re-query Railway pour retrouver l'ID par nom.
  add column if not exists custom_domain_railway_id text,
  -- Hôte CNAME que l'user doit configurer chez son registrar (ex:
  -- 4mjvu86b.up.railway.app). Retourné par Railway dans status.dnsRecords.
  -- Stocké pour l'afficher dans l'UI d'instructions sans re-query Railway.
  add column if not exists custom_domain_dns_target text;

-- Un domaine physique ↔ un seul portfolio. Partial unique index (WHERE
-- custom_domain IS NOT NULL) pour autoriser plusieurs rows à custom_domain=NULL.
create unique index if not exists idx_portfolios_custom_domain_unique
  on public.portfolios(custom_domain)
  where custom_domain is not null;

-- Invariant : si custom_domain est renseigné, le status l'est aussi.
-- Inversement, pas de status orphelin sans domaine. (Un status=NULL +
-- domain=NULL représente "aucun domaine configuré".)
alter table public.portfolios
  add constraint portfolios_custom_domain_status_coherence
  check (
    (custom_domain is null and custom_domain_status is null
     and custom_domain_verified_at is null)
    or
    (custom_domain is not null and custom_domain_status is not null)
  );

-- Backfill : les rows existantes avec un custom_domain déjà stocké (aucun
-- aujourd'hui mais défense) partent en 'pending' — l'user devra re-passer
-- par le flow de vérification pour les activer.
update public.portfolios
  set custom_domain_status = 'pending'
  where custom_domain is not null
    and custom_domain_status is null;
