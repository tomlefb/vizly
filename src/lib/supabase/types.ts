export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          plan: 'free' | 'starter' | 'pro'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          plan?: 'free' | 'starter' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          plan?: 'free' | 'starter' | 'pro'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          slug: string | null
          title: string
          bio: string | null
          photo_url: string | null
          template: string
          primary_color: string
          secondary_color: string
          font: string
          social_links: Json | null
          contact_email: string | null
          published: boolean
          custom_domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          slug?: string | null
          title: string
          bio?: string | null
          photo_url?: string | null
          template?: string
          primary_color?: string
          secondary_color?: string
          font?: string
          social_links?: Json | null
          contact_email?: string | null
          published?: boolean
          custom_domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          slug?: string | null
          title?: string
          bio?: string | null
          photo_url?: string | null
          template?: string
          primary_color?: string
          secondary_color?: string
          font?: string
          social_links?: Json | null
          contact_email?: string | null
          published?: boolean
          custom_domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          portfolio_id: string
          title: string
          description: string | null
          images: Json
          external_link: string | null
          tags: Json
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          title: string
          description?: string | null
          images?: Json
          external_link?: string | null
          tags?: Json
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          title?: string
          description?: string | null
          images?: Json
          external_link?: string | null
          tags?: Json
          display_order?: number
          created_at?: string
        }
      }
      purchased_templates: {
        Row: {
          id: string
          user_id: string
          template_id: string
          stripe_payment_id: string
          purchased_at: string
        }
        Insert: {
          id?: string
          user_id: string
          template_id: string
          stripe_payment_id: string
          purchased_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string
          stripe_payment_id?: string
          purchased_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      plan_type: 'free' | 'starter' | 'pro'
    }
  }
}
