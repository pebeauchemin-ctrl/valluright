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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advisor_comments: {
        Row: {
          author_id: string
          body: string
          business_id: string
          created_at: string
          id: string
          is_approval: boolean
        }
        Insert: {
          author_id: string
          body: string
          business_id: string
          created_at?: string
          id?: string
          is_approval?: boolean
        }
        Update: {
          author_id?: string
          body?: string
          business_id?: string
          created_at?: string
          id?: string
          is_approval?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "advisor_comments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_invites: {
        Row: {
          advisor_email: string
          advisor_id: string | null
          business_id: string
          id: string
          invited_at: string
          responded_at: string | null
          status: Database["public"]["Enums"]["advisor_invite_status"]
        }
        Insert: {
          advisor_email: string
          advisor_id?: string | null
          business_id: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["advisor_invite_status"]
        }
        Update: {
          advisor_email?: string
          advisor_id?: string | null
          business_id?: string
          id?: string
          invited_at?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["advisor_invite_status"]
        }
        Relationships: [
          {
            foreignKeyName: "advisor_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          anonymous_description: string | null
          asking_price_high: number | null
          asking_price_low: number | null
          business_category: string | null
          cap_rate_high: number | null
          cap_rate_low: number | null
          cap_rate_selected: number | null
          created_at: string
          employees: number | null
          exit_timeline: Database["public"]["Enums"]["exit_timeline"] | null
          id: string
          industry: string | null
          is_sample: boolean
          management_fee_pct: number | null
          manager_team_depth: string | null
          name: string
          owner_hours_per_week: number | null
          owner_id: string
          owner_in_customer_relationships: boolean | null
          owner_in_operations: boolean | null
          owner_in_sales: boolean | null
          public_id: string
          reason_for_sale: string | null
          recurring_revenue_pct: number | null
          region: string | null
          replacement_reserve_pct: number | null
          sop_status: string | null
          sub_industry: string | null
          top_customer_concentration_pct: number | null
          updated_at: string
          years_in_business: number | null
        }
        Insert: {
          anonymous_description?: string | null
          asking_price_high?: number | null
          asking_price_low?: number | null
          business_category?: string | null
          cap_rate_high?: number | null
          cap_rate_low?: number | null
          cap_rate_selected?: number | null
          created_at?: string
          employees?: number | null
          exit_timeline?: Database["public"]["Enums"]["exit_timeline"] | null
          id?: string
          industry?: string | null
          is_sample?: boolean
          management_fee_pct?: number | null
          manager_team_depth?: string | null
          name: string
          owner_hours_per_week?: number | null
          owner_id: string
          owner_in_customer_relationships?: boolean | null
          owner_in_operations?: boolean | null
          owner_in_sales?: boolean | null
          public_id?: string
          reason_for_sale?: string | null
          recurring_revenue_pct?: number | null
          region?: string | null
          replacement_reserve_pct?: number | null
          sop_status?: string | null
          sub_industry?: string | null
          top_customer_concentration_pct?: number | null
          updated_at?: string
          years_in_business?: number | null
        }
        Update: {
          anonymous_description?: string | null
          asking_price_high?: number | null
          asking_price_low?: number | null
          business_category?: string | null
          cap_rate_high?: number | null
          cap_rate_low?: number | null
          cap_rate_selected?: number | null
          created_at?: string
          employees?: number | null
          exit_timeline?: Database["public"]["Enums"]["exit_timeline"] | null
          id?: string
          industry?: string | null
          is_sample?: boolean
          management_fee_pct?: number | null
          manager_team_depth?: string | null
          name?: string
          owner_hours_per_week?: number | null
          owner_id?: string
          owner_in_customer_relationships?: boolean | null
          owner_in_operations?: boolean | null
          owner_in_sales?: boolean | null
          public_id?: string
          reason_for_sale?: string | null
          recurring_revenue_pct?: number | null
          region?: string | null
          replacement_reserve_pct?: number | null
          sop_status?: string | null
          sub_industry?: string | null
          top_customer_concentration_pct?: number | null
          updated_at?: string
          years_in_business?: number | null
        }
        Relationships: []
      }
      buyer_access_requests: {
        Row: {
          business_id: string
          buyer_type: Database["public"]["Enums"]["buyer_type"] | null
          created_at: string
          email: string
          financing_status:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id: string
          message: string | null
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["access_request_status"]
        }
        Insert: {
          business_id: string
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          created_at?: string
          email: string
          financing_status?:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
        }
        Update: {
          business_id?: string
          buyer_type?: Database["public"]["Enums"]["buyer_type"] | null
          created_at?: string
          email?: string
          financing_status?:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["access_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "buyer_access_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_view_settings: {
        Row: {
          business_highlights: Json | null
          business_id: string
          growth_opportunities: Json | null
          is_published: boolean
          show_employee_count: boolean
          show_exact_revenue: boolean
          show_profit_margin: boolean
          show_revenue_chart: boolean
          show_scenarios: boolean
          show_sde: boolean
          show_valuation_breakdown: boolean
          transition_support: string | null
          updated_at: string
        }
        Insert: {
          business_highlights?: Json | null
          business_id: string
          growth_opportunities?: Json | null
          is_published?: boolean
          show_employee_count?: boolean
          show_exact_revenue?: boolean
          show_profit_margin?: boolean
          show_revenue_chart?: boolean
          show_scenarios?: boolean
          show_sde?: boolean
          show_valuation_breakdown?: boolean
          transition_support?: string | null
          updated_at?: string
        }
        Update: {
          business_highlights?: Json | null
          business_id?: string
          growth_opportunities?: Json | null
          is_published?: boolean
          show_employee_count?: boolean
          show_exact_revenue?: boolean
          show_profit_margin?: boolean
          show_revenue_chart?: boolean
          show_scenarios?: boolean
          show_sde?: boolean
          show_valuation_breakdown?: boolean
          transition_support?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_view_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      data_room_files: {
        Row: {
          business_id: string
          category: Database["public"]["Enums"]["data_room_category"]
          filename: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          business_id: string
          category: Database["public"]["Enums"]["data_room_category"]
          filename: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          business_id?: string
          category?: Database["public"]["Enums"]["data_room_category"]
          filename?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_room_files_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_years: {
        Row: {
          addbacks: number | null
          amortization: number | null
          assets: number | null
          business_id: string
          cogs: number | null
          created_at: string
          debt: number | null
          depreciation: number | null
          ebitda: number | null
          gross_profit: number | null
          id: string
          income_taxes: number | null
          interest: number | null
          liabilities: number | null
          net_income: number | null
          operating_expenses: number | null
          owner_salary: number | null
          revenue: number | null
          year: number
        }
        Insert: {
          addbacks?: number | null
          amortization?: number | null
          assets?: number | null
          business_id: string
          cogs?: number | null
          created_at?: string
          debt?: number | null
          depreciation?: number | null
          ebitda?: number | null
          gross_profit?: number | null
          id?: string
          income_taxes?: number | null
          interest?: number | null
          liabilities?: number | null
          net_income?: number | null
          operating_expenses?: number | null
          owner_salary?: number | null
          revenue?: number | null
          year: number
        }
        Update: {
          addbacks?: number | null
          amortization?: number | null
          assets?: number | null
          business_id?: string
          cogs?: number | null
          created_at?: string
          debt?: number | null
          depreciation?: number | null
          ebitda?: number | null
          gross_profit?: number | null
          id?: string
          income_taxes?: number | null
          interest?: number | null
          liabilities?: number | null
          net_income?: number | null
          operating_expenses?: number | null
          owner_salary?: number | null
          revenue?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_years_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          action_steps: Json | null
          business_id: string
          buyer_concern: string | null
          category: string
          created_at: string
          description: string
          difficulty: string
          estimated_impact_high: number | null
          estimated_impact_low: number | null
          id: string
          in_roadmap: boolean
          priority: string
          time_required: string | null
          title: string
          valuation_id: string
        }
        Insert: {
          action_steps?: Json | null
          business_id: string
          buyer_concern?: string | null
          category: string
          created_at?: string
          description: string
          difficulty: string
          estimated_impact_high?: number | null
          estimated_impact_low?: number | null
          id?: string
          in_roadmap?: boolean
          priority: string
          time_required?: string | null
          title: string
          valuation_id: string
        }
        Update: {
          action_steps?: Json | null
          business_id?: string
          buyer_concern?: string | null
          category?: string
          created_at?: string
          description?: string
          difficulty?: string
          estimated_impact_high?: number | null
          estimated_impact_low?: number | null
          id?: string
          in_roadmap?: boolean
          priority?: string
          time_required?: string | null
          title?: string
          valuation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          business_id: string
          created_at: string
          current_value: number | null
          customer_concentration_pct: number | null
          description: string | null
          id: string
          include_in_report: boolean
          manager_hired: boolean | null
          name: string
          owner_involvement_pct: number | null
          profit_margin_pct: number | null
          projected_value: number | null
          recurring_revenue_pct: number | null
          revenue_growth_pct: number | null
          sop_score: number | null
          timeline_months: number | null
          updated_at: string
          value_delta: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          current_value?: number | null
          customer_concentration_pct?: number | null
          description?: string | null
          id?: string
          include_in_report?: boolean
          manager_hired?: boolean | null
          name: string
          owner_involvement_pct?: number | null
          profit_margin_pct?: number | null
          projected_value?: number | null
          recurring_revenue_pct?: number | null
          revenue_growth_pct?: number | null
          sop_score?: number | null
          timeline_months?: number | null
          updated_at?: string
          value_delta?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          current_value?: number | null
          customer_concentration_pct?: number | null
          description?: string | null
          id?: string
          include_in_report?: boolean
          manager_hired?: boolean | null
          name?: string
          owner_involvement_pct?: number | null
          profit_margin_pct?: number | null
          projected_value?: number | null
          recurring_revenue_pct?: number | null
          revenue_growth_pct?: number | null
          sop_score?: number | null
          timeline_months?: number | null
          updated_at?: string
          value_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      valuations: {
        Row: {
          asset_high: number | null
          asset_low: number | null
          asset_value: number | null
          business_id: string
          comparable_value: number | null
          computed_at: string
          created_at: string
          dcf_high: number | null
          dcf_low: number | null
          dcf_value: number | null
          ebitda_high: number | null
          ebitda_low: number | null
          ebitda_value: number | null
          health_breakdown: Json | null
          health_score: number | null
          id: string
          inputs_snapshot: Json | null
          range_high: number | null
          range_low: number | null
          range_mid: number | null
          revenue_high: number | null
          revenue_low: number | null
          revenue_value: number | null
          sde_high: number | null
          sde_low: number | null
          sde_value: number | null
        }
        Insert: {
          asset_high?: number | null
          asset_low?: number | null
          asset_value?: number | null
          business_id: string
          comparable_value?: number | null
          computed_at?: string
          created_at?: string
          dcf_high?: number | null
          dcf_low?: number | null
          dcf_value?: number | null
          ebitda_high?: number | null
          ebitda_low?: number | null
          ebitda_value?: number | null
          health_breakdown?: Json | null
          health_score?: number | null
          id?: string
          inputs_snapshot?: Json | null
          range_high?: number | null
          range_low?: number | null
          range_mid?: number | null
          revenue_high?: number | null
          revenue_low?: number | null
          revenue_value?: number | null
          sde_high?: number | null
          sde_low?: number | null
          sde_value?: number | null
        }
        Update: {
          asset_high?: number | null
          asset_low?: number | null
          asset_value?: number | null
          business_id?: string
          comparable_value?: number | null
          computed_at?: string
          created_at?: string
          dcf_high?: number | null
          dcf_low?: number | null
          dcf_value?: number | null
          ebitda_high?: number | null
          ebitda_low?: number | null
          ebitda_value?: number | null
          health_breakdown?: Json | null
          health_score?: number | null
          id?: string
          inputs_snapshot?: Json | null
          range_high?: number | null
          range_low?: number | null
          range_mid?: number | null
          revenue_high?: number | null
          revenue_low?: number | null
          revenue_value?: number | null
          sde_high?: number | null
          sde_low?: number | null
          sde_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_connections: {
        Row: {
          access_token: string
          business_id: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          tenant_id: string
          tenant_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          business_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          business_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xero_oauth_states: {
        Row: {
          business_id: string | null
          created_at: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          redirect_uri?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_advisor_of: {
        Args: { _business_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_request_status: "pending" | "approved" | "denied"
      advisor_invite_status: "pending" | "accepted" | "declined" | "revoked"
      app_role: "owner" | "advisor" | "buyer" | "admin"
      buyer_type:
        | "individual"
        | "strategic"
        | "financial"
        | "search_fund"
        | "other"
      data_room_category:
        | "financials"
        | "tax_returns"
        | "lease_real_estate"
        | "equipment"
        | "employees"
        | "customers"
        | "vendors"
        | "legal"
        | "licenses"
        | "operations_manuals"
        | "photos"
      exit_timeline: "lt_1y" | "1_2y" | "2_5y" | "5_plus_y" | "exploring"
      financing_status:
        | "cash"
        | "sba_pre_approved"
        | "sba_unverified"
        | "seller_financing"
        | "other"
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
      access_request_status: ["pending", "approved", "denied"],
      advisor_invite_status: ["pending", "accepted", "declined", "revoked"],
      app_role: ["owner", "advisor", "buyer", "admin"],
      buyer_type: [
        "individual",
        "strategic",
        "financial",
        "search_fund",
        "other",
      ],
      data_room_category: [
        "financials",
        "tax_returns",
        "lease_real_estate",
        "equipment",
        "employees",
        "customers",
        "vendors",
        "legal",
        "licenses",
        "operations_manuals",
        "photos",
      ],
      exit_timeline: ["lt_1y", "1_2y", "2_5y", "5_plus_y", "exploring"],
      financing_status: [
        "cash",
        "sba_pre_approved",
        "sba_unverified",
        "seller_financing",
        "other",
      ],
    },
  },
} as const
