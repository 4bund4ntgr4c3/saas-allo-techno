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
      api_keys: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          id: string;
          key_hash: string;
          last_used_at: string | null;
          name: string;
          rate_limit: number | null;
          scopes: string[] | null;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          id?: string;
          key_hash: string;
          last_used_at?: string | null;
          name: string;
          rate_limit?: number | null;
          scopes?: string[] | null;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          id?: string;
          key_hash?: string;
          last_used_at?: string | null;
          name?: string;
          rate_limit?: number | null;
          scopes?: string[] | null;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          action: string;
          created_at: string | null;
          details: Json | null;
          entity: string;
          entity_id: string | null;
          id: string;
          ip_address: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          details?: Json | null;
          entity: string;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          details?: Json | null;
          entity?: string;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          user_id?: string | null;
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
      campaign_sends: {
        Row: {
          campaign_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          recipient_email: string | null;
          recipient_name: string | null;
          recipient_phone: string | null;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          campaign_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          campaign_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          recipient_email?: string | null;
          recipient_name?: string | null;
          recipient_phone?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "marketing_campaigns";
            referencedColumns: ["id"];
          },
        ];
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
      chat_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          read_at: string | null;
          reservation_id: string | null;
          sender_id: string | null;
          sender_type: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          read_at?: string | null;
          reservation_id?: string | null;
          sender_id?: string | null;
          sender_type?: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          read_at?: string | null;
          reservation_id?: string | null;
          sender_id?: string | null;
          sender_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
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
      escalation_events: {
        Row: {
          customer_name: string;
          device: string;
          from_status: string;
          id: string;
          notified_roles: string[];
          reassigned_to: string | null;
          reference: string;
          reservation_id: string | null;
          triggered_at: string | null;
        };
        Insert: {
          customer_name: string;
          device: string;
          from_status: string;
          id?: string;
          notified_roles?: string[];
          reassigned_to?: string | null;
          reference: string;
          reservation_id?: string | null;
          triggered_at?: string | null;
        };
        Update: {
          customer_name?: string;
          device?: string;
          from_status?: string;
          id?: string;
          notified_roles?: string[];
          reassigned_to?: string | null;
          reference?: string;
          reservation_id?: string | null;
          triggered_at?: string | null;
        };
        Relationships: [];
      };
      escalation_rules: {
        Row: {
          active: boolean | null;
          auto_reassign: boolean | null;
          escalate_after_hours: number;
          id: string;
          notify_roles: string[];
          sla_stage: string;
        };
        Insert: {
          active?: boolean | null;
          auto_reassign?: boolean | null;
          escalate_after_hours: number;
          id?: string;
          notify_roles?: string[];
          sla_stage: string;
        };
        Update: {
          active?: boolean | null;
          auto_reassign?: boolean | null;
          escalate_after_hours?: number;
          id?: string;
          notify_roles?: string[];
          sla_stage?: string;
        };
        Relationships: [];
      };
      extended_warranties: {
        Row: {
          created_at: string | null;
          customer_name: string;
          device: string;
          end_date: string;
          id: string;
          phone: string;
          price: number;
          reservation_id: string | null;
          start_date: string;
          status: string | null;
          warranty_months: number;
        };
        Insert: {
          created_at?: string | null;
          customer_name: string;
          device: string;
          end_date: string;
          id?: string;
          phone: string;
          price: number;
          reservation_id?: string | null;
          start_date: string;
          status?: string | null;
          warranty_months: number;
        };
        Update: {
          created_at?: string | null;
          customer_name?: string;
          device?: string;
          end_date?: string;
          id?: string;
          phone?: string;
          price?: number;
          reservation_id?: string | null;
          start_date?: string;
          status?: string | null;
          warranty_months?: number;
        };
        Relationships: [
          {
            foreignKeyName: "extended_warranties_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          description: string | null;
          enabled: boolean;
          key: string;
          updated_at: string;
        };
        Insert: {
          description?: string | null;
          enabled?: boolean;
          key: string;
          updated_at?: string;
        };
        Update: {
          description?: string | null;
          enabled?: boolean;
          key?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      google_reviews_cache: {
        Row: {
          data: Json;
          fetched_at: string | null;
          id: number;
        };
        Insert: {
          data: Json;
          fetched_at?: string | null;
          id?: number;
        };
        Update: {
          data?: Json;
          fetched_at?: string | null;
          id?: number;
        };
        Relationships: [];
      };
      handoff_signatures: {
        Row: {
          customer_name: string;
          id: string;
          ip_address: string | null;
          reservation_id: string;
          signature_data_url: string;
          signed_at: string;
        };
        Insert: {
          customer_name: string;
          id?: string;
          ip_address?: string | null;
          reservation_id: string;
          signature_data_url: string;
          signed_at?: string;
        };
        Update: {
          customer_name?: string;
          id?: string;
          ip_address?: string | null;
          reservation_id?: string;
          signature_data_url?: string;
          signed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "handoff_signatures_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: true;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_notifications: {
        Row: {
          created_at: string | null;
          id: string;
          message: string;
          read: boolean | null;
          reservation_id: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message: string;
          read?: boolean | null;
          reservation_id?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message?: string;
          read?: boolean | null;
          reservation_id?: string | null;
          title?: string;
          type?: string;
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
      inventory_parts: {
        Row: {
          active: boolean | null;
          brand: string | null;
          category: string | null;
          created_at: string | null;
          id: string;
          location: string | null;
          min_quantity: number | null;
          model: string | null;
          name: string;
          quantity: number | null;
          sku: string;
          supplier_id: string | null;
          unit_price: number | null;
        };
        Insert: {
          active?: boolean | null;
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          location?: string | null;
          min_quantity?: number | null;
          model?: string | null;
          name: string;
          quantity?: number | null;
          sku: string;
          supplier_id?: string | null;
          unit_price?: number | null;
        };
        Update: {
          active?: boolean | null;
          brand?: string | null;
          category?: string | null;
          created_at?: string | null;
          id?: string;
          location?: string | null;
          min_quantity?: number | null;
          model?: string | null;
          name?: string;
          quantity?: number | null;
          sku?: string;
          supplier_id?: string | null;
          unit_price?: number | null;
        };
        Relationships: [];
      };
      kb_articles: {
        Row: {
          author: string;
          category: string;
          content: string;
          created_at: string | null;
          helpful: number | null;
          id: string;
          tags: string[];
          title: string;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          author: string;
          category: string;
          content: string;
          created_at?: string | null;
          helpful?: number | null;
          id?: string;
          tags?: string[];
          title: string;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          author?: string;
          category?: string;
          content?: string;
          created_at?: string | null;
          helpful?: number | null;
          id?: string;
          tags?: string[];
          title?: string;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          message: string | null;
          name: string | null;
          org_id: string | null;
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
          org_id?: string | null;
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
          org_id?: string | null;
          phone?: string | null;
          reference?: string | null;
          source?: string;
          source_detail?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
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
      marketing_campaigns: {
        Row: {
          body: string;
          click_count: number | null;
          created_at: string;
          created_by: string | null;
          error_count: number | null;
          id: string;
          name: string;
          open_count: number | null;
          segment_filter: Json | null;
          sent_at: string | null;
          sent_count: number | null;
          status: string;
          subject: string | null;
          template_id: string | null;
          type: string;
        };
        Insert: {
          body: string;
          click_count?: number | null;
          created_at?: string;
          created_by?: string | null;
          error_count?: number | null;
          id?: string;
          name: string;
          open_count?: number | null;
          segment_filter?: Json | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string;
          subject?: string | null;
          template_id?: string | null;
          type: string;
        };
        Update: {
          body?: string;
          click_count?: number | null;
          created_at?: string;
          created_by?: string | null;
          error_count?: number | null;
          id?: string;
          name?: string;
          open_count?: number | null;
          segment_filter?: Json | null;
          sent_at?: string | null;
          sent_count?: number | null;
          status?: string;
          subject?: string | null;
          template_id?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          active: boolean;
          email: string;
          id: string;
          locale: string;
          subscribed_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          active?: boolean;
          email: string;
          id?: string;
          locale?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          active?: boolean;
          email?: string;
          id?: string;
          locale?: string;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
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
      outbound_webhooks: {
        Row: {
          active: boolean | null;
          created_at: string;
          events: string[];
          id: string;
          last_status: number | null;
          last_triggered_at: string | null;
          name: string;
          secret: string | null;
          url: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string;
          events?: string[];
          id?: string;
          last_status?: number | null;
          last_triggered_at?: string | null;
          name: string;
          secret?: string | null;
          url: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string;
          events?: string[];
          id?: string;
          last_status?: number | null;
          last_triggered_at?: string | null;
          name?: string;
          secret?: string | null;
          url?: string;
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
      product_reviews: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          product_slug: string;
          rating: number;
          text: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          product_slug: string;
          rating: number;
          text: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          product_slug?: string;
          rating?: number;
          text?: string;
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
      push_subscriptions: {
        Row: {
          auth_key: string;
          created_at: string | null;
          endpoint: string;
          id: string;
          p256dh: string;
          user_id: string | null;
        };
        Insert: {
          auth_key: string;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          p256dh: string;
          user_id?: string | null;
        };
        Update: {
          auth_key?: string;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      referrals: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          id: string;
          referred_id: string | null;
          referrer_id: string | null;
          reward_amount: number | null;
          status: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referred_id?: string | null;
          referrer_id?: string | null;
          reward_amount?: number | null;
          status?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          referred_id?: string | null;
          referrer_id?: string | null;
          reward_amount?: number | null;
          status?: string | null;
        };
        Relationships: [];
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
      reservation_comments: {
        Row: {
          author: string;
          author_name: string | null;
          body: string;
          created_at: string;
          id: string;
          reservation_id: string;
        };
        Insert: {
          author?: string;
          author_name?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          reservation_id: string;
        };
        Update: {
          author?: string;
          author_name?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          reservation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_comments_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
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
          equipment_id: string | null;
          estimated_delivery: string | null;
          id: string;
          issue: string;
          location: string | null;
          message: string | null;
          mode: string;
          org_id: string | null;
          payment: string;
          payment_ref: string | null;
          payment_status: string;
          phone: string;
          priority: Database["public"]["Enums"]["b2b_ticket_priority"];
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
          ticket_type: Database["public"]["Enums"]["b2b_ticket_type"] | null;
          tracking_code_hash: string | null;
          updated_at: string;
          user_id: string | null;
          warranty_months: number;
          workshop_id: string | null;
        };
        Insert: {
          assigned_technician_id?: string | null;
          created_at?: string;
          customer_name: string;
          delivery_address?: string | null;
          delivery_status?: Database["public"]["Enums"]["delivery_status"];
          device: string;
          email?: string | null;
          equipment_id?: string | null;
          estimated_delivery?: string | null;
          id?: string;
          issue: string;
          location?: string | null;
          message?: string | null;
          mode?: string;
          org_id?: string | null;
          payment?: string;
          payment_ref?: string | null;
          payment_status?: string;
          phone: string;
          priority?: Database["public"]["Enums"]["b2b_ticket_priority"];
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
          ticket_type?: Database["public"]["Enums"]["b2b_ticket_type"] | null;
          tracking_code_hash?: string | null;
          updated_at?: string;
          user_id?: string | null;
          warranty_months?: number;
          workshop_id?: string | null;
        };
        Update: {
          assigned_technician_id?: string | null;
          created_at?: string;
          customer_name?: string;
          delivery_address?: string | null;
          delivery_status?: Database["public"]["Enums"]["delivery_status"];
          device?: string;
          email?: string | null;
          equipment_id?: string | null;
          estimated_delivery?: string | null;
          id?: string;
          issue?: string;
          location?: string | null;
          message?: string | null;
          mode?: string;
          org_id?: string | null;
          payment?: string;
          payment_ref?: string | null;
          payment_status?: string;
          phone?: string;
          priority?: Database["public"]["Enums"]["b2b_ticket_priority"];
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
          ticket_type?: Database["public"]["Enums"]["b2b_ticket_type"] | null;
          tracking_code_hash?: string | null;
          updated_at?: string;
          user_id?: string | null;
          warranty_months?: number;
          workshop_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_equipment_id_fkey";
            columns: ["equipment_id"];
            isOneToOne: false;
            referencedRelation: "equipment";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reservations_workshop_id_fkey";
            columns: ["workshop_id"];
            isOneToOne: false;
            referencedRelation: "workshops";
            referencedColumns: ["id"];
          },
        ];
      };
      returns: {
        Row: {
          created_at: string;
          customer_name: string;
          email: string | null;
          id: string;
          item: string | null;
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
          item?: string | null;
          note?: string | null;
          order_reference?: string | null;
          phone: string;
          reason: string;
          reference: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          id?: string;
          item?: string | null;
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
        Relationships: [
          {
            foreignKeyName: "review_invites_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "reviews_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      satisfaction_surveys: {
        Row: {
          comment: string | null;
          created_at: string | null;
          customer_name: string;
          id: string;
          nps_score: number;
          rating: number;
          recommend: boolean | null;
          reservation_id: string | null;
        };
        Insert: {
          comment?: string | null;
          created_at?: string | null;
          customer_name: string;
          id?: string;
          nps_score: number;
          rating: number;
          recommend?: boolean | null;
          reservation_id?: string | null;
        };
        Update: {
          comment?: string | null;
          created_at?: string | null;
          customer_name?: string;
          id?: string;
          nps_score?: number;
          rating?: number;
          recommend?: boolean | null;
          reservation_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_reports: {
        Row: {
          created_at: string | null;
          date_from: string;
          date_to: string;
          group_by: string | null;
          id: string;
          metrics: Json;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          date_from: string;
          date_to: string;
          group_by?: string | null;
          id?: string;
          metrics?: Json;
          name: string;
        };
        Update: {
          created_at?: string | null;
          date_from?: string;
          date_to?: string;
          group_by?: string | null;
          id?: string;
          metrics?: Json;
          name?: string;
        };
        Relationships: [];
      };
      scheduled_notifications: {
        Row: {
          created_at: string;
          id: string;
          ref: string;
          scheduled_for: string | null;
          status: string | null;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ref: string;
          scheduled_for?: string | null;
          status?: string | null;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          ref?: string;
          scheduled_for?: string | null;
          status?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      scheduled_reports: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          frequency: string;
          id: string;
          last_sent_at: string | null;
          metrics: string[];
          name: string;
          next_send_at: string;
          recipients: string[];
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          frequency: string;
          id?: string;
          last_sent_at?: string | null;
          metrics?: string[];
          name: string;
          next_send_at: string;
          recipients?: string[];
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          frequency?: string;
          id?: string;
          last_sent_at?: string | null;
          metrics?: string[];
          name?: string;
          next_send_at?: string;
          recipients?: string[];
        };
        Relationships: [];
      };
      search_queries: {
        Row: {
          id: string;
          locale: string;
          query: string;
          result_count: number;
          searched_at: string;
        };
        Insert: {
          id?: string;
          locale?: string;
          query: string;
          result_count?: number;
          searched_at?: string;
        };
        Update: {
          id?: string;
          locale?: string;
          query?: string;
          result_count?: number;
          searched_at?: string;
        };
        Relationships: [];
      };
      sla_configs: {
        Row: {
          active: boolean | null;
          alert_hours: number;
          id: string;
          status_from: string;
          status_to: string;
          target_hours: number;
        };
        Insert: {
          active?: boolean | null;
          alert_hours: number;
          id?: string;
          status_from: string;
          status_to: string;
          target_hours: number;
        };
        Update: {
          active?: boolean | null;
          alert_hours?: number;
          id?: string;
          status_from?: string;
          status_to?: string;
          target_hours?: number;
        };
        Relationships: [];
      };
      slot_capacity: {
        Row: {
          capacity: number;
          mode: string;
          period: Database["public"]["Enums"]["slot_period"];
          weekday: number;
        };
        Insert: {
          capacity?: number;
          mode?: string;
          period: Database["public"]["Enums"]["slot_period"];
          weekday: number;
        };
        Update: {
          capacity?: number;
          mode?: string;
          period?: Database["public"]["Enums"]["slot_period"];
          weekday?: number;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          created_at: string | null;
          id: string;
          part_id: string | null;
          performed_by: string | null;
          quantity: number;
          reason: string | null;
          reservation_id: string | null;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          part_id?: string | null;
          performed_by?: string | null;
          quantity: number;
          reason?: string | null;
          reservation_id?: string | null;
          type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          part_id?: string | null;
          performed_by?: string | null;
          quantity?: number;
          reason?: string | null;
          reservation_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_part_id_fkey";
            columns: ["part_id"];
            isOneToOne: false;
            referencedRelation: "inventory_parts";
            referencedColumns: ["id"];
          },
        ];
      };
      supplier_orders: {
        Row: {
          created_at: string | null;
          expected_delivery: string | null;
          id: string;
          parts: Json;
          received_at: string | null;
          status: string | null;
          supplier_id: string | null;
          total: number;
        };
        Insert: {
          created_at?: string | null;
          expected_delivery?: string | null;
          id?: string;
          parts?: Json;
          received_at?: string | null;
          status?: string | null;
          supplier_id?: string | null;
          total?: number;
        };
        Update: {
          created_at?: string | null;
          expected_delivery?: string | null;
          id?: string;
          parts?: Json;
          received_at?: string | null;
          status?: string | null;
          supplier_id?: string | null;
          total?: number;
        };
        Relationships: [
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey";
            columns: ["supplier_id"];
            isOneToOne: false;
            referencedRelation: "suppliers";
            referencedColumns: ["id"];
          },
        ];
      };
      suppliers: {
        Row: {
          active: boolean | null;
          address: string | null;
          contact_name: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          name: string;
          phone: string;
          rating: number | null;
          speciality: string | null;
        };
        Insert: {
          active?: boolean | null;
          address?: string | null;
          contact_name?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name: string;
          phone: string;
          rating?: number | null;
          speciality?: string | null;
        };
        Update: {
          active?: boolean | null;
          address?: string | null;
          contact_name?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string;
          rating?: number | null;
          speciality?: string | null;
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
            foreignKeyName: "technician_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
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
      webhook_configs: {
        Row: {
          active: boolean;
          created_at: string;
          events: string[];
          id: string;
          last_triggered_at: string | null;
          secret: string;
          url: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          events?: string[];
          id?: string;
          last_triggered_at?: string | null;
          secret: string;
          url: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          events?: string[];
          id?: string;
          last_triggered_at?: string | null;
          secret?: string;
          url?: string;
        };
        Relationships: [];
      };
      webhook_logs: {
        Row: {
          created_at: string;
          duration_ms: number | null;
          event: string;
          id: string;
          payload: Json;
          response_body: string | null;
          status_code: number | null;
          webhook_id: string;
        };
        Insert: {
          created_at?: string;
          duration_ms?: number | null;
          event: string;
          id?: string;
          payload: Json;
          response_body?: string | null;
          status_code?: number | null;
          webhook_id: string;
        };
        Update: {
          created_at?: string;
          duration_ms?: number | null;
          event?: string;
          id?: string;
          payload?: Json;
          response_body?: string | null;
          status_code?: number | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "outbound_webhooks";
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
      add_equipment_history: {
        Args: { _description?: string; _equipment_id: string; _event: string };
        Returns: string;
      };
      add_loyalty_points: {
        Args: {
          _delta: number;
          _reason: string;
          _reference: string;
          _user_id: string;
        };
        Returns: undefined;
      };
      add_reservation_comment: {
        Args: {
          _author?: string;
          _author_name?: string;
          _body: string;
          _code: string;
          _reference: string;
        };
        Returns: string;
      };
      booked_hours:
        | {
            Args: { _from: string; _to: string };
            Returns: {
              slot_date: string;
              slot_hour: string;
            }[];
          }
        | {
            Args: { _from: string; _mode?: string; _to: string };
            Returns: {
              slot_date: string;
              slot_hour: string;
            }[];
          };
      catalog_add_photo: {
        Args: {
          _alt?: string;
          _device_slug: string;
          _sort?: number;
          _url: string;
        };
        Returns: boolean;
      };
      catalog_delete_brand: { Args: { _slug: string }; Returns: boolean };
      catalog_delete_category: { Args: { _slug: string }; Returns: boolean };
      catalog_delete_device: { Args: { _slug: string }; Returns: boolean };
      catalog_delete_fault: { Args: { _id: number }; Returns: boolean };
      catalog_delete_photo: { Args: { _id: number }; Returns: boolean };
      catalog_upsert_brand: {
        Args: {
          _active?: boolean;
          _name: string;
          _slug: string;
          _sort?: number;
          _tag?: string;
        };
        Returns: boolean;
      };
      catalog_upsert_category: {
        Args: {
          _active?: boolean;
          _label: string;
          _slug: string;
          _sort?: number;
        };
        Returns: boolean;
      };
      catalog_upsert_device: {
        Args: {
          _active?: boolean;
          _brand_slug: string;
          _category_slug: string;
          _name: string;
          _series?: string;
          _slug: string;
          _sort?: number;
          _year?: number;
        };
        Returns: boolean;
      };
      catalog_upsert_fault: {
        Args: {
          _device_slug: string;
          _duration?: string;
          _id: number;
          _label: string;
          _part?: string;
          _price?: number;
          _slug: string;
          _sort?: number;
          _warranty?: string;
        };
        Returns: boolean;
      };
      claim_first_admin: { Args: never; Returns: boolean };
      create_b2b_ticket: {
        Args: {
          _contact_email?: string;
          _contact_phone?: string;
          _customer_name?: string;
          _equipment_id?: string;
          _issue: string;
          _location?: string;
          _message?: string;
          _org_id: string;
          _priority?: Database["public"]["Enums"]["b2b_ticket_priority"];
          _ticket_type?: Database["public"]["Enums"]["b2b_ticket_type"];
        };
        Returns: Json;
      };
      create_equipment: {
        Args: {
          _asset_tag?: string;
          _assigned_to?: string;
          _brand?: string;
          _location?: string;
          _model?: string;
          _name: string;
          _notes?: string;
          _org_id: string;
          _purchase_date?: string;
          _serial_number?: string;
          _site_id?: string;
          _type?: string;
          _warranty_expires_at?: string;
        };
        Returns: string;
      };
      create_org_site: {
        Args: {
          _address?: string;
          _city?: string;
          _departments?: string[];
          _email?: string;
          _manager?: string;
          _name: string;
          _opening_hours?: Json;
          _org_id: string;
          _phone?: string;
        };
        Returns: string;
      };
      create_organization: {
        Args: {
          _address?: string;
          _country?: string;
          _email?: string;
          _equipment_count?: number;
          _name: string;
          _phone?: string;
          _registration_number?: string;
          _sector?: string;
          _site_count?: number;
          _size?: string;
          _trade_name?: string;
        };
        Returns: string;
      };
      decrement_inventory: {
        Args: { _qty: number; _slug: string };
        Returns: boolean;
      };
      increment_inventory: {
        Args: { _qty: number; _slug: string };
        Returns: boolean;
      };
      delete_equipment: { Args: { _equipment_id: string }; Returns: boolean };
      delete_org_site: { Args: { _site_id: string }; Returns: boolean };
      delete_warranty: { Args: { _warranty_id: string }; Returns: boolean };
      ensure_referral_code: {
        Args: { _code: string; _user_id: string };
        Returns: string;
      };
      get_client_segments: { Args: never; Returns: Json };
      get_equipment: { Args: { _equipment_id: string }; Returns: Json };
      get_equipment_by_qr: {
        Args: { _qr_id: string };
        Returns: {
          brand: string;
          id: string;
          model: string;
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
          _search?: string;
          _status?: Database["public"]["Enums"]["equipment_status"];
        };
        Returns: {
          asset_tag: string;
          assigned_to: string;
          brand: string;
          created_at: string;
          id: string;
          location: string;
          model: string;
          name: string;
          qr_id: string;
          serial_number: string;
          site_name: string;
          status: Database["public"]["Enums"]["equipment_status"];
          type: string;
        }[];
      };
      get_org_members: { Args: { _org_id: string }; Returns: Json };
      get_org_sites: {
        Args: { _org_id: string };
        Returns: {
          active: boolean;
          address: string;
          city: string;
          departments: string[];
          equipment_count: number;
          id: string;
          manager: string;
          name: string;
          phone: string;
        }[];
      };
      get_org_ticket: { Args: { _ticket_id: string }; Returns: Json };
      get_org_tickets: {
        Args: {
          _limit?: number;
          _org_id: string;
          _priority?: Database["public"]["Enums"]["b2b_ticket_priority"];
          _status?: Database["public"]["Enums"]["reservation_status"];
          _ticket_type?: Database["public"]["Enums"]["b2b_ticket_type"];
        };
        Returns: Json[];
      };
      get_product_rating: { Args: { _product_slug: string }; Returns: Json };
      get_product_reviews: {
        Args: { _product_slug: string };
        Returns: {
          created_at: string;
          id: string;
          name: string;
          product_slug: string;
          rating: number;
          text: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "product_reviews";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      get_reservation_comments: {
        Args: { _code: string; _reference: string };
        Returns: {
          author: string;
          author_name: string;
          body: string;
          created_at: string;
          id: string;
        }[];
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
      get_reservation_timeline: {
        Args: { _reference: string };
        Returns: {
          created_at: string;
          new_status: Database["public"]["Enums"]["reservation_status"];
          note: string;
          old_status: Database["public"]["Enums"]["reservation_status"];
        }[];
      };
      get_segment_counts: { Args: never; Returns: Json };
      get_user_orgs: { Args: never; Returns: Json };
      get_workshop_load: { Args: never; Returns: Json };
      has_handoff_signature: {
        Args: { _reservation_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      invite_org_member: {
        Args: {
          _email: string;
          _org_id: string;
          _role?: Database["public"]["Enums"]["org_role"];
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      next_claim_reference: { Args: never; Returns: string };
      next_reservation_reference: { Args: never; Returns: string };
      next_return_reference: { Args: never; Returns: string };
      next_shop_reference: { Args: never; Returns: string };
      org_is_admin: { Args: { _org_id: string }; Returns: boolean };
      org_is_member: { Args: { _org_id: string }; Returns: boolean };
      org_role_of: {
        Args: { _org_id: string };
        Returns: Database["public"]["Enums"]["org_role"];
      };
      remove_org_member: {
        Args: { _org_id: string; _user_id: string };
        Returns: boolean;
      };
      respond_to_quote: {
        Args: { _approve: boolean; _token: string };
        Returns: boolean;
      };
      return_set_status: {
        Args: { _note?: string; _reference: string; _status: string };
        Returns: boolean;
      };
      set_delivery_status: {
        Args: { _address: string; _reservation_id: string; _status: string };
        Returns: boolean;
      };
      set_equipment_status: {
        Args: {
          _equipment_id: string;
          _reason?: string;
          _status: Database["public"]["Enums"]["equipment_status"];
        };
        Returns: boolean;
      };
      set_org_member_role: {
        Args: {
          _org_id: string;
          _role: Database["public"]["Enums"]["org_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      slot_availability:
        | {
            Args: { _from: string; _to: string };
            Returns: {
              capacity: number;
              period: Database["public"]["Enums"]["slot_period"];
              remaining: number;
              slot_date: string;
            }[];
          }
        | {
            Args: { _from: string; _mode?: string; _to: string };
            Returns: {
              capacity: number;
              period: Database["public"]["Enums"]["slot_period"];
              remaining: number;
              slot_date: string;
            }[];
          };
      staff_send_quote: {
        Args: {
          _amount: number;
          _reservation_id: string;
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
      transfer_reservation: {
        Args: { _reservation_id: string; _target_workshop_id: string };
        Returns: Json;
      };
      update_equipment: {
        Args: {
          _asset_tag?: string;
          _assigned_to?: string;
          _brand?: string;
          _equipment_id: string;
          _location?: string;
          _model?: string;
          _name?: string;
          _notes?: string;
          _purchase_date?: string;
          _serial_number?: string;
          _site_id?: string;
          _type?: string;
          _warranty_expires_at?: string;
        };
        Returns: boolean;
      };
      update_org_site: {
        Args: {
          _active?: boolean;
          _address?: string;
          _city?: string;
          _departments?: string[];
          _email?: string;
          _manager?: string;
          _name?: string;
          _opening_hours?: Json;
          _phone?: string;
          _site_id: string;
        };
        Returns: boolean;
      };
      update_organization: {
        Args: {
          _address?: string;
          _country?: string;
          _email?: string;
          _equipment_count?: number;
          _name?: string;
          _org_id: string;
          _phone?: string;
          _registration_number?: string;
          _sector?: string;
          _site_count?: number;
          _size?: string;
          _trade_name?: string;
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
      upsert_warranty: {
        Args: {
          _coverage?: string;
          _end_date?: string;
          _equipment_id: string;
          _provider?: string;
          _start_date?: string;
          _warranty_id?: string;
        };
        Returns: string;
      };
      validate_promo: { Args: { _code: string }; Returns: Json };
      consume_promo: { Args: { _code: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "staff" | "user" | "technicien";
      b2b_ticket_priority: "faible" | "normale" | "haute" | "critique";
      b2b_ticket_type: "panne" | "maintenance" | "diagnostic" | "installation" | "autre";
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
        | "en_cours"
        | "terminee"
        | "annulee"
        | "pieces"
        | "pret"
        | "livre";
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
      app_role: ["admin", "staff", "user", "technicien"],
      b2b_ticket_priority: ["faible", "normale", "haute", "critique"],
      b2b_ticket_type: ["panne", "maintenance", "diagnostic", "installation", "autre"],
      delivery_status: ["non_applicable", "a_planifier", "en_route", "livre"],
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
      payment_status: ["pending", "paid", "failed", "refunded"],
      reservation_status: [
        "en_attente",
        "confirmee",
        "en_cours",
        "terminee",
        "annulee",
        "pieces",
        "pret",
        "livre",
      ],
      slot_period: ["matin", "apres-midi"],
    },
  },
} as const;
