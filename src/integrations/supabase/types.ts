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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_otp: {
        Row: {
          created_at: string
          enabled: boolean
          secret: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          secret: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          secret?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          brand: string | null
          category: string | null
          created_at: string
          device: string | null
          event: string
          id: string
          session_id: string | null
          step: number | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          created_at?: string
          device?: string | null
          event: string
          id?: string
          session_id?: string | null
          step?: number | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          created_at?: string
          device?: string | null
          event?: string
          id?: string
          session_id?: string | null
          step?: number | null
        }
        Relationships: []
      }
      catalog_brands: {
        Row: {
          active: boolean
          name: string
          slug: string
          sort: number
          tag: string
        }
        Insert: {
          active?: boolean
          name: string
          slug: string
          sort?: number
          tag?: string
        }
        Update: {
          active?: boolean
          name?: string
          slug?: string
          sort?: number
          tag?: string
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          active: boolean
          label: string
          slug: string
          sort: number
        }
        Insert: {
          active?: boolean
          label: string
          slug: string
          sort?: number
        }
        Update: {
          active?: boolean
          label?: string
          slug?: string
          sort?: number
        }
        Relationships: []
      }
      catalog_devices: {
        Row: {
          active: boolean
          brand_slug: string
          category_slug: string
          created_at: string
          name: string
          series: string
          slug: string
          sort: number
          updated_at: string
          year: number
        }
        Insert: {
          active?: boolean
          brand_slug: string
          category_slug: string
          created_at?: string
          name: string
          series?: string
          slug: string
          sort?: number
          updated_at?: string
          year?: number
        }
        Update: {
          active?: boolean
          brand_slug?: string
          category_slug?: string
          created_at?: string
          name?: string
          series?: string
          slug?: string
          sort?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "catalog_devices_brand_slug_fkey"
            columns: ["brand_slug"]
            isOneToOne: false
            referencedRelation: "catalog_brands"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "catalog_devices_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      catalog_faults: {
        Row: {
          device_slug: string
          duration: string
          id: number
          label: string
          part: string
          price: number
          slug: string
          sort: number
          warranty: string
        }
        Insert: {
          device_slug: string
          duration?: string
          id?: number
          label: string
          part?: string
          price?: number
          slug: string
          sort?: number
          warranty?: string
        }
        Update: {
          device_slug?: string
          duration?: string
          id?: number
          label?: string
          part?: string
          price?: number
          slug?: string
          sort?: number
          warranty?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_faults_device_slug_fkey"
            columns: ["device_slug"]
            isOneToOne: false
            referencedRelation: "catalog_devices"
            referencedColumns: ["slug"]
          },
        ]
      }
      catalog_photos: {
        Row: {
          alt: string
          device_slug: string
          id: number
          sort: number
          url: string
        }
        Insert: {
          alt?: string
          device_slug: string
          id?: number
          sort?: number
          url: string
        }
        Update: {
          alt?: string
          device_slug?: string
          id?: number
          sort?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_photos_device_slug_fkey"
            columns: ["device_slug"]
            isOneToOne: false
            referencedRelation: "catalog_devices"
            referencedColumns: ["slug"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
          reference: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          reference?: string | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          reference?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservation_attachments: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          kind: string
          reservation_id: string
          stage: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          reservation_id: string
          stage?: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          kind?: string
          reservation_id?: string
          stage?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_attachments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["reservation_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: Database["public"]["Enums"]["reservation_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["reservation_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["reservation_status"] | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_status_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string
          customer_name: string
          device: string
          email: string | null
          estimated_delivery: string | null
          id: string
          issue: string
          message: string | null
          mode: string
          payment: string
          phone: string
          reference: string
          slot_date: string
          slot_hour: string | null
          slot_period: Database["public"]["Enums"]["slot_period"]
          staff_notes: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          tracking_code_hash: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          device: string
          email?: string | null
          id?: string
          issue: string
          message?: string | null
          mode?: string
          payment?: string
          phone: string
          reference?: string
          slot_date: string
          slot_hour?: string | null
          slot_period: Database["public"]["Enums"]["slot_period"]
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tracking_code_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          device?: string
          email?: string | null
          estimated_delivery?: string | null
          id?: string
          issue?: string
          message?: string | null
          mode?: string
          payment?: string
          phone?: string
          reference?: string
          slot_date?: string
          slot_hour?: string | null
          slot_period?: Database["public"]["Enums"]["slot_period"]
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          tracking_code_hash?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      slot_capacity: {
        Row: {
          capacity: number
          period: Database["public"]["Enums"]["slot_period"]
          weekday: number
        }
        Insert: {
          capacity?: number
          period: Database["public"]["Enums"]["slot_period"]
          weekday: number
        }
        Update: {
          capacity?: number
          period?: Database["public"]["Enums"]["slot_period"]
          weekday?: number
        }
        Relationships: []
      }
      technician_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          note: string | null
          reservation_id: string
          technician_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reservation_id: string
          technician_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reservation_id?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_assignments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_assignments_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      booked_hours: {
        Args: { _from: string; _to: string; _mode?: string }
        Returns: {
          slot_date: string
          slot_hour: string
        }[]
      }
      claim_first_admin: { Args: never; Returns: boolean }
      get_reservation_status: {
        Args: { _reference: string }
        Returns: {
          created_at: string
          device: string
          issue: string
          mode: string
          payment: string
          reference: string
          slot_date: string
          slot_period: Database["public"]["Enums"]["slot_period"]
          status: Database["public"]["Enums"]["reservation_status"]
        }[]
      }
      get_reservation_timeline: {
        Args: { _reference: string }
        Returns: {
          created_at: string
          new_status: Database["public"]["Enums"]["reservation_status"]
          note: string
          old_status: Database["public"]["Enums"]["reservation_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      next_reservation_reference: { Args: never; Returns: string }
      set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
        Returns: boolean
      }
      slot_availability: {
        Args: { _from: string; _to: string; _mode?: string }
        Returns: {
          capacity: number
          period: Database["public"]["Enums"]["slot_period"]
          remaining: number
          slot_date: string
        }[]
      }
      staff_set_reservation_status: {
        Args: {
          _note?: string
          _reservation_id: string
          _status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: boolean
      }
      technician_set_reservation_status: {
        Args: {
          _note?: string
          _reservation_id: string
          _status: Database["public"]["Enums"]["reservation_status"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "technicien" | "user"
      reservation_status:
        | "en_attente"
        | "confirmee"
        | "pieces"
        | "en_cours"
        | "pret"
        | "livre"
        | "terminee"
        | "annulee"
      slot_period: "matin" | "apres-midi"
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
      app_role: ["admin", "staff", "technicien", "user"],
      reservation_status: [
        "en_attente",
        "confirmee",
        "pieces",
        "en_cours",
        "pret",
        "livre",
        "terminee",
        "annulee",
      ],
      slot_period: ["matin", "apres-midi"],
    },
  },
} as const
