/**
 * Seed 8 showcase portfolios on prod for tommynoubonzon@gmail.com.
 *
 * - Flips user plan → 'pro'
 * - Unlocks 4 premium templates (creatif, brutalist, elegant, bento) via
 *   purchased_templates
 * - Upserts 8 portfolios (one per template) with rich demo content pulled
 *   from src/lib/demo-data.ts (kept in sync manually here since this script
 *   is plain ESM; running from node without a TS loader)
 * - Each portfolio: published=true, unique slug → live on <slug>.vizly.fr
 *
 * Idempotent: safe to re-run. Existing showcase portfolios for this user are
 * wiped (projects cascade via FK) before re-insert.
 *
 * Run: node --env-file=.env scripts/seed-showcase-portfolios.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const OWNER_EMAIL = 'tommynoubonzon@gmail.com'
const PREMIUM_TEMPLATES = ['creatif', 'brutalist', 'elegant', 'bento']

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Per-template palette
const COLORS = {
  minimal: { primary: '#1A1A1A', secondary: '#F5F5F5', body: '#1A1A1A', background: '#FFFFFF' },
  dark: { primary: '#00D4FF', secondary: '#0A0A0A', body: '#E6E6E6', background: '#0A0A0A' },
  classique: { primary: '#2D5A3D', secondary: '#FAFAF8', body: '#1A1A1A', background: '#FAFAF8' },
  colore: { primary: '#FF6B6B', secondary: '#FFF5E6', body: '#1A1A1A', background: '#FFF5E6' },
  creatif: { primary: '#8B6914', secondary: '#FFFDF5', body: '#1A1A1A', background: '#FFFDF5' },
  brutalist: { primary: '#F1B434', secondary: '#FFFFFF', body: '#FFFFFF', background: '#0A0A0A' },
  elegant: { primary: '#8F6B4A', secondary: '#FDFBF7', body: '#1A1A1A', background: '#FDFBF7' },
  bento: { primary: '#4A3D8F', secondary: '#F8F7FF', body: '#1A1A1A', background: '#F8F7FF' },
}

// Per-template handle (subdomain slug)
const HANDLES = {
  minimal: 'thomas-l',
  dark: 'nora',
  classique: 'jeanne-m',
  colore: 'yacine',
  creatif: 'kenza',
  brutalist: 'studio-noir',
  elegant: 'ines-v',
  bento: 'axl-studio',
}

// Profile photos — curated Unsplash portraits matching persona
const U = (id, w = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`

const PHOTOS = {
  minimal: U('photo-1531384441138-2736e62e0919'), // man dev with laptop
  dark: U('photo-1534528741775-53994a69daeb'), // woman dark moody portrait
  classique: U('photo-1438761681033-6461ffad8d80'), // student woman
  colore: U('photo-1500648767791-00dcc994a43e'), // man portrait
  creatif: U('photo-1524504388940-b1c1722653e1'), // woman profile hair portrait
  brutalist: U('photo-1536148935331-408321065b18'), // dark studio aesthetic
  elegant: U('photo-1573496359142-b8d87734a5a2'), // woman elegant
  bento: U('photo-1472099645785-5658abf4ff4e'), // man designer
}

// Project image pools — curated per persona, fit/domain-appropriate
const IMGS = {
  minimal: [
    U('photo-1555421689-491a97ff2040', 1200), // dark code terminal
    U('photo-1517694712202-14dd9538aa97', 1200), // code editor green
    U('photo-1558494949-ef010cbdcc31', 1200), // server rack
    U('photo-1551288049-bebda4e38f71', 1200), // analytics screen
  ],
  dark: [
    U('photo-1518770660439-4636190af475', 1200), // circuit tech abstract
    U('photo-1558655146-9f40138edfeb', 1200), // colorful abstract
    U('photo-1550745165-9bc0b252726f', 1200), // synth wave moody
    U('photo-1526925539332-aa3b66e35444', 1200), // glitch art
  ],
  classique: [
    U('photo-1554224155-6726b3ff858f', 1200), // business plan papers
    U('photo-1542744173-8e7e53415bb0', 1200), // business meeting
    U('photo-1611926653458-09294b3142bf', 1200), // phone + social
    U('photo-1460925895917-afdab827c52f', 1200), // analytics dashboard
  ],
  colore: [
    U('photo-1611605698335-8b1569810432', 1200), // social content workstation
    U('photo-1542744095-291d1f67b221', 1200), // content creation
    U('photo-1563986768609-322da13575f3', 1200), // email/newsletter
    U('photo-1611162616475-46b635cb6868', 1200), // TikTok phone
  ],
  creatif: [
    U('photo-1503342217505-b0a15ec3261c', 1200), // woman red dress studio
    U('photo-1502823403499-6ccfcf4fb453', 1200), // fashion outdoor
    U('photo-1490481651871-ab68de25d43d', 1200), // studio fashion shoot
    U('photo-1533158628620-7e35717d36e8', 1200), // art exhibition gallery
  ],
  brutalist: [
    U('photo-1618004912476-29818d81ae2e', 1200), // bold typography
    U('photo-1524634126442-357e0eac3c14', 1200), // layered print
    U('photo-1526925539332-aa3b66e35444', 1200), // glitch art editorial
    U('photo-1518770660439-4636190af475', 1200), // circuit abstract
  ],
  elegant: [
    U('photo-1600596542815-ffad4c1539a9', 1200), // luxury villa
    U('photo-1567016526105-22da7c13161a', 1200), // modern interior
    U('photo-1586023492125-27b2c045efd7', 1200), // architecture interior
    U('photo-1615529162924-f8605388461d', 1200), // modern bedroom
  ],
  bento: [
    U('photo-1547658719-da2b51169166', 1200), // figma components wall
    U('photo-1512941937669-90a1b58e7e9c', 1200), // mobile app design
    U('photo-1551288049-bebda4e38f71', 1200), // dashboard data viz
    U('photo-1507238691740-187a5b1d37b8', 1200), // mobile ux sketches
  ],
}

const ENTRIES = {
  minimal: {
    name: 'Thomas Lefèvre',
    bio: "Backend engineer, huit ans d'XP sur des systèmes event-driven à forte charge. Spécialisé Go et Rust, avec un faible pour les architectures multi-tenant et les pipelines data temps réel.\n\nTrois ans chez Doctolib (équipe plateforme, migration Python → Go, gestion de 2M+ requêtes/jour), maintenant freelance sur des projets critiques : néobanques, SaaS B2B, infra scale-up. Je m'occupe de ce qui se passe sous le capot — archi, perf, observability, on-call — et je signe rarement pour autre chose que du long terme.\n\nDispo deux à trois jours par semaine à partir de juin. Si tu cherches quelqu'un pour reprendre une codebase qui commence à gratter ou construire un nouveau service from scratch, on peut en parler.",
    contactEmail: 'hello@thomaslefevre.dev',
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://thomaslefevre.dev',
    },
    projects: [
      { title: 'App Bancaire', desc: "Backend Go pour une néobanque, 2M de requêtes/jour. Architecture event-driven avec Kafka.", tags: ['Go', 'Kafka', 'gRPC'], imgId: 0, extraImgIds: [60, 180] },
      { title: 'Dashboard SaaS', desc: 'Plateforme data-viz B2B, backend temps réel et API GraphQL.', tags: ['TypeScript', 'GraphQL'], imgId: 60 },
      { title: 'API Platform', desc: 'API interne multi-tenant, 99.99% uptime sur 18 mois.', tags: ['Docker', 'Kubernetes'], imgId: 180 },
      { title: 'E-commerce', desc: "Refonte du backend e-commerce, -60% sur le temps de réponse.", tags: ['Rust', 'PostgreSQL'], imgId: 366 },
    ],
    skills: ['Go', 'Rust', 'PostgreSQL', 'Docker', 'Kubernetes', 'gRPC', 'Kafka'],
    kpis: [
      { id: 'm-k1', type: 'number', label: 'Projets livrés', value: 47, maxValue: 100, unit: '' },
      { id: 'm-k2', type: 'percentage', label: 'Satisfaction client', value: 98, maxValue: 100, unit: '%' },
      { id: 'm-k3', type: 'trend', label: 'CA annuel', value: 85, maxValue: 100, unit: 'k€', secondaryValue: 12, secondaryLabel: 'vs. année précédente' },
    ],
    layoutBlocks: [],
    customBlocks: [],
  },
  dark: {
    name: 'Nora Belhaj',
    bio: "Creative developer spécialisée en expériences web immersives, animations 3D et shaders.",
    contactEmail: 'hello@nora.studio',
    socialLinks: {
      github: 'https://github.com',
      dribbble: 'https://dribbble.com',
      website: 'https://nora.studio',
    },
    projects: [
      { title: 'WebGL Experience', desc: 'Expérience 3D interactive pour une marque lifestyle, sélectionnée Awwwards.', tags: ['Three.js', 'GLSL'], imgId: 1 },
      { title: 'Interactive Portfolio', desc: 'Portfolio studio avec transitions GSAP et smooth scroll.', tags: ['React', 'GSAP'], imgId: 20 },
      { title: 'Audio Visualizer', desc: 'Visualizer temps réel Web Audio API + Canvas.', tags: ['Web Audio', 'Canvas'], imgId: 36 },
      { title: 'Creative Agency', desc: 'Site agency avec animations orchestrées et micro-interactions.', tags: ['Next.js', 'Framer'], imgId: 96 },
    ],
    skills: ['Three.js', 'WebGL', 'GSAP', 'React', 'Blender', 'GLSL'],
    kpis: [
      { id: 'd-k1', type: 'number', label: 'Awwwards SOTD', value: 3, maxValue: 10, unit: '' },
      { id: 'd-k2', type: 'stars', label: 'Note clients', value: 4.9, maxValue: 5, unit: '' },
    ],
    layoutBlocks: [
      {
        id: 'dark-layout-1',
        columnCount: 2,
        columns: [
          { type: 'text', title: 'Approche créative', content: "<p>Je fusionne design et code pour créer des expériences web mémorables. Chaque projet est une exploration artistique et technique.</p>" },
          { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop', imageAlt: 'Creative setup' },
        ],
      },
    ],
    customBlocks: [],
  },
  classique: {
    name: 'Jeanne Marchand',
    bio: "Étudiante en Master à l'ESSEC, spécialisée marketing digital et stratégie produit. En recherche de stage de fin d'études.",
    contactEmail: 'jeanne.marchand@essec.edu',
    socialLinks: {
      linkedin: 'https://linkedin.com',
    },
    projects: [
      { title: 'Étude de marché', desc: 'Analyse concurrentielle pour une startup EdTech, 40 interviews utilisateurs.', tags: ['Analyse', 'B2B'], imgId: 3 },
      { title: 'Campagne Social', desc: 'Stratégie Meta Ads avec +200% de conversions sur 3 mois.', tags: ['Meta Ads', 'KPI'], imgId: 119 },
      { title: 'Business Plan', desc: 'Business plan complet pour un projet de food-tech, primé concours étudiant.', tags: ['Startup', 'Finance'], imgId: 160 },
      { title: 'Stage Marketing', desc: 'Stage de 6 mois en growth marketing chez une scale-up FR.', tags: ['SEO', 'Growth'], imgId: 177 },
    ],
    skills: ['Marketing digital', 'SEO', 'Google Ads', 'Canva', 'Excel', 'Analytics'],
    kpis: [
      { id: 'c-k1', type: 'bars', label: 'Compétences clés', value: 0, maxValue: 100, unit: '%', dataPoints: [{ label: 'SEO', value: 85 }, { label: 'Ads', value: 70 }, { label: 'Analytics', value: 90 }, { label: 'CRM', value: 60 }] },
      { id: 'c-k2', type: 'number', label: 'Stages réalisés', value: 3, maxValue: 10, unit: '' },
    ],
    layoutBlocks: [],
    customBlocks: [
      { id: 'classique-cb-1', title: 'Formation', subtitle: 'Parcours académique', content: '<p><strong>ESSEC Business School</strong> — Master Grande École (2024-2026)</p><p><strong>Université Paris-Dauphine</strong> — Licence Économie-Gestion (2021-2024)</p>', order: 0 },
    ],
  },
  colore: {
    name: 'Yacine Kadi',
    bio: 'Community manager freelance, spécialisé stratégie de contenu et social media. Mes clients passent de invisibles à incontournables.',
    contactEmail: 'yacine@kadi.studio',
    socialLinks: {
      dribbble: 'https://dribbble.com',
      website: 'https://kadi.studio',
      linkedin: 'https://linkedin.com',
    },
    projects: [
      { title: 'Campagne Instagram', desc: 'Campagne multi-formats pour une marque DNVB, +58% de followers en 3 mois.', tags: ['Social Media', 'Contenu'], imgId: 24 },
      { title: 'Refonte Éditoriale', desc: 'Nouvelle ligne éditoriale et brand voice pour une startup SaaS.', tags: ['Copywriting', 'Brand'], imgId: 65 },
      { title: 'Stratégie TikTok', desc: 'Stratégie TikTok organique avec 4M de vues cumulées.', tags: ['Video', 'Tendances'], imgId: 137 },
      { title: 'Newsletter', desc: "Newsletter hebdomadaire, 12k abonnés, taux d'ouverture 42%.", tags: ['Email', 'Automation'], imgId: 169 },
    ],
    skills: ['Social Media', 'Copywriting', 'Canva', 'Analytics', 'Video', 'Branding'],
    kpis: [
      { id: 'co-k1', type: 'number', label: 'Comptes gérés', value: 12, maxValue: 50, unit: '' },
      { id: 'co-k2', type: 'percentage', label: 'Taux engagement moyen', value: 6, maxValue: 10, unit: '%' },
      { id: 'co-k3', type: 'comparison', label: 'Abonnés après', value: 45000, maxValue: 100000, unit: '', secondaryValue: 8000, secondaryLabel: 'Avant' },
      { id: 'co-k4', type: 'stars', label: 'Note Malt', value: 4.9, maxValue: 5, unit: '' },
    ],
    layoutBlocks: [],
    customBlocks: [],
  },
  creatif: {
    name: 'Kenza Amrani',
    bio: "Photographe et directrice artistique, basée à Paris. Spécialisée portrait, mode et éditorial.",
    contactEmail: 'studio@kenzaamrani.fr',
    socialLinks: {
      dribbble: 'https://dribbble.com',
      website: 'https://kenzaamrani.fr',
    },
    projects: [
      { title: 'Série Portrait', desc: "Série de portraits en lumière naturelle, exposée aux Rencontres d'Arles 2025.", tags: ['Portrait', 'Studio'], imgId: 10 },
      { title: 'Campagne Mode', desc: "Campagne printemps/été pour une marque de prêt-à-porter féminin.", tags: ['Mode', 'Édito'], imgId: 11 },
      { title: 'Édito Magazine', desc: 'Éditorial 8 pages pour un magazine mode trimestriel.', tags: ['Presse', 'Direction'], imgId: 15 },
      { title: 'Expo Galerie', desc: 'Première exposition solo dans une galerie du Marais, 40 tirages grand format.', tags: ['Art', 'Tirage'], imgId: 29 },
    ],
    skills: ['Lightroom', 'Photoshop', 'Direction artistique', 'Retouche', 'Vidéo'],
    kpis: [],
    layoutBlocks: [
      {
        id: 'creatif-layout-1',
        columnCount: 2,
        columns: [
          { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=1200&q=80&auto=format&fit=crop', imageAlt: 'Portrait studio' },
          { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1606166325683-e6deb697d301?w=1200&q=80&auto=format&fit=crop', imageAlt: 'Mode éditorial' },
        ],
      },
    ],
    customBlocks: [
      { id: 'creatif-cb-1', title: 'Clients notables', subtitle: 'Collaborations récentes', content: '<p>Vogue France — Elle Magazine — Chanel Beauty — Hermès — Galeries Lafayette</p>', order: 0 },
    ],
  },
  brutalist: {
    name: 'Studio Noir',
    bio: "Direction artistique, identité visuelle, type design. On pousse la typo et l'esthétique brute.",
    contactEmail: 'hello@studionoir.fr',
    socialLinks: {
      website: 'https://studionoir.fr',
      dribbble: 'https://dribbble.com',
    },
    projects: [
      { title: 'Poster Series', desc: 'Série de 12 affiches typographiques éditées en sérigraphie.', tags: ['Typo', 'Print'], imgId: 42 },
      { title: 'Brand Identity', desc: 'Identité complète pour une maison de disques indépendante.', tags: ['Logo', 'Identity'], imgId: 82 },
      { title: 'Zine Design', desc: "Direction artistique d'un zine trimestriel, 4 numéros sortis.", tags: ['Editorial', 'Indie'], imgId: 106 },
      { title: 'Type Experiment', desc: 'Fonte variable expérimentale, open source et utilisée sur 500+ projets.', tags: ['Variable', 'Motion'], imgId: 256 },
    ],
    skills: ['Direction artistique', 'Typographie', 'Identité visuelle', 'Print', 'Web'],
    kpis: [
      { id: 'b-k1', type: 'number', label: 'Awards', value: 7, maxValue: 50, unit: '' },
      { id: 'b-k2', type: 'number', label: 'Expositions', value: 14, maxValue: 50, unit: '' },
      { id: 'b-k3', type: 'stars', label: 'Note Behance', value: 4.8, maxValue: 5, unit: '' },
    ],
    layoutBlocks: [
      {
        id: 'brutalist-layout-1',
        columnCount: 3,
        columns: [
          { type: 'text', title: 'Print', content: '<p>Affiches, zines, éditions limitées</p>' },
          { type: 'text', title: 'Digital', content: '<p>Identités web, motion, UI expérimentale</p>' },
          { type: 'text', title: 'Type', content: '<p>Fontes custom, lettering, variable fonts</p>' },
        ],
      },
    ],
    customBlocks: [],
  },
  elegant: {
    name: 'Inès Vieira',
    bio: "Architecte d'intérieur, spécialisée dans les projets résidentiels haut de gamme, Paris et côte méditerranéenne.",
    contactEmail: 'contact@inesvieira.com',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      website: 'https://inesvieira.com',
    },
    projects: [
      { title: 'Loft Marais', desc: "Rénovation complète d'un loft de 180m² dans le Marais, matériaux nobles et lumière naturelle.", tags: ['Résidentiel', 'Luxe'], imgId: 164 },
      { title: "Villa Côte d'Azur", desc: 'Villa contemporaine face mer, travertin et chêne massif.', tags: ['Villa', 'Contemporain'], imgId: 188 },
      { title: 'Penthouse Lyon', desc: 'Penthouse de 220m² en plein centre, design sur-mesure.', tags: ['Rénovation', 'Design'], imgId: 238 },
      { title: 'Boutique Hotel', desc: "Concept d'un boutique hotel 18 chambres en Provence.", tags: ['Hôtellerie', 'Concept'], imgId: 356 },
    ],
    skills: ['AutoCAD', '3ds Max', 'SketchUp', 'Matériaux', 'Espace'],
    kpis: [
      { id: 'e-k1', type: 'number', label: 'Projets réalisés', value: 34, maxValue: 100, unit: '' },
      { id: 'e-k2', type: 'percentage', label: 'Clients fidèles', value: 72, maxValue: 100, unit: '%' },
    ],
    layoutBlocks: [
      {
        id: 'elegant-layout-1',
        columnCount: 2,
        columns: [
          { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80&auto=format&fit=crop', imageAlt: 'Intérieur luxe' },
          { type: 'text', title: 'Philosophie', content: "<p>Chaque espace raconte une histoire. Je conçois des intérieurs où le luxe se vit dans la subtilité des détails et la noblesse des matériaux.</p>" },
        ],
      },
    ],
    customBlocks: [],
  },
  bento: {
    name: 'Axel Moreau',
    bio: "Product designer chez une scale-up, focus sur les design systems et l'expérience utilisateur.",
    contactEmail: 'axel.moreau@proton.me',
    socialLinks: {
      linkedin: 'https://linkedin.com',
      dribbble: 'https://dribbble.com',
      github: 'https://github.com',
      website: 'https://axelmoreau.design',
    },
    projects: [
      { title: 'Design System v2', desc: 'Refonte complète du design system, 126 composants documentés.', tags: ['Figma', 'Tokens'], imgId: 26 },
      { title: 'Onboarding Flow', desc: 'Onboarding mobile repensé, +34% de complétion.', tags: ['UX', 'Mobile'], imgId: 48 },
      { title: 'Dashboard Refonte', desc: 'Refonte dashboard B2B, data-viz et information architecture.', tags: ['Data Viz', 'B2B'], imgId: 201 },
      { title: 'App Mobile', desc: "Design d'une app mobile cross-platform (iOS + Android).", tags: ['iOS', 'Android'], imgId: 403 },
    ],
    skills: ['Figma', 'Design System', 'UX Research', 'Prototypage', 'A/B Testing'],
    kpis: [
      { id: 'be-k1', type: 'percentage', label: 'Adoption design system', value: 94, maxValue: 100, unit: '%' },
      { id: 'be-k2', type: 'trend', label: 'NPS produit', value: 72, maxValue: 100, unit: '', secondaryValue: 18, secondaryLabel: 'vs. Q1' },
      { id: 'be-k3', type: 'bars', label: 'Sprints par trimestre', value: 0, maxValue: 100, unit: '', dataPoints: [{ label: 'Q1', value: 6 }, { label: 'Q2', value: 8 }, { label: 'Q3', value: 7 }, { label: 'Q4', value: 9 }] },
    ],
    layoutBlocks: [
      {
        id: 'bento-layout-1',
        columnCount: 2,
        columns: [
          { type: 'kpi', kpi: { id: 'be-lk1', type: 'number', label: 'Composants', value: 126, maxValue: 500, unit: '' } },
          { type: 'kpi', kpi: { id: 'be-lk2', type: 'percentage', label: 'Couverture tests', value: 89, maxValue: 100, unit: '%' } },
        ],
      },
    ],
    customBlocks: [],
  },
}

function buildSections(entry) {
  const sections = [
    { id: 'hero', visible: true, order: 0 },
    { id: 'bio', visible: true, order: 1 },
    { id: 'socials', visible: true, order: 2 },
    { id: 'projects', visible: true, order: 3 },
    { id: 'skills', visible: true, order: 4 },
  ]
  let order = 5
  if (entry.kpis && entry.kpis.length > 0) sections.push({ id: 'kpis', visible: true, order: order++ })
  for (const b of entry.layoutBlocks) sections.push({ id: `layout-${b.id}`, visible: true, order: order++ })
  for (const b of entry.customBlocks) sections.push({ id: `custom-${b.id}`, visible: true, order: order++ })
  // Contact section always visible since we enable the contact form
  sections.push({ id: 'contact', visible: true, order: order++ })
  return sections
}

async function main() {
  // 1. Resolve user
  const { data: user, error: uErr } = await supabase
    .from('users')
    .select('id, plan')
    .eq('email', OWNER_EMAIL)
    .single()
  if (uErr || !user) {
    console.error('User lookup failed:', uErr)
    process.exit(1)
  }
  console.log(`→ user=${user.id} current plan=${user.plan}`)

  // 2. Flip plan → pro
  if (user.plan !== 'pro') {
    const { error: planErr } = await supabase
      .from('users')
      .update({ plan: 'pro' })
      .eq('id', user.id)
    if (planErr) throw planErr
    console.log('✓ plan → pro')
  } else {
    console.log('✓ plan already pro')
  }

  // 3. Unlock premium templates via purchased_templates
  for (const tpl of PREMIUM_TEMPLATES) {
    const { error: ptErr } = await supabase
      .from('purchased_templates')
      .upsert(
        {
          user_id: user.id,
          template_id: tpl,
          stripe_payment_id: `showcase_seed_${tpl}`,
        },
        { onConflict: 'user_id,template_id', ignoreDuplicates: true },
      )
    if (ptErr && !String(ptErr.message).includes('duplicate')) {
      console.error(`purchased_templates ${tpl}:`, ptErr)
    }
  }
  console.log('✓ premium templates unlocked')

  // 4. Wipe existing showcase portfolios for this user (by slug)
  const slugs = Object.values(HANDLES)
  const { data: existing } = await supabase
    .from('portfolios')
    .select('id')
    .eq('user_id', user.id)
    .in('slug', slugs)
  if (existing && existing.length > 0) {
    const ids = existing.map((p) => p.id)
    await supabase.from('projects').delete().in('portfolio_id', ids)
    await supabase.from('portfolios').delete().in('id', ids)
    console.log(`✓ wiped ${ids.length} existing showcase portfolios`)
  }

  // 5. Insert 8 portfolios + projects
  for (const [tpl, entry] of Object.entries(ENTRIES)) {
    const c = COLORS[tpl]
    const slug = HANDLES[tpl]
    const portfolioRow = {
      user_id: user.id,
      slug,
      title: entry.name,
      bio: entry.bio,
      photo_url: PHOTOS[tpl],
      template: tpl,
      primary_color: c.primary,
      secondary_color: c.secondary,
      body_color: c.body,
      background_color: c.background,
      font: 'default',
      font_body: 'default',
      social_links: entry.socialLinks,
      contact_email: entry.contactEmail,
      published: true,
      published_at: new Date().toISOString(),
      sections: buildSections(entry),
      skills: entry.skills,
      kpis: entry.kpis,
      layout_blocks: entry.layoutBlocks,
      custom_blocks: entry.customBlocks,
      contact_form_enabled: true,
      contact_form_title: 'Me contacter',
      contact_form_description: 'Pour un projet, une collaboration ou une simple prise de contact.',
    }

    const { data: inserted, error: insErr } = await supabase
      .from('portfolios')
      .insert(portfolioRow)
      .select('id')
      .single()
    if (insErr) {
      console.error(`[${tpl}] portfolio insert failed:`, insErr)
      continue
    }

    const portfolioId = inserted.id
    const pool = IMGS[tpl] ?? []
    const projectRows = entry.projects.map((p, i) => ({
      portfolio_id: portfolioId,
      title: p.title,
      description: p.desc ?? null,
      // One image per project from curated pool, cycled if pool shorter than project count
      images: [pool[i % pool.length]],
      external_link: null,
      tags: p.tags,
      display_order: i,
    }))
    const { error: projErr } = await supabase.from('projects').insert(projectRows)
    if (projErr) {
      console.error(`[${tpl}] projects insert failed:`, projErr)
      continue
    }
    console.log(`✓ ${tpl} → https://${slug}.vizly.fr  (${entry.projects.length} projects)`)
  }

  console.log('\nDone. Sanity check:')
  console.log(`  https://thomas-l.vizly.fr`)
  console.log(`  https://nora.vizly.fr`)
  console.log(`  https://jeanne-m.vizly.fr`)
  console.log(`  https://yacine.vizly.fr`)
  console.log(`  https://kenza.vizly.fr`)
  console.log(`  https://studio-noir.vizly.fr`)
  console.log(`  https://ines-v.vizly.fr`)
  console.log(`  https://axl-studio.vizly.fr`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
