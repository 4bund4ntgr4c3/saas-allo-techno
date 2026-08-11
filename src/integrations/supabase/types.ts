export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      admin_otp: {
        Row: {
          created_at: string;
          enabled: boolean;
          secret: string;
          updated_at: string;
          user_id: string;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          secret: string;
          updated_at?: string;
          user_id: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          secret?: string;
          updated_at?: string;
          user_id?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          body: string;
          category: string;
          date: string;
          excerpt: string;
          id: string;
          locale: string;
          reading_time: string;
          slug: string;
          title: string;
        };
        Insert: {
          body?: string;
          category?: string;
          date: string;
          excerpt: string;
          id?: string;
          locale?: string;
          reading_time?: string;
          slug: string;
          title: string;
        };
        Update: {
          body?: string;
          category?: string;
          date?: string;
          excerpt?: string;
          id?: string;
          locale?: string;
          reading_time?: string;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          low_stock_threshold: number;
          quantity: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          low_stock_threshold?: number;
          quantity?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          low_stock_threshold?: number;
          quantity?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_invites: {
        Row: {
          created_at: string;
          id: string;
          reservation_id: string;
          sent_at: string;
          token: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          reservation_id: string;
          sent_at?: string;
          token: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          reservation_id?: string;
          sent_at?: string;
          token?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string;
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          phone: string;
          rating: number;
          reservation_id: string | null;
          status: string;
          verified: boolean;
        };
        Insert: {
          comment: string;
          created_at?: string;
          customer_name: string;
          email?: string | null;
          id?: string;
          phone: string;
          rating: number;
          reservation_id?: string | null;
          status?: string;
          verified?: boolean;
        };
        Update: {
          comment?: string;
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          phone?: string;
          rating?: number;
          reservation_id?: string | null;
          status?: string;
          verified?: boolean;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          brand: string | null;
          category: string | null;
          created_at: string;
          device: string | null;
          event: string;
          id: string;
          session_id: string | null;
          source: string | null;
          step: number | null;
        };
        Insert: {
          brand?: string | null;
          category?: string | null;
          created_at?: string;
          device?: string | null;
          event: string;
          id?: string;
          session_id?: string | null;
          source?: string | null;
          step?: number | null;
        };
        Update: {
          brand?: string | null;
          category?: string | null;
          created_at?: string;
          device?: string | null;
          event?: string;
          id?: string;
          session_id?: string | null;
          source?: string | null;
          step?: number | null;
        };
        Relationships: [];
      };
      catalog_brands: {
        Row: {
          active: boolean;
          name: string;
          slug: string;
          sort: number;
          tag: string;
        };
        Insert: {
          active?: boolean;
          name: string;
          slug: string;
          sort?: number;
          tag?: string;
        };
        Update: {
          active?: boolean;
          name?: string;
          slug?: string;
          sort?: number;
          tag?: string;
        };
        Relationships: [];
      };
      catalog_categories: {
        Row: {
          active: boolean;
          label: string;
          slug: string;
          sort: number;
        };
        Insert: {
          active?: boolean;
          label: string;
          slug: string;
          sort?: number;
        };
        Update: {
          active?: boolean;
          label?: string;
          slug?: string;
          sort?: number;
        };
        Relationships: [];
      };
      catalog_devices: {
        Row: {
          active: boolean;
          brand_slug: string;
          category_slug: string;
          created_at: string;
          name: string;
          series: string;
          slug: string;
          sort: number;
          updated_at: string;
          year: number;
        };
        Insert: {
          active?: boolean;
          brand_slug: string;
          category_slug: string;
          created_at?: string;
          name: string;
          series?: string;
          slug: string;
          sort?: number;
          updated_at?: string;
          year?: number;
        };
        Update: {
          active?: boolean;
          brand_slug?: string;
          category_slug?: string;
          created_at?: string;
          name?: string;
          series?: string;
          slug?: string;
          sort?: number;
          updated_at?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_devices_brand_slug_fkey";
            columns: ["brand_slug"];
            isOneToOne: false;
            referencedRelation: "catalog_brands";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "catalog_devices_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "catalog_categories";
            referencedColumns: ["slug"];
          },
        ];
      };
      catalog_faults: {
        Row: {
          device_slug: string;
          duration: string;
          id: number;
          label: string;
          part: string;
          price: number;
          slug: string;
          sort: number;
          warranty: string;
        };
        Insert: {
          device_slug: string;
          duration?: string;
          id?: number;
          label: string;
          part?: string;
          price?: number;
          slug: string;
          sort?: number;
          warranty?: string;
        };
        Update: {
          device_slug?: string;
          duration?: string;
          id?: number;
          label?: string;
          part?: string;
          price?: number;
          slug?: string;
          sort?: number;
          warranty?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_faults_device_slug_fkey";
            columns: ["device_slug"];
            isOneToOne: false;
            referencedRelation: "catalog_devices";
            referencedColumns: ["slug"];
          },
        ];
      };
      catalog_photos: {
        Row: {
          alt: string;
          device_slug: string;
          id: number;
          sort: number;
          url: string;
        };
        Insert: {
          alt?: string;
          device_slug: string;
          id?: number;
          sort?: number;
          url: string;
        };
        Update: {
          alt?: string;
          device_slug?: string;
          id?: number;
          sort?: number;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_photos_device_slug_fkey";
            columns: ["device_slug"];
            isOneToOne: false;
            referencedRelation: "catalog_devices";
            referencedColumns: ["slug"];
          },
        ];
      };
      leads: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string | null;
          name: string | null;
          phone: string | null;
          reference: string | null;
          source: string;
          source_detail: string | null;
          status: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string | null;
          name?: string | null;
          phone?: string | null;
          reference?: string | null;
          source: string;
          source_detail?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          message?: string | null;
          name?: string | null;
          phone?: string | null;
          reference?: string | null;
          source?: string;
          source_detail?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          method: string;
          provider_tx_id: string | null;
          reference: string;
          source: string;
          status: Database["public"]["Enums"]["payment_status"];
          tx_id: string | null;
          tx_ref: string | null;
          updated_at: string;
          webhook_payload: Json | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string;
          provider_tx_id?: string | null;
          reference: string;
          source?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          tx_id?: string | null;
          tx_ref?: string | null;
          updated_at?: string;
          webhook_payload?: Json | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string;
          provider_tx_id?: string | null;
          reference?: string;
          source?: string;
          status?: Database["public"]["Enums"]["payment_status"];
          tx_id?: string | null;
          tx_ref?: string | null;
          updated_at?: string;
          webhook_payload?: Json | null;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          label: string | null;
          percent: number;
          single_use: boolean;
          used_count: number;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          active?: boolean;
          code: string;
          created_at?: string;
          label?: string | null;
          percent?: number;
          single_use?: boolean;
          used_count?: number;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          label?: string | null;
          percent?: number;
          single_use?: boolean;
          used_count?: number;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          loyalty_points: number;
          phone: string | null;
          referral_code: string | null;
          referred_by: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          loyalty_points?: number;
          phone?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          loyalty_points?: number;
          phone?: string | null;
          referral_code?: string | null;
          referred_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey";
            columns: ["referred_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_ledger: {
        Row: {
          created_at: string;
          delta: number;
          id: string;
          reason: string;
          reference: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          delta: number;
          id?: string;
          reason: string;
          reference?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          delta?: number;
          id?: string;
          reason?: string;
          reference?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reservation_attachments: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          kind: string;
          reservation_id: string;
          stage: string;
          uploaded_by: string | null;
          url: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          reservation_id: string;
          stage?: string;
          uploaded_by?: string | null;
          url: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          reservation_id?: string;
          stage?: string;
          uploaded_by?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_attachments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservation_attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reservation_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string;
          id: string;
          new_status: Database["public"]["Enums"]["reservation_status"];
          note: string | null;
          old_status: Database["public"]["Enums"]["reservation_status"] | null;
          reservation_id: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_status: Database["public"]["Enums"]["reservation_status"];
          note?: string | null;
          old_status?: Database["public"]["Enums"]["reservation_status"] | null;
          reservation_id: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          id?: string;
          new_status?: Database["public"]["Enums"]["reservation_status"];
          note?: string | null;
          old_status?: Database["public"]["Enums"]["reservation_status"] | null;
          reservation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_status_history_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      reservations: {
        Row: {
          assigned_technician_id: string | null;
          created_at: string;
          customer_name: string;
          delivery_address: string | null;
          delivery_status: Database["public"]["Enums"]["delivery_status"];
          device: string;
          email: string | null;
          estimated_delivery: string | null;
          id: string;
          issue: string;
          message: string | null;
          mode: string;
          payment: string;
          phone: string;
          promo_amount: number | null;
          promo_code: string | null;
          quote_amount: number | null;
          quote_decided_at: string | null;
          quote_status: string;
          quote_token: string | null;
          reference: string;
          slot_date: string;
          slot_hour: string | null;
          slot_period: Database["public"]["Enums"]["slot_period"];
          source: string | null;
          staff_notes: string | null;
          status: Database["public"]["Enums"]["reservation_status"];
          tracking_code_hash: string | null;
          updated_at: string;
          user_id: string | null;
          warranty_months: number;
          payment_ref: string | null;
          payment_status: string;
        };
        Insert: {
          assigned_technician_id?: string | null;
          created_at?: string;
          customer_name: string;
          delivery_address?: string | null;
          delivery_status?: Database["public"]["Enums"]["delivery_status"];
          device: string;
          email?: string | null;
          id?: string;
          issue: string;
          message?: string | null;
          mode?: string;
          payment?: string;
          phone: string;
          promo_amount?: number | null;
          promo_code?: string | null;
          quote_amount?: number | null;
          quote_decided_at?: string | null;
          quote_status?: string;
          quote_token?: string | null;
          reference?: string;
          slot_date: string;
          slot_hour?: string | null;
          slot_period: Database["public"]["Enums"]["slot_period"];
          source?: string | null;
          staff_notes?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          tracking_code_hash?: string | null;
          updated_at?: string;
          user_id?: string | null;
          warranty_months?: number;
          payment_ref?: string | null;
          payment_status?: string;
        };
        Update: {
          assigned_technician_id?: string | null;
          created_at?: string;
          customer_name?: string;
          delivery_address?: string | null;
          delivery_status?: Database["public"]["Enums"]["delivery_status"];
          device?: string;
          email?: string | null;
          estimated_delivery?: string | null;
          id?: string;
          issue?: string;
          message?: string | null;
          mode?: string;
          payment?: string;
          phone?: string;
          promo_amount?: number | null;
          promo_code?: string | null;
          quote_amount?: number | null;
          quote_decided_at?: string | null;
          quote_status?: string;
          quote_token?: string | null;
          reference?: string;
          slot_date?: string;
          slot_hour?: string | null;
          slot_period?: Database["public"]["Enums"]["slot_period"];
          source?: string | null;
          staff_notes?: string | null;
          status?: Database["public"]["Enums"]["reservation_status"];
          tracking_code_hash?: string | null;
          updated_at?: string;
          user_id?: string | null;
          warranty_months?: number;
          payment_ref?: string | null;
          payment_status?: string;
        };
        Relationships: [];
      };
      returns: {
        Row: {
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          item: string;
          note: string | null;
          order_reference: string | null;
          phone: string;
          reason: string;
          reference: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_name: string;
          email?: string | null;
          id?: string;
          item: string;
          note?: string | null;
          order_reference?: string | null;
          phone: string;
          reason: string;
          reference?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          item?: string;
          note?: string | null;
          order_reference?: string | null;
          phone?: string;
          reason?: string;
          reference?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      scheduled_notifications: {
        Row: {
          created_at: string;
          id: string;
          ref: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ref: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ref?: string;
          type?: string;
        };
        Relationships: [];
      };
      slot_capacity: {
        Row: {
          capacity: number;
          period: Database["public"]["Enums"]["slot_period"];
          weekday: number;
        };
        Insert: {
          capacity?: number;
          period: Database["public"]["Enums"]["slot_period"];
          weekday: number;
        };
        Update: {
          capacity?: number;
          period?: Database["public"]["Enums"]["slot_period"];
          weekday?: number;
        };
        Relationships: [];
      };
      technician_assignments: {
        Row: {
          assigned_by: string | null;
          created_at: string;
          id: string;
          note: string | null;
          reservation_id: string;
          technician_id: string | null;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          reservation_id: string;
          technician_id?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string;
          id?: string;
          note?: string | null;
          reservation_id?: string;
          technician_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "technician_assignments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "technician_assignments_technician_id_fkey";
            columns: ["technician_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      warranty_claims: {
        Row: {
          created_at: string;
          device: string | null;
          email: string | null;
          id: string;
          message: string;
          name: string;
          phone: string;
          reference: string;
          reservation_reference: string | null;
          staff_note: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device?: string | null;
          email?: string | null;
          id?: string;
          message: string;
          name: string;
          phone: string;
          reference: string;
          reservation_reference?: string | null;
          staff_note?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device?: string | null;
          email?: string | null;
          id?: string;
          message?: string;
          name?: string;
          phone?: string;
          reference?: string;
          reservation_reference?: string | null;
          staff_note?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      equipment: {
        Row: {
          asset_tag: string | null;
          assigned_to: string | null;
          brand: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          location: string | null;
          model: string | null;
          name: string;
          notes: string | null;
          org_id: string;
          purchase_date: string | null;
          qr_id: string;
          serial_number: string | null;
          site_id: string | null;
          status: Database["public"]["Enums"]["equipment_status"];
          type: string;
          updated_at: string;
          warranty_expires_at: string | null;
        };
        Insert: {
          asset_tag?: string | null;
          assigned_to?: string | null;
          brand?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string | null;
          model?: string | null;
          name: string;
          notes?: string | null;
          org_id: string;
          purchase_date?: string | null;
          qr_id?: string;
          serial_number?: string | null;
          site_id?: string | null;
          status?: Database["public"]["Enums"]["equipment_status"];
          type?: string;
          updated_at?: string;
          warranty_expires_at?: string | null;
        };
        Update: {
          asset_tag?: string | null;
          assigned_to?: string | null;
          brand?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          location?: string | null;
          model?: string | null;
          name?: string;
          notes?: string | null;
          org_id?: string;
          purchase_date?: string | null;
          qr_id?: string;
          serial_number?: string | null;
          site_id?: string | null;
          status?: Database["public"]["Enums"]["equipment_status"];
          type?: string;
          updated_at?: string;
          warranty_expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "equipment_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "workshops";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_documents: {
        Row: {
          created_at: string;
          equipment_id: string;
          id: string;
          mime: string | null;
          name: string;
          size: number | null;
          url: string;
        };
        Insert: {
          created_at?: string;
          equipment_id: string;
          id?: string;
          mime?: string | null;
          name: string;
          size?: number | null;
          url: string;
        };
        Update: {
          created_at?: string;
          equipment_id?: string;
          id?: string;
          mime?: string | null;
          name?: string;
          size?: number | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
        ];
      };
      equipment_history: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          equipment_id: string;
          event: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          equipment_id: string;
          event: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          equipment_id?: string;
          event?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "equipment_history_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          country: string;
          created_at: string;
          created_by: string | null;
          email: string | null;
          equipment_count: number | null;
          id: string;
          name: string;
          phone: string | null;
          registration_number: string | null;
          sector: string | null;
          site_count: number | null;
          size: string | null;
          status: Database["public"]["Enums"]["org_status"];
          trade_name: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          equipment_count?: number | null;
          id?: string;
          name: string;
          phone?: string | null;
          registration_number?: string | null;
          sector?: string | null;
          site_count?: number | null;
          size?: string | null;
          status?: Database["public"]["Enums"]["org_status"];
          trade_name?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          country?: string;
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          equipment_count?: number | null;
          id?: string;
          name?: string;
          phone?: string | null;
          registration_number?: string | null;
          sector?: string | null;
          site_count?: number | null;
          size?: string | null;
          status?: Database["public"]["Enums"]["org_status"];
          trade_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          created_at: string;
          id: string;
          organization_id: string;
          role: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["org_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      warranties: {
        Row: {
          coverage: string | null;
          created_at: string;
          end_date: string | null;
          equipment_id: string;
          id: string;
          provider: string | null;
          start_date: string | null;
        };
        Insert: {
          coverage?: string | null;
          created_at?: string;
          end_date?: string | null;
          equipment_id: string;
          id?: string;
          provider?: string | null;
          start_date?: string | null;
        };
        Update: {
          coverage?: string | null;
          created_at?: string;
          end_date?: string | null;
          equipment_id?: string;
          id?: string;
          provider?: string | null;
          start_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "warranties_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
        ];
      };
      workshops: {
        Row: {
          active: boolean | null;
          address: string | null;
          city: string;
          created_at: string | null;
          departments: string[];
          email: string | null;
          id: string;
          lat: number | null;
          lng: number | null;
          manager: string | null;
          name: string;
          opening_hours: Json | null;
          org_id: string | null;
          phone: string;
          timezone: string | null;
        };
        Insert: {
          active?: boolean | null;
          address?: string | null;
          city: string;
          created_at?: string | null;
          departments?: string[];
          email?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          manager?: string | null;
          name: string;
          opening_hours?: Json | null;
          org_id?: string | null;
          phone: string;
          timezone?: string | null;
        };
        Update: {
          active?: boolean | null;
          address?: string | null;
          city?: string;
          created_at?: string | null;
          departments?: string[];
          email?: string | null;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          manager?: string | null;
          name?: string;
          opening_hours?: Json | null;
          org_id?: string | null;
          phone?: string;
          timezone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workshops_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_loyalty_points: {
        Args: {
          _user_id: string;
          _delta: number;
          _reason: string;
          _reference: string;
        };
        Returns: undefined;
      };
      add_equipment_history: {
        Args: { _equipment_id: string; _event: string; _description?: string | null };
        Returns: string;
      };
      booked_hours: {
        Args: { _from: string; _to: string; _mode?: string };
        Returns: {
          slot_date: string;
          slot_hour: string;
        }[];
      };
      claim_first_admin: { Args: never; Returns: boolean };
      create_equipment: {
        Args: {
          _org_id: string;
          _name: string;
          _type?: string;
          _brand?: string | null;
          _model?: string | null;
          _serial_number?: string | null;
          _asset_tag?: string | null;
          _site_id?: string | null;
          _purchase_date?: string | null;
          _warranty_expires_at?: string | null;
          _assigned_to?: string | null;
          _location?: string | null;
          _notes?: string | null;
        };
        Returns: string;
      };
      create_org_site: {
        Args: {
          _org_id: string;
          _name: string;
          _address?: string | null;
          _city?: string | null;
          _phone?: string | null;
          _email?: string | null;
          _manager?: string | null;
          _opening_hours?: Json | null;
          _departments?: string[] | null;
        };
        Returns: string;
      };
      create_organization: {
        Args: {
          _name: string;
          _trade_name?: string | null;
          _registration_number?: string | null;
          _address?: string | null;
          _country?: string | null;
          _phone?: string | null;
          _email?: string | null;
          _sector?: string | null;
          _size?: string | null;
          _site_count?: number | null;
          _equipment_count?: number | null;
        };
        Returns: string;
      };
      delete_org_site: { Args: { _site_id: string }; Returns: boolean };
      decrement_inventory: {
        Args: { _slug: string; _qty: number };
        Returns: boolean;
      };
      delete_equipment: { Args: { _equipment_id: string }; Returns: boolean };
      delete_warranty: { Args: { _warranty_id: string }; Returns: boolean };
      ensure_referral_code: {
        Args: { _user_id: string; _code: string };
        Returns: string | null;
      };
      get_reservation_status: {
        Args: { _reference: string };
        Returns: {
          created_at: string;
          device: string;
          issue: string;
          mode: string;
          payment: string;
          reference: string;
          slot_date: string;
          slot_period: Database["public"]["Enums"]["slot_period"];
          status: Database["public"]["Enums"]["reservation_status"];
        }[];
      };
      get_equipment: { Args: { _equipment_id: string }; Returns: Json };
      get_equipment_by_qr: {
        Args: { _qr_id: string };
        Returns: {
          brand: string | null;
          id: string;
          model: string | null;
          name: string;
          org_id: string;
          org_name: string;
          qr_id: string;
          status: Database["public"]["Enums"]["equipment_status"];
          type: string;
        }[];
      };
      get_org_equipment: {
        Args: {
          _org_id: string;
          _search?: string | null;
          _status?: Database["public"]["Enums"]["equipment_status"] | null;
        };
        Returns: {
          asset_tag: string | null;
          assigned_to: string | null;
          brand: string | null;
          created_at: string;
          id: string;
          location: string | null;
          model: string | null;
          name: string;
          qr_id: string;
          serial_number: string | null;
          site_name: string | null;
          status: Database["public"]["Enums"]["equipment_status"];
          type: string;
        }[];
      };
      get_org_sites: {
        Args: { _org_id: string };
        Returns: {
          active: boolean | null;
          address: string | null;
          city: string;
          departments: string[];
          equipment_count: number;
          id: string;
          manager: string | null;
          name: string;
          phone: string;
        }[];
      };
      get_user_orgs: { Args: never; Returns: string };
      get_org_members: { Args: { _org_id: string }; Returns: string };
      invite_org_member: {
        Args: { _org_id: string; _email: string; _role?: Database["public"]["Enums"]["org_role"] };
        Returns: boolean;
      };
      org_is_admin: { Args: { _org_id: string }; Returns: boolean };
      org_is_member: { Args: { _org_id: string }; Returns: boolean };
      org_role_of: { Args: { _org_id: string }; Returns: Database["public"]["Enums"]["org_role"] };
      remove_org_member: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      set_equipment_status: {
        Args: {
          _equipment_id: string;
          _status: Database["public"]["Enums"]["equipment_status"];
          _reason?: string | null;
        };
        Returns: boolean;
      };
      set_org_member_role: {
        Args: { _org_id: string; _user_id: string; _role: Database["public"]["Enums"]["org_role"] };
        Returns: boolean;
      };
      update_equipment: {
        Args: {
          _equipment_id: string;
          _name?: string | null;
          _type?: string | null;
          _brand?: string | null;
          _model?: string | null;
          _serial_number?: string | null;
          _asset_tag?: string | null;
          _site_id?: string | null;
          _purchase_date?: string | null;
          _warranty_expires_at?: string | null;
          _assigned_to?: string | null;
          _location?: string | null;
          _notes?: string | null;
        };
        Returns: boolean;
      };
      update_org_site: {
        Args: {
          _site_id: string;
          _name?: string | null;
          _address?: string | null;
          _city?: string | null;
          _phone?: string | null;
          _email?: string | null;
          _manager?: string | null;
          _opening_hours?: Json | null;
          _departments?: string[] | null;
          _active?: boolean | null;
        };
        Returns: boolean;
      };
      update_organization: {
        Args: {
          _org_id: string;
          _name?: string;
          _trade_name?: string | null;
          _registration_number?: string | null;
          _address?: string | null;
          _country?: string | null;
          _phone?: string | null;
          _email?: string | null;
          _sector?: string | null;
          _size?: string | null;
          _site_count?: number | null;
          _equipment_count?: number | null;
        };
        Returns: boolean;
      };
      upsert_warranty: {
        Args: {
          _equipment_id: string;
          _warranty_id?: string | null;
          _provider?: string | null;
          _start_date?: string | null;
          _end_date?: string | null;
          _coverage?: string | null;
        };
        Returns: string;
      };
      get_reservation_timeline: {
        Args: { _reference: string };
        Returns: {
          created_at: string;
          new_status: Database["public"]["Enums"]["reservation_status"];
          note: string;
          old_status: Database["public"]["Enums"]["reservation_status"];
        }[];
      };
      get_reservation_comments: {
        Args: { _reference: string; _code: string };
        Returns: {
          id: string;
          author: string;
          author_name: string | null;
          body: string;
          created_at: string;
        }[];
      };
      add_reservation_comment: {
        Args: {
          _reference: string;
          _code: string;
          _author?: string;
          _author_name?: string | null;
          _body: string;
        };
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      next_claim_reference: { Args: never; Returns: string };
      next_reservation_reference: { Args: never; Returns: string };
      next_shop_reference: { Args: never; Returns: string };
      respond_to_quote: {
        Args: { _token: string; _approve: boolean };
        Returns: boolean;
      };
      set_delivery_status: {
        Args: { _reservation_id: string; _status: string; _address: string };
        Returns: boolean;
      };
      set_user_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string };
        Returns: boolean;
      };
      slot_availability: {
        Args: { _from: string; _to: string; _mode?: string };
        Returns: {
          capacity: number;
          period: Database["public"]["Enums"]["slot_period"];
          remaining: number;
          slot_date: string;
        }[];
      };
      staff_send_quote: {
        Args: {
          _reservation_id: string;
          _amount: number;
          _warranty_months?: number;
        };
        Returns: boolean;
      };
      staff_set_reservation_status: {
        Args: {
          _note?: string;
          _reservation_id: string;
          _status: Database["public"]["Enums"]["reservation_status"];
        };
        Returns: boolean;
      };
      technician_set_reservation_status: {
        Args: {
          _note?: string;
          _reservation_id: string;
          _status: Database["public"]["Enums"]["reservation_status"];
        };
        Returns: boolean;
      };
      update_payment_status: {
        Args: { _reference: string; _status: string; _tx_id: string };
        Returns: undefined;
      };
      update_reservation_payment: {
        Args: { _reference: string; _status: string; _tx_id: string };
        Returns: undefined;
      };
      validate_promo: {
        Args: { _code: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: "admin" | "staff" | "technicien" | "user";
      delivery_status: "non_applicable" | "a_planifier" | "en_route" | "livre";
      equipment_status: "actif" | "en_panne" | "maintenance" | "garantie" | "retire";
      org_role:
        | "admin_org"
        | "responsable_maintenance"
        | "responsable_site"
        | "comptabilite"
        | "lecture_seule"
        | "membre";
      org_status: "pending" | "active" | "suspended";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      reservation_status:
        | "en_attente"
        | "confirmee"
        | "pieces"
        | "en_cours"
        | "pret"
        | "livre"
        | "terminee"
        | "annulee";
      slot_period: "matin" | "apres-midi";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "technicien", "user"],
      equipment_status: ["actif", "en_panne", "maintenance", "garantie", "retire"],
      org_role: [
        "admin_org",
        "responsable_maintenance",
        "responsable_site",
        "comptabilite",
        "lecture_seule",
        "membre",
      ],
      org_status: ["pending", "active", "suspended"],
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
} as const;
