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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_description: string
          action_type: string
          amount: number | null
          category: string | null
          created_at: string
          fund_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          amount?: number | null
          category?: string | null
          created_at?: string
          fund_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          amount?: number | null
          category?: string | null
          created_at?: string
          fund_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      budget_alerts: {
        Row: {
          budget_id: string
          created_at: string
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          threshold: number
          user_id: string
        }
        Insert: {
          budget_id: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          threshold?: number
          user_id: string
        }
        Update: {
          budget_id?: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          threshold?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alerts_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          carry_forward: boolean | null
          category: string
          created_at: string
          family_id: string | null
          id: string
          is_shared: boolean | null
          monthly_income: number
          period: string
          user_id: string
        }
        Insert: {
          amount: number
          carry_forward?: boolean | null
          category: string
          created_at?: string
          family_id?: string | null
          id?: string
          is_shared?: boolean | null
          monthly_income?: number
          period: string
          user_id: string
        }
        Update: {
          amount?: number
          carry_forward?: boolean | null
          category?: string
          created_at?: string
          family_id?: string | null
          id?: string
          is_shared?: boolean | null
          monthly_income?: number
          period?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_user: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_user?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_user?: boolean
          user_id?: string
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          color: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          family_id: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          payment: string | null
          receipt_url: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description: string
          family_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment?: string | null
          receipt_url?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          family_id?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          payment?: string | null
          receipt_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          family_id: string
          family_name: string | null
          id: string
          invited_by: string
          invited_user_id: string | null
          inviter_name: string | null
          member_name: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          family_id: string
          family_name?: string | null
          id?: string
          invited_by: string
          invited_user_id?: string | null
          inviter_name?: string | null
          member_name?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          family_id?: string
          family_name?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string | null
          inviter_name?: string | null
          member_name?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invitations_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          deadline: string
          family_id: string | null
          id: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_amount?: number
          deadline: string
          family_id?: string | null
          id?: string
          target_amount: number
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          deadline?: string
          family_id?: string | null
          id?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          loan_id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          loan_id: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          loan_id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount: number
          created_at: string
          id: string
          loan_id: string
          note: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          loan_id: string
          note?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          loan_id?: string
          note?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          family_id: string | null
          id: string
          loan_type: string
          note: string | null
          person_name: string
          remaining_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          family_id?: string | null
          id?: string
          loan_type: string
          note?: string | null
          person_name: string
          remaining_amount: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          family_id?: string | null
          id?: string
          loan_type?: string
          note?: string | null
          person_name?: string
          remaining_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_incomes: {
        Row: {
          created_at: string
          family_id: string | null
          id: string
          income_amount: number
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id?: string | null
          id?: string
          income_amount?: number
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string | null
          id?: string
          income_amount?: number
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_incomes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_analytics: {
        Row: {
          ai_reasoning: string | null
          financial_context: Json | null
          id: string
          notification_type: string
          priority_score: number
          sent_at: string | null
          user_id: string | null
          user_timezone: string | null
        }
        Insert: {
          ai_reasoning?: string | null
          financial_context?: Json | null
          id?: string
          notification_type: string
          priority_score: number
          sent_at?: string | null
          user_id?: string | null
          user_timezone?: string | null
        }
        Update: {
          ai_reasoning?: string | null
          financial_context?: Json | null
          id?: string
          notification_type?: string
          priority_score?: number
          sent_at?: string | null
          user_id?: string | null
          user_timezone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          email_sent: boolean | null
          expense_total: number | null
          id: string
          notification_type: string
          sent_at: string | null
          tip_id: string | null
          user_id: string
        }
        Insert: {
          email_sent?: boolean | null
          expense_total?: number | null
          id?: string
          notification_type: string
          sent_at?: string | null
          tip_id?: string | null
          user_id: string
        }
        Update: {
          email_sent?: boolean | null
          expense_total?: number | null
          id?: string
          notification_type?: string
          sent_at?: string | null
          tip_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          data: Json | null
          id: string
          results: Json | null
          sent_at: string
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          data?: Json | null
          id?: string
          results?: Json | null
          sent_at?: string
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          data?: Json | null
          id?: string
          results?: Json | null
          sent_at?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          code?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          code?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_family_id: string | null
          age: number | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          income_date: number
          last_login_at: string | null
          last_notification_date: string | null
          monthly_income: number | null
          notification_preferences: Json | null
          notification_time: string | null
          notification_timezone: string | null
          notifications_enabled: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          preferred_currency: string | null
        }
        Insert: {
          active_family_id?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          income_date?: number
          last_login_at?: string | null
          last_notification_date?: string | null
          monthly_income?: number | null
          notification_preferences?: Json | null
          notification_time?: string | null
          notification_timezone?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          preferred_currency?: string | null
        }
        Update: {
          active_family_id?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          income_date?: number
          last_login_at?: string | null
          last_notification_date?: string | null
          monthly_income?: number | null
          notification_preferences?: Json | null
          notification_time?: string | null
          notification_timezone?: string | null
          notifications_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          preferred_currency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_family_id_fkey"
            columns: ["active_family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receipt_extractions: {
        Row: {
          created_at: string
          date: string
          extraction_metadata: Json | null
          id: string
          merchant: string
          payment_method: string | null
          receipt_text: string | null
          receipt_url: string | null
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          extraction_metadata?: Json | null
          id?: string
          merchant?: string
          payment_method?: string | null
          receipt_text?: string | null
          receipt_url?: string | null
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          extraction_metadata?: Json | null
          id?: string
          merchant?: string
          payment_method?: string | null
          receipt_text?: string | null
          receipt_url?: string | null
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          name: string
          receipt_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          name: string
          receipt_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipt_extractions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
          trigger_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          trigger_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          trigger_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_carryover_preferences: {
        Row: {
          auto_carryover_enabled: boolean | null
          created_at: string | null
          id: string
          processed_months: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_carryover_enabled?: boolean | null
          created_at?: string | null
          id?: string
          processed_months?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_carryover_enabled?: boolean | null
          created_at?: string | null
          id?: string
          processed_months?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_device_tokens: {
        Row: {
          created_at: string | null
          device_token: string
          failed_attempts: number | null
          id: string
          last_failure_at: string | null
          platform: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_token: string
          failed_attempts?: number | null
          id?: string
          last_failure_at?: string | null
          platform: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_token?: string
          failed_attempts?: number | null
          id?: string
          last_failure_at?: string | null
          platform?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      wallet_additions: {
        Row: {
          amount: number
          carryover_month: string | null
          created_at: string
          date: string
          description: string | null
          family_id: string | null
          fund_type: string | null
          id: string
          is_deleted_by_user: boolean | null
          user_id: string
        }
        Insert: {
          amount: number
          carryover_month?: string | null
          created_at?: string
          date?: string
          description?: string | null
          family_id?: string | null
          fund_type?: string | null
          id?: string
          is_deleted_by_user?: boolean | null
          user_id: string
        }
        Update: {
          amount?: number
          carryover_month?: string | null
          created_at?: string
          date?: string
          description?: string | null
          family_id?: string | null
          fund_type?: string | null
          id?: string
          is_deleted_by_user?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_additions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_random_tip: { Args: { category_filter?: string }; Returns: string }
      get_user_family_ids: {
        Args: { _user_id: string }
        Returns: {
          family_id: string
        }[]
      }
      has_family_role: {
        Args: {
          _family_id: string
          _role: Database["public"]["Enums"]["family_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      trigger_daily_notifications: { Args: never; Returns: undefined }
    }
    Enums: {
      family_role: "owner" | "admin" | "member"
      invitation_status: "pending" | "accepted" | "expired" | "rejected"
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
      family_role: ["owner", "admin", "member"],
      invitation_status: ["pending", "accepted", "expired", "rejected"],
    },
  },
} as const
