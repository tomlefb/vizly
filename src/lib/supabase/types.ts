export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      invoices: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_pdf: string | null
          number: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          number?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_pdf?: string | null
          number?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          id: string
          path: string | null
          portfolio_id: string
          referrer: string | null
          viewed_at: string
        }
        Insert: {
          country?: string | null
          id?: string
          path?: string | null
          portfolio_id: string
          referrer?: string | null
          viewed_at?: string
        }
        Update: {
          country?: string | null
          id?: string
          path?: string | null
          portfolio_id?: string
          referrer?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          bio: string | null
          contact_email: string | null
          created_at: string
          custom_blocks: Json | null
          custom_domain: string | null
          custom_domain_dns_target: string | null
          custom_domain_railway_id: string | null
          custom_domain_status: string | null
          custom_domain_verified_at: string | null
          font: string
          font_body: string
          id: string
          kpis: Json | null
          layout_blocks: Json | null
          photo_url: string | null
          primary_color: string
          published: boolean
          published_at: string | null
          secondary_color: string
          sections: Json | null
          skills: Json | null
          slug: string | null
          social_links: Json | null
          template: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          custom_blocks?: Json | null
          custom_domain?: string | null
          custom_domain_dns_target?: string | null
          custom_domain_railway_id?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          font?: string
          font_body?: string
          id?: string
          kpis?: Json | null
          layout_blocks?: Json | null
          photo_url?: string | null
          primary_color?: string
          published?: boolean
          published_at?: string | null
          secondary_color?: string
          sections?: Json | null
          skills?: Json | null
          slug?: string | null
          social_links?: Json | null
          template?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          custom_blocks?: Json | null
          custom_domain?: string | null
          custom_domain_dns_target?: string | null
          custom_domain_railway_id?: string | null
          custom_domain_status?: string | null
          custom_domain_verified_at?: string | null
          font?: string
          font_body?: string
          id?: string
          kpis?: Json | null
          layout_blocks?: Json | null
          photo_url?: string | null
          primary_color?: string
          published?: boolean
          published_at?: string | null
          secondary_color?: string
          sections?: Json | null
          skills?: Json | null
          slug?: string | null
          social_links?: Json | null
          template?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          external_link: string | null
          id: string
          images: Json
          portfolio_id: string
          tags: Json
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          external_link?: string | null
          id?: string
          images?: Json
          portfolio_id: string
          tags?: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          external_link?: string | null
          id?: string
          images?: Json
          portfolio_id?: string
          tags?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      purchased_templates: {
        Row: {
          id: string
          purchased_at: string
          stripe_payment_id: string
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          stripe_payment_id: string
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          stripe_payment_id?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchased_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          interval: string
          pending_effective_at: string | null
          pending_interval: string | null
          pending_plan: Database["public"]["Enums"]["plan_type"] | null
          plan: Database["public"]["Enums"]["plan_type"]
          status: string
          stripe_customer_id: string
          stripe_schedule_id: string | null
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval: string
          pending_effective_at?: string | null
          pending_interval?: string | null
          pending_plan?: Database["public"]["Enums"]["plan_type"] | null
          plan: Database["public"]["Enums"]["plan_type"]
          status: string
          stripe_customer_id: string
          stripe_schedule_id?: string | null
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          interval?: string
          pending_effective_at?: string | null
          pending_interval?: string | null
          pending_plan?: Database["public"]["Enums"]["plan_type"] | null
          plan?: Database["public"]["Enums"]["plan_type"]
          status?: string
          stripe_customer_id?: string
          stripe_schedule_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          last_renewal_reminder_sent_at: string | null
          name: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          welcome_sent_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          last_renewal_reminder_sent_at?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          welcome_sent_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_renewal_reminder_sent_at?: string | null
          name?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          welcome_sent_at?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          event_type: string
          payload: Json | null
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          event_type: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          event_type?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      plan_type: "free" | "starter" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_type: ["free", "starter", "pro"],
    },
  },
} as const
