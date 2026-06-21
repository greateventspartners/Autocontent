export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          email_verified: string | null;
          image: string | null;
          password: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          email_verified?: string | null;
          image?: string | null;
          password?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          email_verified?: string | null;
          image?: string | null;
          password?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: {
          id: string;
          clerk_org_id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_org_id: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_org_id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          joined_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          joined_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      workspace_invites: {
        Row: {
          id: string;
          workspace_id: string;
          email: string;
          role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          token: string;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email: string;
          role?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          token: string;
          accepted_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          email?: string;
          role?: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
          token?: string;
          accepted_at?: string | null;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      brand_kits: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          website: string | null;
          slogan: string | null;
          description: string | null;
          colors: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          website?: string | null;
          slogan?: string | null;
          description?: string | null;
          colors?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          website?: string | null;
          slogan?: string | null;
          description?: string | null;
          colors?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brand_kits_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      tones: {
        Row: {
          id: string;
          brand_kit_id: string;
          label: string;
        };
        Insert: {
          id?: string;
          brand_kit_id: string;
          label: string;
        };
        Update: {
          id?: string;
          brand_kit_id?: string;
          label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tones_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          }
        ];
      };
      voice_rules: {
        Row: {
          id: string;
          brand_kit_id: string;
          rule: string;
        };
        Insert: {
          id?: string;
          brand_kit_id: string;
          rule: string;
        };
        Update: {
          id?: string;
          brand_kit_id?: string;
          rule?: string;
        };
        Relationships: [
          {
            foreignKeyName: "voice_rules_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          }
        ];
      };
      personas: {
        Row: {
          id: string;
          brand_kit_id: string;
          name: string;
          role: string;
          bio: string;
        };
        Insert: {
          id?: string;
          brand_kit_id: string;
          name: string;
          role: string;
          bio: string;
        };
        Update: {
          id?: string;
          brand_kit_id?: string;
          name?: string;
          role?: string;
          bio?: string;
        };
        Relationships: [
          {
            foreignKeyName: "personas_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          }
        ];
      };
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          color: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          color?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      content_items: {
        Row: {
          id: string;
          workspace_id: string;
          brand_kit_id: string | null;
          campaign_id: string | null;
          title: string;
          type: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          content: string;
          variant_a: string;
          variant_b: string;
          score_a: number;
          score_b: number;
          brand_score: number;
          summary: string | null;
          scheduled_date: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          brand_kit_id?: string | null;
          campaign_id?: string | null;
          title: string;
          type: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          content: string;
          variant_a: string;
          variant_b: string;
          score_a?: number;
          score_b?: number;
          brand_score?: number;
          summary?: string | null;
          scheduled_date?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          brand_kit_id?: string | null;
          campaign_id?: string | null;
          title?: string;
          type?: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
          channel?: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          content?: string;
          variant_a?: string;
          variant_b?: string;
          score_a?: number;
          score_b?: number;
          brand_score?: number;
          summary?: string | null;
          scheduled_date?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "content_items_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          }
        ];
      };
      content_versions: {
        Row: {
          id: string;
          content_id: string;
          version: number;
          title: string;
          body: string;
          variant_a: string;
          variant_b: string;
          summary: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          version: number;
          title: string;
          body: string;
          variant_a: string;
          variant_b: string;
          summary?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          version?: number;
          title?: string;
          body?: string;
          variant_a?: string;
          variant_b?: string;
          summary?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_versions_content_id_fkey";
            columns: ["content_id"];
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          content_item_id: string;
          token: string;
          reviewer_email: string | null;
          reviewer_name: string | null;
          status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
          comments: string | null;
          created_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          token: string;
          reviewer_email?: string | null;
          reviewer_name?: string | null;
          status?: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
          comments?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          content_item_id?: string;
          token?: string;
          reviewer_email?: string | null;
          reviewer_name?: string | null;
          status?: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
          comments?: string | null;
          created_at?: string;
          responded_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_content_item_id_fkey";
            columns: ["content_item_id"];
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          }
        ];
      };
      topic_suggestions: {
        Row: {
          id: string;
          workspace_id: string;
          brand_kit_id: string | null;
          title: string;
          status: "PENDING" | "VALIDATED" | "USED";
          generated_at: string;
          validated_at: string | null;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          brand_kit_id?: string | null;
          title: string;
          status?: "PENDING" | "VALIDATED" | "USED";
          generated_at?: string;
          validated_at?: string | null;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          brand_kit_id?: string | null;
          title?: string;
          status?: "PENDING" | "VALIDATED" | "USED";
          generated_at?: string;
          validated_at?: string | null;
          used_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "topic_suggestions_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "topic_suggestions_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          }
        ];
      };
      publication_logs: {
        Row: {
          id: string;
          content_id: string;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          status: "SUCCESS" | "FAILED" | "RETRYING";
          external_url: string | null;
          error: string | null;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          status: "SUCCESS" | "FAILED" | "RETRYING";
          external_url?: string | null;
          error?: string | null;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          channel?: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          status?: "SUCCESS" | "FAILED" | "RETRYING";
          external_url?: string | null;
          error?: string | null;
          attempted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publication_logs_content_id_fkey";
            columns: ["content_id"];
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          }
        ];
      };
      integrations: {
        Row: {
          id: string;
          workspace_id: string;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          config: Json;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          config: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          channel?: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          config?: Json;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "integrations_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      analytics_data: {
        Row: {
          id: string;
          workspace_id: string;
          content_id: string | null;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          date: string;
          impressions: number;
          clicks: number;
          engagement: number;
          ctr: number;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          content_id?: string | null;
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          date: string;
          impressions?: number;
          clicks?: number;
          engagement?: number;
          ctr?: number;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          content_id?: string | null;
          channel?: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          date?: string;
          impressions?: number;
          clicks?: number;
          engagement?: number;
          ctr?: number;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_data_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_data_content_id_fkey";
            columns: ["content_id"];
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          workspace_id: string;
          stripe_id: string | null;
          stripe_price_id: string | null;
          plan: "FREE" | "PRO" | "ENTERPRISE";
          status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE";
          current_period_start: string | null;
          current_period_end: string | null;
          content_limit: number;
          content_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          stripe_id?: string | null;
          stripe_price_id?: string | null;
          plan?: "FREE" | "PRO" | "ENTERPRISE";
          status?: "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE";
          current_period_start?: string | null;
          current_period_end?: string | null;
          content_limit?: number;
          content_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          stripe_id?: string | null;
          stripe_price_id?: string | null;
          plan?: "FREE" | "PRO" | "ENTERPRISE";
          status?: "ACTIVE" | "CANCELED" | "PAST_DUE" | "INCOMPLETE";
          current_period_start?: string | null;
          current_period_end?: string | null;
          content_limit?: number;
          content_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      recommendations: {
        Row: {
          id: string;
          workspace_id: string;
          type: string;
          title: string;
          description: string;
          impact: string;
          action_label: string;
          applied: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          type: string;
          title: string;
          description: string;
          impact: string;
          action_label: string;
          applied?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          type?: string;
          title?: string;
          description?: string;
          impact?: string;
          action_label?: string;
          applied?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendations_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          source: string;
          event_id: string;
          type: string;
          raw: Json;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          event_id: string;
          type: string;
          raw: Json;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          event_id?: string;
          type?: string;
          raw?: Json;
          processed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          workspace_id: string;
          label: string;
          key: string;
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          label: string;
          key: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          label?: string;
          key?: string;
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_keys_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      api_key_logs: {
        Row: {
          id: string;
          api_key_id: string;
          workspace_id: string;
          method: string;
          path: string;
          status: number;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          workspace_id: string;
          method: string;
          path: string;
          status: number;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          api_key_id?: string;
          workspace_id?: string;
          method?: string;
          path?: string;
          status?: number;
          ip?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "api_key_logs_api_key_id_fkey";
            columns: ["api_key_id"];
            referencedRelation: "api_keys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_key_logs_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          locale: string;
          theme: string;
          email_notifications: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          locale?: string;
          theme?: string;
          email_notifications?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          locale?: string;
          theme?: string;
          email_notifications?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      content_templates: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          type: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          prompt: string;
          structure: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          type: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          channel: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          prompt: string;
          structure?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          type?: "SOCIAL" | "BLOG" | "EMAIL" | "AD";
          channel?: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "PINTEREST" | "X" | "WORDPRESS" | "SLACK" | "WEBHOOK";
          prompt?: string;
          structure?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_templates_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          }
        ];
      };
      media: {
        Row: {
          id: string;
          workspace_id: string;
          brand_kit_id: string | null;
          file_name: string;
          key: string;
          url: string;
          mime_type: string;
          size: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          brand_kit_id?: string | null;
          file_name: string;
          key: string;
          url: string;
          mime_type: string;
          size: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          brand_kit_id?: string | null;
          file_name?: string;
          key?: string;
          url?: string;
          mime_type?: string;
          size?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_workspace_id_fkey";
            columns: ["workspace_id"];
            referencedRelation: "workspaces";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
