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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      action_follow_ups: {
        Row: {
          action_id: string
          conducted_by: string
          created_at: string
          follow_up_date: string
          id: string
          is_improvement_shown: boolean | null
          next_follow_up_date: string | null
          next_steps: string | null
          organization_id: string
          progress_notes: string
          progress_rating: number | null
          status: string
          updated_at: string
        }
        Insert: {
          action_id: string
          conducted_by: string
          created_at?: string
          follow_up_date: string
          id?: string
          is_improvement_shown?: boolean | null
          next_follow_up_date?: string | null
          next_steps?: string | null
          organization_id: string
          progress_notes: string
          progress_rating?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          conducted_by?: string
          created_at?: string
          follow_up_date?: string
          id?: string
          is_improvement_shown?: boolean | null
          next_follow_up_date?: string | null
          next_steps?: string | null
          organization_id?: string
          progress_notes?: string
          progress_rating?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_follow_ups_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "employee_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      action_participants: {
        Row: {
          action_id: string
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          participant_type: string
          signature_status: string | null
          signed_at: string | null
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          participant_type: string
          signature_status?: string | null
          signed_at?: string | null
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          participant_type?: string
          signature_status?: string | null
          signed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_participants_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "employee_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      action_templates: {
        Row: {
          action_type: string
          category: string
          created_at: string
          created_by: string
          description_template: string
          expected_outcomes_template: string | null
          id: string
          improvement_plan_template: string | null
          is_active: boolean
          organization_id: string
          template_name: string
          title_template: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          action_type: string
          category: string
          created_at?: string
          created_by: string
          description_template: string
          expected_outcomes_template?: string | null
          id?: string
          improvement_plan_template?: string | null
          is_active?: boolean
          organization_id: string
          template_name: string
          title_template: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          action_type?: string
          category?: string
          created_at?: string
          created_by?: string
          description_template?: string
          expected_outcomes_template?: string | null
          id?: string
          improvement_plan_template?: string | null
          is_active?: boolean
          organization_id?: string
          template_name?: string
          title_template?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      admin_access_audit: {
        Row: {
          access_type: string
          accessed_at: string | null
          admin_user_id: string
          id: string
          ip_address: string | null
          organization_id: string
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          admin_user_id: string
          id?: string
          ip_address?: string | null
          organization_id: string
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          admin_user_id?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          metrics_data: Json
          organization_id: string
          snapshot_type: string
          time_period: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          metrics_data?: Json
          organization_id: string
          snapshot_type: string
          time_period: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          metrics_data?: Json
          organization_id?: string
          snapshot_type?: string
          time_period?: string
        }
        Relationships: []
      }
      archive_settings: {
        Row: {
          auto_archive_enabled: boolean | null
          created_at: string | null
          id: string
          organization_id: string | null
          threshold_days: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_archive_enabled?: boolean | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          threshold_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_archive_enabled?: boolean | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          threshold_days?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archive_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_rule_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_global: boolean | null
          name: string
          organization_id: string | null
          rule_config: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          organization_id?: string | null
          rule_config: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          organization_id?: string | null
          rule_config?: Json
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          actual_behavior: string | null
          category: string
          created_at: string
          description: string
          expected_behavior: string | null
          id: string
          organization_id: string
          priority: string
          status: string | null
          steps_to_reproduce: string | null
          system_info: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_behavior?: string | null
          category: string
          created_at?: string
          description: string
          expected_behavior?: string | null
          id?: string
          organization_id: string
          priority?: string
          status?: string | null
          steps_to_reproduce?: string | null
          system_info?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_behavior?: string | null
          category?: string
          created_at?: string
          description?: string
          expected_behavior?: string | null
          id?: string
          organization_id?: string
          priority?: string
          status?: string | null
          steps_to_reproduce?: string | null
          system_info?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_sync_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          google_event_id: string | null
          id: string
          meeting_request_id: string | null
          organization_id: string
          status: string
          sync_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          google_event_id?: string | null
          id?: string
          meeting_request_id?: string | null
          organization_id: string
          status?: string
          sync_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          google_event_id?: string | null
          id?: string
          meeting_request_id?: string | null
          organization_id?: string
          status?: string
          sync_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_log_meeting_request_id_fkey"
            columns: ["meeting_request_id"]
            isOneToOne: false
            referencedRelation: "meeting_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          message_type: string
          room_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message_type?: string
          room_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          message_type?: string
          room_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          organization_id: string | null
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          organization_id?: string | null
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          organization_id?: string | null
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          organization_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          organization_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          organization_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_assignments: {
        Row: {
          assigned_role: string | null
          assigned_to_team_id: string | null
          assigned_to_user_id: string | null
          checklist_id: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
        }
        Insert: {
          assigned_role?: string | null
          assigned_to_team_id?: string | null
          assigned_to_user_id?: string | null
          checklist_id: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
        }
        Update: {
          assigned_role?: string | null
          assigned_to_team_id?: string | null
          assigned_to_user_id?: string | null
          checklist_id?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_assignments_checklist_fk"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_comments: {
        Row: {
          comment: string
          created_at: string
          execution_item_id: string
          id: string
          is_verification_comment: boolean
          organization_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          execution_item_id: string
          id?: string
          is_verification_comment?: boolean
          organization_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          execution_item_id?: string
          id?: string
          is_verification_comment?: boolean
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_comments_execution_item_fk"
            columns: ["execution_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_execution_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_comments_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_comments_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_execution_items: {
        Row: {
          checklist_item_id: string
          completed_at: string | null
          created_at: string
          execution_id: string
          id: string
          is_completed: boolean
          is_verified: boolean
          notes: string | null
          organization_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          checklist_item_id: string
          completed_at?: string | null
          created_at?: string
          execution_id: string
          id?: string
          is_completed?: boolean
          is_verified?: boolean
          notes?: string | null
          organization_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          checklist_item_id?: string
          completed_at?: string | null
          created_at?: string
          execution_id?: string
          id?: string
          is_completed?: boolean
          is_verified?: boolean
          notes?: string | null
          organization_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_execution_items_execution_fk"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "checklist_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_execution_items_item_fk"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_execution_items_verified_by_fk"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_execution_items_verified_by_fk"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_executions: {
        Row: {
          assigned_to_user_id: string
          checklist_id: string
          completed_at: string | null
          created_at: string
          execution_date: string
          execution_score: number | null
          id: string
          notes: string | null
          organization_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["execution_status"]
          total_score: number | null
          updated_at: string
          verification_score: number | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_to_user_id: string
          checklist_id: string
          completed_at?: string | null
          created_at?: string
          execution_date: string
          execution_score?: number | null
          id?: string
          notes?: string | null
          organization_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          total_score?: number | null
          updated_at?: string
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_to_user_id?: string
          checklist_id?: string
          completed_at?: string | null
          created_at?: string
          execution_date?: string
          execution_score?: number | null
          id?: string
          notes?: string | null
          organization_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          total_score?: number | null
          updated_at?: string
          verification_score?: number | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_executions_checklist_fk"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_executions_user_fk"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_executions_user_fk"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_executions_verified_by_fk"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_executions_verified_by_fk"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_instances_v2: {
        Row: {
          created_at: string | null
          date: string
          executed_at: string | null
          executed_by: string | null
          id: string
          manager_note: string | null
          org_id: string
          reject_reason: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["checklist_status_v2"]
          team_id: string | null
          template_id: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          manager_note?: string | null
          org_id: string
          reject_reason?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["checklist_status_v2"]
          team_id?: string | null
          template_id: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          manager_note?: string | null
          org_id?: string
          reject_reason?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["checklist_status_v2"]
          team_id?: string | null
          template_id?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_instances_v2_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_item_entries_v2: {
        Row: {
          created_at: string | null
          executed_status: string | null
          id: string
          instance_id: string
          note: string | null
          photo_urls: string[] | null
          position: number
          template_item_id: string
          updated_at: string | null
          value: Json | null
          verified_status: string | null
        }
        Insert: {
          created_at?: string | null
          executed_status?: string | null
          id?: string
          instance_id: string
          note?: string | null
          photo_urls?: string[] | null
          position: number
          template_item_id: string
          updated_at?: string | null
          value?: Json | null
          verified_status?: string | null
        }
        Update: {
          created_at?: string | null
          executed_status?: string | null
          id?: string
          instance_id?: string
          note?: string | null
          photo_urls?: string[] | null
          position?: number
          template_item_id?: string
          updated_at?: string | null
          value?: Json | null
          verified_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_entries_v2_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "checklist_instances_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_entries_v2_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_items_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean
          order_index: number
          organization_id: string
          title: string
          verification_required: boolean
        }
        Insert: {
          checklist_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          order_index?: number
          organization_id: string
          title: string
          verification_required?: boolean
        }
        Update: {
          checklist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean
          order_index?: number
          organization_id?: string
          title?: string
          verification_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_fk"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_template_items_v2: {
        Row: {
          created_at: string | null
          default_value: Json | null
          id: string
          instructions: string | null
          label: string
          position: number
          requires_note: boolean | null
          requires_photo: boolean | null
          template_id: string
        }
        Insert: {
          created_at?: string | null
          default_value?: Json | null
          id?: string
          instructions?: string | null
          label: string
          position: number
          requires_note?: boolean | null
          requires_photo?: boolean | null
          template_id: string
        }
        Update: {
          created_at?: string | null
          default_value?: Json | null
          id?: string
          instructions?: string | null
          label?: string
          position?: number
          requires_note?: boolean | null
          requires_photo?: boolean | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_items_v2_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates_v2: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type_v2"]
          created_at: string | null
          created_by: string
          description: string | null
          end_time: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          priority: string | null
          require_verification: boolean | null
          role_key: string | null
          scheduled_days: string[] | null
          scoring_enabled: boolean | null
          start_time: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_type?: Database["public"]["Enums"]["assignment_type_v2"]
          created_at?: string | null
          created_by: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          priority?: string | null
          require_verification?: boolean | null
          role_key?: string | null
          scheduled_days?: string[] | null
          scoring_enabled?: boolean | null
          start_time?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["assignment_type_v2"]
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          priority?: string | null
          require_verification?: boolean | null
          role_key?: string | null
          scheduled_days?: string[] | null
          scoring_enabled?: boolean | null
          start_time?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklists: {
        Row: {
          assignment_type: Database["public"]["Enums"]["assignment_type"]
          branch_area: string | null
          created_at: string
          created_by: string
          cutoff_time: string | null
          description: string | null
          execution_window_end: string | null
          execution_window_start: string | null
          id: string
          is_daily: boolean
          name: string
          organization_id: string
          priority: Database["public"]["Enums"]["checklist_priority"]
          scheduled_days: Json | null
          scoring_enabled: boolean
          shift_type: string | null
          status: Database["public"]["Enums"]["checklist_status"]
          updated_at: string
          verification_required: boolean
        }
        Insert: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          branch_area?: string | null
          created_at?: string
          created_by: string
          cutoff_time?: string | null
          description?: string | null
          execution_window_end?: string | null
          execution_window_start?: string | null
          id?: string
          is_daily?: boolean
          name: string
          organization_id: string
          priority?: Database["public"]["Enums"]["checklist_priority"]
          scheduled_days?: Json | null
          scoring_enabled?: boolean
          shift_type?: string | null
          status?: Database["public"]["Enums"]["checklist_status"]
          updated_at?: string
          verification_required?: boolean
        }
        Update: {
          assignment_type?: Database["public"]["Enums"]["assignment_type"]
          branch_area?: string | null
          created_at?: string
          created_by?: string
          cutoff_time?: string | null
          description?: string | null
          execution_window_end?: string | null
          execution_window_start?: string | null
          id?: string
          is_daily?: boolean
          name?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["checklist_priority"]
          scheduled_days?: Json | null
          scoring_enabled?: boolean
          shift_type?: string | null
          status?: Database["public"]["Enums"]["checklist_status"]
          updated_at?: string
          verification_required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "checklists_organization_fk"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          metadata: Json | null
          organization_id: string
          project_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          organization_id: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          organization_id?: string
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_logs: {
        Row: {
          action: string
          changes: Json
          compliance_flags: string[] | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown
          organization_id: string
          retention_until: string | null
          session_id: string | null
          user_agent: string
          user_id: string
        }
        Insert: {
          action: string
          changes?: Json
          compliance_flags?: string[] | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address: unknown
          organization_id: string
          retention_until?: string | null
          session_id?: string | null
          user_agent: string
          user_id: string
        }
        Update: {
          action?: string
          changes?: Json
          compliance_flags?: string[] | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          retention_until?: string | null
          session_id?: string | null
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_training_records: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          completion_notes: string | null
          course_id: string | null
          created_at: string
          external_training_url: string | null
          id: string
          is_completed: boolean | null
          language_selected: string
          organization_id: string
          role_classification: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          course_id?: string | null
          created_at?: string
          external_training_url?: string | null
          id?: string
          is_completed?: boolean | null
          language_selected: string
          organization_id: string
          role_classification: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          completion_notes?: string | null
          course_id?: string | null
          created_at?: string
          external_training_url?: string | null
          id?: string
          is_completed?: boolean | null
          language_selected?: string
          organization_id?: string
          role_classification?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_training_templates: {
        Row: {
          completion_method: string
          created_at: string
          description: string | null
          external_base_url: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          jurisdiction: string
          language_options: string[] | null
          organization_id: string
          role_classifications: string[] | null
          title: string
          updated_at: string
          url_parameters: Json | null
        }
        Insert: {
          completion_method?: string
          created_at?: string
          description?: string | null
          external_base_url: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          jurisdiction: string
          language_options?: string[] | null
          organization_id: string
          role_classifications?: string[] | null
          title: string
          updated_at?: string
          url_parameters?: Json | null
        }
        Update: {
          completion_method?: string
          created_at?: string
          description?: string | null
          external_base_url?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          jurisdiction?: string
          language_options?: string[] | null
          organization_id?: string
          role_classifications?: string[] | null
          title?: string
          updated_at?: string
          url_parameters?: Json | null
        }
        Relationships: []
      }
      created_invoices: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          due_date: string
          footer_text: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          organization_id: string
          paid_at: string | null
          payment_terms: string | null
          sent_at: string | null
          status: string | null
          stripe_invoice_id: string | null
          subtotal: number
          tax_amount: number | null
          template_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          due_date: string
          footer_text?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          due_date?: string
          footer_text?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_terms?: string | null
          sent_at?: string | null
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_created_invoices_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "invoice_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_created_invoices_template"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_time_summaries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          break_count: number | null
          compliance_notes: string | null
          created_at: string | null
          id: string
          is_approved: boolean | null
          organization_id: string
          overtime_minutes: number | null
          session_count: number | null
          total_break_minutes: number | null
          total_work_minutes: number | null
          updated_at: string | null
          user_id: string
          work_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          break_count?: number | null
          compliance_notes?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          organization_id: string
          overtime_minutes?: number | null
          session_count?: number | null
          total_break_minutes?: number | null
          total_work_minutes?: number | null
          updated_at?: string | null
          user_id: string
          work_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          break_count?: number | null
          compliance_notes?: string | null
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          organization_id?: string
          overtime_minutes?: number | null
          session_count?: number | null
          total_break_minutes?: number | null
          total_work_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      data_validation_log: {
        Row: {
          actual_value: string | null
          batch_id: string | null
          created_at: string
          expected_value: string | null
          field_name: string | null
          id: string
          is_resolved: boolean
          message: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
          sales_data_id: string | null
          severity: string
          validation_type: string
        }
        Insert: {
          actual_value?: string | null
          batch_id?: string | null
          created_at?: string
          expected_value?: string | null
          field_name?: string | null
          id?: string
          is_resolved?: boolean
          message: string
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          sales_data_id?: string | null
          severity?: string
          validation_type: string
        }
        Update: {
          actual_value?: string | null
          batch_id?: string | null
          created_at?: string
          expected_value?: string | null
          field_name?: string | null
          id?: string
          is_resolved?: boolean
          message?: string
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          sales_data_id?: string | null
          severity?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_validation_log_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_validation_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_validation_log_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_validation_log_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_validation_log_sales_data_id_fkey"
            columns: ["sales_data_id"]
            isOneToOne: false
            referencedRelation: "sales_data"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_signatures: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          organization_id: string
          request_id: string
          signature_data: Json
          signature_method: string
          signed_at: string
          signer_id: string
          user_agent: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: unknown
          organization_id: string
          request_id: string
          signature_data: Json
          signature_method?: string
          signed_at?: string
          signer_id: string
          user_agent: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          request_id?: string
          signature_data?: Json
          signature_method?: string
          signed_at?: string
          signer_id?: string
          user_agent?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          file_path: string
          file_type: string
          folder: string | null
          folder_id: string | null
          id: string
          is_pinned: boolean | null
          organization_id: string
          size_bytes: number
          storage_id: string
          team_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_path: string
          file_type: string
          folder?: string | null
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id: string
          size_bytes: number
          storage_id: string
          team_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_type?: string
          folder?: string | null
          folder_id?: string | null
          id?: string
          is_pinned?: boolean | null
          organization_id?: string
          size_bytes?: number
          storage_id?: string
          team_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_sku_backup: {
        Row: {
          barcode: string | null
          base_unit_id: string | null
          calculated_unit_price: number | null
          category: string | null
          category_id: string | null
          conversion_factor: number | null
          created_at: string | null
          created_by: string | null
          current_stock: number | null
          description: string | null
          expected_cost: number | null
          id: string | null
          is_active: boolean | null
          is_template: boolean | null
          location: string | null
          maximum_threshold: number | null
          minimum_threshold: number | null
          name: string | null
          organization_id: string | null
          purchase_price: number | null
          purchase_unit: string | null
          reorder_point: number | null
          sku: string | null
          sort_order: number | null
          supplier_info: Json | null
          template_name: string | null
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          base_unit_id?: string | null
          calculated_unit_price?: number | null
          category?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          expected_cost?: number | null
          id?: string | null
          is_active?: boolean | null
          is_template?: boolean | null
          location?: string | null
          maximum_threshold?: number | null
          minimum_threshold?: number | null
          name?: string | null
          organization_id?: string | null
          purchase_price?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku?: string | null
          sort_order?: number | null
          supplier_info?: Json | null
          template_name?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          base_unit_id?: string | null
          calculated_unit_price?: number | null
          category?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string | null
          created_by?: string | null
          current_stock?: number | null
          description?: string | null
          expected_cost?: number | null
          id?: string | null
          is_active?: boolean | null
          is_template?: boolean | null
          location?: string | null
          maximum_threshold?: number | null
          minimum_threshold?: number | null
          name?: string | null
          organization_id?: string | null
          purchase_price?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku?: string | null
          sort_order?: number | null
          supplier_info?: Json | null
          template_name?: string | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          created_at: string | null
          idempotency_key: string
          last_error: string | null
          payload: Json
          status: string
        }
        Insert: {
          created_at?: string | null
          idempotency_key: string
          last_error?: string | null
          payload: Json
          status: string
        }
        Update: {
          created_at?: string | null
          idempotency_key?: string
          last_error?: string | null
          payload?: Json
          status?: string
        }
        Relationships: []
      }
      email_notification_preferences: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          request_assigned: boolean
          request_completed: boolean
          request_created: boolean
          request_status_changed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          request_assigned?: boolean
          request_completed?: boolean
          request_created?: boolean
          request_status_changed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          request_assigned?: boolean
          request_completed?: boolean
          request_created?: boolean
          request_status_changed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          created_at: string | null
          event_id: string
          payload: Json
          sent_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          payload: Json
          sent_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          payload?: Json
          sent_at?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          organization_id: string
          phone_primary: string
          phone_secondary: string | null
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          organization_id: string
          phone_primary: string
          phone_secondary?: string | null
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          organization_id?: string
          phone_primary?: string
          phone_secondary?: string | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_actions: {
        Row: {
          action_type: string
          appeal_reason: string | null
          appeal_submitted_at: string | null
          category: string
          completed_at: string | null
          created_at: string
          description: string
          due_date: string | null
          escalation_count: number | null
          expected_outcomes: string | null
          follow_up_date: string | null
          id: string
          improvement_plan: string | null
          is_confidential: boolean
          issued_by: string
          job_role_context: Json | null
          organization_id: string
          recipient_id: string
          severity: string
          status: string
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          appeal_reason?: string | null
          appeal_submitted_at?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          escalation_count?: number | null
          expected_outcomes?: string | null
          follow_up_date?: string | null
          id?: string
          improvement_plan?: string | null
          is_confidential?: boolean
          issued_by: string
          job_role_context?: Json | null
          organization_id: string
          recipient_id: string
          severity?: string
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          appeal_reason?: string | null
          appeal_submitted_at?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          escalation_count?: number | null
          expected_outcomes?: string | null
          follow_up_date?: string | null
          id?: string
          improvement_plan?: string | null
          is_confidential?: boolean
          issued_by?: string
          job_role_context?: Json | null
          organization_id?: string
          recipient_id?: string
          severity?: string
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_availability: {
        Row: {
          created_at: string
          day_of_week: number
          effective_from: string
          effective_until: string | null
          employee_id: string
          end_time: string
          id: string
          is_available: boolean | null
          organization_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          effective_from?: string
          effective_until?: string | null
          employee_id: string
          end_time: string
          id?: string
          is_available?: boolean | null
          organization_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          effective_from?: string
          effective_until?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          is_available?: boolean | null
          organization_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_schedules: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          created_at: string
          created_by: string
          employee_id: string
          id: string
          notes: string | null
          organization_id: string
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          shift_template_id: string | null
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
          notes?: string | null
          organization_id: string
          scheduled_date: string
          scheduled_end_time: string
          scheduled_start_time: string
          shift_template_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          scheduled_date?: string
          scheduled_end_time?: string
          scheduled_start_time?: string
          shift_template_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_shift_template_id_fkey"
            columns: ["shift_template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_schedules_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employee_schedules_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          organization_id: string
          start_date: string
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          id?: string
          organization_id: string
          start_date: string
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          organization_id?: string
          start_date?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          is_active: boolean
          organization_id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          is_active?: boolean
          organization_id: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          is_active?: boolean
          organization_id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generated_labels: {
        Row: {
          id: string
          item_id: string | null
          label_data: Json
          lot_id: string | null
          organization_id: string
          print_format: string
          printed_at: string
          printed_by: string
          quantity_printed: number
          template_id: string
        }
        Insert: {
          id?: string
          item_id?: string | null
          label_data?: Json
          lot_id?: string | null
          organization_id: string
          print_format?: string
          printed_at?: string
          printed_by: string
          quantity_printed?: number
          template_id: string
        }
        Update: {
          id?: string
          item_id?: string | null
          label_data?: Json
          lot_id?: string | null
          organization_id?: string
          print_format?: string
          printed_at?: string
          printed_by?: string
          quantity_printed?: number
          template_id?: string
        }
        Relationships: []
      }
      google_calendar_sync_preferences: {
        Row: {
          auto_create_meet_links: boolean | null
          calendar_id: string | null
          conflict_resolution_strategy: string | null
          created_at: string | null
          default_meeting_duration: number | null
          export_to_google_tasks: boolean | null
          focus_time_advance_days: number | null
          focus_time_duration: number | null
          id: string
          import_enabled: boolean | null
          import_external_events: boolean | null
          import_google_tasks: boolean | null
          notification_preferences: Json | null
          organization_id: string
          sync_bidirectional: boolean | null
          sync_enabled: boolean | null
          sync_focus_time: boolean | null
          sync_frequency: string | null
          sync_frequency_minutes: number | null
          sync_google_tasks: boolean | null
          sync_meeting_participants: boolean | null
          sync_meetings: boolean | null
          sync_task_deadlines: boolean | null
          sync_task_reminders: boolean | null
          sync_tasks: boolean | null
          two_way_sync_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_create_meet_links?: boolean | null
          calendar_id?: string | null
          conflict_resolution_strategy?: string | null
          created_at?: string | null
          default_meeting_duration?: number | null
          export_to_google_tasks?: boolean | null
          focus_time_advance_days?: number | null
          focus_time_duration?: number | null
          id?: string
          import_enabled?: boolean | null
          import_external_events?: boolean | null
          import_google_tasks?: boolean | null
          notification_preferences?: Json | null
          organization_id: string
          sync_bidirectional?: boolean | null
          sync_enabled?: boolean | null
          sync_focus_time?: boolean | null
          sync_frequency?: string | null
          sync_frequency_minutes?: number | null
          sync_google_tasks?: boolean | null
          sync_meeting_participants?: boolean | null
          sync_meetings?: boolean | null
          sync_task_deadlines?: boolean | null
          sync_task_reminders?: boolean | null
          sync_tasks?: boolean | null
          two_way_sync_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_create_meet_links?: boolean | null
          calendar_id?: string | null
          conflict_resolution_strategy?: string | null
          created_at?: string | null
          default_meeting_duration?: number | null
          export_to_google_tasks?: boolean | null
          focus_time_advance_days?: number | null
          focus_time_duration?: number | null
          id?: string
          import_enabled?: boolean | null
          import_external_events?: boolean | null
          import_google_tasks?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string
          sync_bidirectional?: boolean | null
          sync_enabled?: boolean | null
          sync_focus_time?: boolean | null
          sync_frequency?: string | null
          sync_frequency_minutes?: number | null
          sync_google_tasks?: boolean | null
          sync_meeting_participants?: boolean | null
          sync_meetings?: boolean | null
          sync_task_deadlines?: boolean | null
          sync_task_reminders?: boolean | null
          sync_tasks?: boolean | null
          two_way_sync_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_google_sync_org"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_google_sync_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_google_sync_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_value: number | null
          id: string
          is_resolved: boolean
          item_id: string
          organization_id: string
          resolved_at: string | null
          resolved_by: string | null
          threshold_value: number | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_resolved?: boolean
          item_id: string
          organization_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_value?: number | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_value?: number | null
          id?: string
          is_resolved?: boolean
          item_id?: string
          organization_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_count_items: {
        Row: {
          actual_quantity: number | null
          count_id: string
          counted_at: string | null
          counted_by: string | null
          id: string
          in_stock_quantity: number
          item_id: string
          notes: string | null
          template_maximum_quantity: number | null
          template_minimum_quantity: number | null
          variance: number | null
        }
        Insert: {
          actual_quantity?: number | null
          count_id: string
          counted_at?: string | null
          counted_by?: string | null
          id?: string
          in_stock_quantity: number
          item_id: string
          notes?: string | null
          template_maximum_quantity?: number | null
          template_minimum_quantity?: number | null
          variance?: number | null
        }
        Update: {
          actual_quantity?: number | null
          count_id?: string
          counted_at?: string | null
          counted_by?: string | null
          id?: string
          in_stock_quantity?: number
          item_id?: string
          notes?: string | null
          template_maximum_quantity?: number | null
          template_minimum_quantity?: number | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          assigned_to: string | null
          completion_percentage: number | null
          conducted_by: string
          count_date: string
          created_at: string
          email_sent_at: string | null
          id: string
          is_voided: boolean
          notes: string | null
          organization_id: string
          status: string
          team_id: string | null
          template_id: string | null
          total_items_count: number | null
          updated_at: string
          variance_count: number | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          completion_percentage?: number | null
          conducted_by: string
          count_date?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          is_voided?: boolean
          notes?: string | null
          organization_id: string
          status?: string
          team_id?: string | null
          template_id?: string | null
          total_items_count?: number | null
          updated_at?: string
          variance_count?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          completion_percentage?: number | null
          conducted_by?: string
          count_date?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          is_voided?: boolean
          notes?: string | null
          organization_id?: string
          status?: string
          team_id?: string | null
          template_id?: string | null
          total_items_count?: number | null
          updated_at?: string
          variance_count?: number | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inventory_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          barcode: string | null
          base_unit_id: string | null
          calculated_unit_price: number | null
          category: string | null
          category_id: string | null
          conversion_factor: number | null
          created_at: string
          created_by: string
          current_stock: number
          description: string | null
          expected_cost: number | null
          id: string
          is_active: boolean
          is_template: boolean
          location: string | null
          maximum_threshold: number | null
          minimum_threshold: number | null
          name: string
          organization_id: string
          purchase_price: number | null
          purchase_unit: string | null
          reorder_point: number | null
          sku: string | null
          sort_order: number | null
          supplier_info: Json | null
          team_id: string | null
          template_name: string | null
          unit_cost: number | null
          unit_of_measure: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          barcode?: string | null
          base_unit_id?: string | null
          calculated_unit_price?: number | null
          category?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string
          created_by: string
          current_stock?: number
          description?: string | null
          expected_cost?: number | null
          id?: string
          is_active?: boolean
          is_template?: boolean
          location?: string | null
          maximum_threshold?: number | null
          minimum_threshold?: number | null
          name: string
          organization_id: string
          purchase_price?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku?: string | null
          sort_order?: number | null
          supplier_info?: Json | null
          team_id?: string | null
          template_name?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          barcode?: string | null
          base_unit_id?: string | null
          calculated_unit_price?: number | null
          category?: string | null
          category_id?: string | null
          conversion_factor?: number | null
          created_at?: string
          created_by?: string
          current_stock?: number
          description?: string | null
          expected_cost?: number | null
          id?: string
          is_active?: boolean
          is_template?: boolean
          location?: string | null
          maximum_threshold?: number | null
          minimum_threshold?: number | null
          name?: string
          organization_id?: string
          purchase_price?: number | null
          purchase_unit?: string | null
          reorder_point?: number | null
          sku?: string | null
          sort_order?: number | null
          supplier_info?: Json | null
          team_id?: string | null
          template_name?: string | null
          unit_cost?: number | null
          unit_of_measure?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_base_unit_id_fkey"
            columns: ["base_unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_performance_analytics"
            referencedColumns: ["vendor_id"]
          },
          {
            foreignKeyName: "inventory_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          cost_per_unit: number | null
          created_at: string
          created_by: string
          expiration_date: string | null
          id: string
          is_active: boolean
          item_id: string
          lot_number: string
          manufacturing_date: string | null
          notes: string | null
          organization_id: string
          quantity_received: number
          quantity_remaining: number
          supplier_info: Json | null
          updated_at: string
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string
          created_by: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          item_id: string
          lot_number: string
          manufacturing_date?: string | null
          notes?: string | null
          organization_id: string
          quantity_received?: number
          quantity_remaining?: number
          supplier_info?: Json | null
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string
          created_by?: string
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          item_id?: string
          lot_number?: string
          manufacturing_date?: string | null
          notes?: string | null
          organization_id?: string
          quantity_received?: number
          quantity_remaining?: number
          supplier_info?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_nutritional_info: {
        Row: {
          added_sugars: number | null
          additional_nutrients: Json | null
          allergens: string[] | null
          calcium: number | null
          calories: number | null
          cholesterol: number | null
          created_at: string
          created_by: string
          dietary_fiber: number | null
          id: string
          ingredients: string | null
          iron: number | null
          item_id: string
          organization_id: string
          potassium: number | null
          protein: number | null
          saturated_fat: number | null
          serving_size: string | null
          servings_per_container: number | null
          sodium: number | null
          total_carbohydrates: number | null
          total_fat: number | null
          total_sugars: number | null
          trans_fat: number | null
          updated_at: string
          vitamin_d: number | null
        }
        Insert: {
          added_sugars?: number | null
          additional_nutrients?: Json | null
          allergens?: string[] | null
          calcium?: number | null
          calories?: number | null
          cholesterol?: number | null
          created_at?: string
          created_by: string
          dietary_fiber?: number | null
          id?: string
          ingredients?: string | null
          iron?: number | null
          item_id: string
          organization_id: string
          potassium?: number | null
          protein?: number | null
          saturated_fat?: number | null
          serving_size?: string | null
          servings_per_container?: number | null
          sodium?: number | null
          total_carbohydrates?: number | null
          total_fat?: number | null
          total_sugars?: number | null
          trans_fat?: number | null
          updated_at?: string
          vitamin_d?: number | null
        }
        Update: {
          added_sugars?: number | null
          additional_nutrients?: Json | null
          allergens?: string[] | null
          calcium?: number | null
          calories?: number | null
          cholesterol?: number | null
          created_at?: string
          created_by?: string
          dietary_fiber?: number | null
          id?: string
          ingredients?: string | null
          iron?: number | null
          item_id?: string
          organization_id?: string
          potassium?: number | null
          protein?: number | null
          saturated_fat?: number | null
          serving_size?: string | null
          servings_per_container?: number | null
          sodium?: number | null
          total_carbohydrates?: number | null
          total_fat?: number | null
          total_sugars?: number | null
          trans_fat?: number | null
          updated_at?: string
          vitamin_d?: number | null
        }
        Relationships: []
      }
      inventory_template_items: {
        Row: {
          created_at: string
          id: string
          in_stock_quantity: number | null
          item_id: string
          maximum_quantity: number | null
          minimum_quantity: number | null
          sort_order: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          in_stock_quantity?: number | null
          item_id: string
          maximum_quantity?: number | null
          minimum_quantity?: number | null
          sort_order?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          in_stock_quantity?: number | null
          item_id?: string
          maximum_quantity?: number | null
          minimum_quantity?: number | null
          sort_order?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_template_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inventory_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_templates: {
        Row: {
          auto_assign_enabled: boolean | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          execution_days: string[] | null
          execution_frequency: string | null
          execution_time_due: string | null
          execution_time_start: string | null
          execution_window_hours: number | null
          id: string
          is_active: boolean
          name: string
          notification_settings: Json | null
          organization_id: string
          priority: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          auto_assign_enabled?: boolean | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          execution_days?: string[] | null
          execution_frequency?: string | null
          execution_time_due?: string | null
          execution_time_start?: string | null
          execution_window_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          notification_settings?: Json | null
          organization_id: string
          priority?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_assign_enabled?: boolean | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          execution_days?: string[] | null
          execution_frequency?: string | null
          execution_time_due?: string | null
          execution_time_start?: string | null
          execution_window_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          notification_settings?: Json | null
          organization_id?: string
          priority?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          organization_id: string
          quantity: number
          reference_number: string | null
          transaction_date: string
          transaction_type: string
          unit_cost: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          organization_id: string
          quantity: number
          reference_number?: string | null
          transaction_date?: string
          transaction_type: string
          unit_cost?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          organization_id?: string
          quantity?: number
          reference_number?: string | null
          transaction_date?: string
          transaction_type?: string
          unit_cost?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          is_active: boolean
          measurement_type: string | null
          name: string
          organization_id: string
          unit_type: string
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          is_active?: boolean
          measurement_type?: string | null
          name: string
          organization_id: string
          unit_type: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          is_active?: boolean
          measurement_type?: string | null
          name?: string
          organization_id?: string
          unit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          organization_id: string
          quantity: number
          sort_order: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          organization_id: string
          quantity?: number
          sort_order?: number | null
          total_price?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          quantity?: number
          sort_order?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_line_items_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "created_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          created_at: string
          created_by: string
          default_payment_terms: string | null
          default_tax_rate: number | null
          description: string | null
          footer_text: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          description?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          description?: string | null
          footer_text?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          branch: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          invoice_date: string
          invoice_number: string
          organization_id: string
          team_id: string | null
          updated_at: string
          uploader_name: string
          user_id: string
        }
        Insert: {
          branch: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          invoice_date: string
          invoice_number: string
          organization_id: string
          team_id?: string | null
          updated_at?: string
          uploader_name: string
          user_id: string
        }
        Update: {
          branch?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          organization_id?: string
          team_id?: string | null
          updated_at?: string
          uploader_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      job_role_permissions: {
        Row: {
          action_id: string
          created_at: string
          granted: boolean
          id: string
          job_role_id: string
          module_id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          granted?: boolean
          id?: string
          job_role_id: string
          module_id: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          granted?: boolean
          id?: string
          job_role_id?: string
          module_id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_role_permissions_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      label_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          dimensions: Json
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          printer_type: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          dimensions?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id: string
          printer_type?: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          dimensions?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          printer_type?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      meeting_action_items: {
        Row: {
          assigned_to_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          meeting_request_id: string
          organization_id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_request_id: string
          organization_id: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_request_id?: string
          organization_id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_analytics: {
        Row: {
          action_items_completed: number | null
          action_items_created: number | null
          active_participants: number | null
          actual_vs_planned_ratio: number | null
          completion_rate: number | null
          cost_estimate: number | null
          created_at: string
          effectiveness_score: number | null
          engagement_score: number | null
          follow_through_rate: number | null
          goals_achieved: number | null
          goals_set: number | null
          id: string
          meeting_duration_minutes: number | null
          meeting_request_id: string
          organization_id: string
          participant_satisfaction_avg: number | null
          roi_score: number | null
          time_efficiency_score: number | null
          total_participants: number | null
          updated_at: string
        }
        Insert: {
          action_items_completed?: number | null
          action_items_created?: number | null
          active_participants?: number | null
          actual_vs_planned_ratio?: number | null
          completion_rate?: number | null
          cost_estimate?: number | null
          created_at?: string
          effectiveness_score?: number | null
          engagement_score?: number | null
          follow_through_rate?: number | null
          goals_achieved?: number | null
          goals_set?: number | null
          id?: string
          meeting_duration_minutes?: number | null
          meeting_request_id: string
          organization_id: string
          participant_satisfaction_avg?: number | null
          roi_score?: number | null
          time_efficiency_score?: number | null
          total_participants?: number | null
          updated_at?: string
        }
        Update: {
          action_items_completed?: number | null
          action_items_created?: number | null
          active_participants?: number | null
          actual_vs_planned_ratio?: number | null
          completion_rate?: number | null
          cost_estimate?: number | null
          created_at?: string
          effectiveness_score?: number | null
          engagement_score?: number | null
          follow_through_rate?: number | null
          goals_achieved?: number | null
          goals_set?: number | null
          id?: string
          meeting_duration_minutes?: number | null
          meeting_request_id?: string
          organization_id?: string
          participant_satisfaction_avg?: number | null
          roi_score?: number | null
          time_efficiency_score?: number | null
          total_participants?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      meeting_conflicts: {
        Row: {
          conflict_type: string
          created_at: string
          description: string
          id: string
          is_resolved: boolean | null
          meeting_request_id: string
          organization_id: string
          resolved_at: string | null
          severity: string | null
          suggested_resolution: string | null
        }
        Insert: {
          conflict_type: string
          created_at?: string
          description: string
          id?: string
          is_resolved?: boolean | null
          meeting_request_id: string
          organization_id: string
          resolved_at?: string | null
          severity?: string | null
          suggested_resolution?: string | null
        }
        Update: {
          conflict_type?: string
          created_at?: string
          description?: string
          id?: string
          is_resolved?: boolean | null
          meeting_request_id?: string
          organization_id?: string
          resolved_at?: string | null
          severity?: string | null
          suggested_resolution?: string | null
        }
        Relationships: []
      }
      meeting_participant_feedback: {
        Row: {
          comments: string | null
          created_at: string
          effectiveness_rating: number | null
          engagement_level: string | null
          id: string
          meeting_request_id: string
          organization_id: string
          satisfaction_rating: number | null
          time_well_used: boolean | null
          user_id: string
          would_attend_again: boolean | null
        }
        Insert: {
          comments?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          engagement_level?: string | null
          id?: string
          meeting_request_id: string
          organization_id: string
          satisfaction_rating?: number | null
          time_well_used?: boolean | null
          user_id: string
          would_attend_again?: boolean | null
        }
        Update: {
          comments?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          engagement_level?: string | null
          id?: string
          meeting_request_id?: string
          organization_id?: string
          satisfaction_rating?: number | null
          time_well_used?: boolean | null
          user_id?: string
          would_attend_again?: boolean | null
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          created_at: string
          id: string
          meeting_request_id: string
          organization_id: string
          responded_at: string | null
          response_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_request_id: string
          organization_id: string
          responded_at?: string | null
          response_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_request_id?: string
          organization_id?: string
          responded_at?: string | null
          response_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_request_id_fkey"
            columns: ["meeting_request_id"]
            isOneToOne: false
            referencedRelation: "meeting_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_requests: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          google_event_id: string | null
          google_meet_url: string | null
          id: string
          location: string | null
          organization_id: string
          organizer_id: string
          start_time: string
          status: string
          sync_status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          google_event_id?: string | null
          google_meet_url?: string | null
          id?: string
          location?: string | null
          organization_id: string
          organizer_id: string
          start_time: string
          status?: string
          sync_status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          google_event_id?: string | null
          google_meet_url?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          organizer_id?: string
          start_time?: string
          status?: string
          sync_status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_templates: {
        Row: {
          agenda_structure: Json | null
          created_at: string
          created_by: string
          default_duration_minutes: number | null
          default_participants: Json | null
          description: string | null
          estimated_effectiveness_score: number | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          meeting_type: string | null
          name: string
          organization_id: string
          recurrence_pattern: Json | null
          updated_at: string
        }
        Insert: {
          agenda_structure?: Json | null
          created_at?: string
          created_by: string
          default_duration_minutes?: number | null
          default_participants?: Json | null
          description?: string | null
          estimated_effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          meeting_type?: string | null
          name: string
          organization_id: string
          recurrence_pattern?: Json | null
          updated_at?: string
        }
        Update: {
          agenda_structure?: Json | null
          created_at?: string
          created_by?: string
          default_duration_minutes?: number | null
          default_participants?: Json | null
          description?: string | null
          estimated_effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          meeting_type?: string | null
          name?: string
          organization_id?: string
          recurrence_pattern?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string
          event_id: string | null
          id: string
          metadata: Json
          organization_id: string
          read: boolean
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json
          organization_id: string
          read?: boolean
          task_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_approvals: {
        Row: {
          approval_status: string
          approved_at: string | null
          approver_id: string
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          submission_id: string
        }
        Insert: {
          approval_status: string
          approved_at?: string | null
          approver_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          submission_id: string
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approver_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_approvals_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "onboarding_document_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_compliance_items: {
        Row: {
          completed_by: string | null
          completed_date: string | null
          compliance_type: string
          created_at: string | null
          due_date: string | null
          id: string
          instance_id: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          completed_by?: string | null
          completed_date?: string | null
          compliance_type: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          instance_id: string
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          completed_by?: string | null
          completed_date?: string | null
          compliance_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          instance_id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_compliance_items_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "onboarding_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_compliance_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_document_requirements: {
        Row: {
          allowed_file_types: string[] | null
          approver_roles: string[] | null
          created_at: string | null
          created_by: string
          description: string | null
          document_type: string
          due_days_after_start: number | null
          id: string
          instructions: string | null
          is_required: boolean
          max_file_size_mb: number | null
          name: string
          organization_id: string
          requires_approval: boolean | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_file_types?: string[] | null
          approver_roles?: string[] | null
          created_at?: string | null
          created_by: string
          description?: string | null
          document_type: string
          due_days_after_start?: number | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          max_file_size_mb?: number | null
          name: string
          organization_id: string
          requires_approval?: boolean | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_file_types?: string[] | null
          approver_roles?: string[] | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          document_type?: string
          due_days_after_start?: number | null
          id?: string
          instructions?: string | null
          is_required?: boolean
          max_file_size_mb?: number | null
          name?: string
          organization_id?: string
          requires_approval?: boolean | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_document_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_requirements_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_document_submissions: {
        Row: {
          created_at: string | null
          due_date: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          instance_id: string
          organization_id: string
          rejection_reason: string | null
          requirement_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          submission_status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          instance_id: string
          organization_id: string
          rejection_reason?: string | null
          requirement_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          instance_id?: string
          organization_id?: string
          rejection_reason?: string | null
          requirement_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_document_submissions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "onboarding_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_document_submissions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "onboarding_document_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_feedback_checkpoints: {
        Row: {
          checkpoint_label: string | null
          completed_at: string | null
          created_at: string
          days_offset: number
          employee_id: string
          id: string
          instance_id: string
          notes: string | null
          organization_id: string
          rating: number | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["onboarding_feedback_status"]
          updated_at: string
        }
        Insert: {
          checkpoint_label?: string | null
          completed_at?: string | null
          created_at?: string
          days_offset: number
          employee_id: string
          id?: string
          instance_id: string
          notes?: string | null
          organization_id: string
          rating?: number | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["onboarding_feedback_status"]
          updated_at?: string
        }
        Update: {
          checkpoint_label?: string | null
          completed_at?: string | null
          created_at?: string
          days_offset?: number
          employee_id?: string
          id?: string
          instance_id?: string
          notes?: string | null
          organization_id?: string
          rating?: number | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["onboarding_feedback_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_feedback_checkpoints_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "onboarding_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_instance_step_progress: {
        Row: {
          completed_at: string | null
          completion_data: Json | null
          created_at: string
          employee_id: string
          id: string
          instance_id: string
          notes: string | null
          organization_id: string
          started_at: string | null
          status: string
          step_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string
          employee_id: string
          id?: string
          instance_id: string
          notes?: string | null
          organization_id: string
          started_at?: string | null
          status?: string
          step_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completion_data?: Json | null
          created_at?: string
          employee_id?: string
          id?: string
          instance_id?: string
          notes?: string | null
          organization_id?: string
          started_at?: string | null
          status?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_instance_tasks: {
        Row: {
          assigned_to_user_id: string | null
          category:
            | Database["public"]["Enums"]["onboarding_task_category"]
            | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          instance_id: string
          notes: string | null
          organization_id: string
          owner_type: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links: Json
          started_at: string | null
          status: Database["public"]["Enums"]["onboarding_task_status"]
          template_task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          category?:
            | Database["public"]["Enums"]["onboarding_task_category"]
            | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          instance_id: string
          notes?: string | null
          organization_id: string
          owner_type: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["onboarding_task_status"]
          template_task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          category?:
            | Database["public"]["Enums"]["onboarding_task_category"]
            | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          instance_id?: string
          notes?: string | null
          organization_id?: string
          owner_type?: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["onboarding_task_status"]
          template_task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_instance_tasks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "onboarding_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_instance_tasks_template_task_id_fkey"
            columns: ["template_task_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_instances: {
        Row: {
          created_at: string
          created_by: string
          employee_id: string
          id: string
          organization_id: string
          start_date: string
          status: Database["public"]["Enums"]["onboarding_instance_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
          organization_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["onboarding_instance_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
          organization_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["onboarding_instance_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_resources: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          external_url: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_public: boolean | null
          organization_id: string
          resource_type: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          organization_id: string
          resource_type: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          external_url?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_public?: boolean | null
          organization_id?: string
          resource_type?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_stages: {
        Row: {
          created_at: string
          description: string | null
          due_offset_days: number | null
          id: string
          order_index: number
          organization_id: string
          template_id: string
          timeframe_label: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          order_index?: number
          organization_id: string
          template_id: string
          timeframe_label?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          order_index?: number
          organization_id?: string
          template_id?: string
          timeframe_label?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_stages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_step_content: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string
          id: string
          order_index: number
          organization_id: string
          step_id: string
          updated_at: string
        }
        Insert: {
          content_data: Json
          content_type: string
          created_at?: string
          id?: string
          order_index: number
          organization_id: string
          step_id: string
          updated_at?: string
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string
          id?: string
          order_index?: number
          organization_id?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_step_requirements: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          organization_id: string
          requirement_data: Json | null
          requirement_id: string | null
          requirement_type: string
          step_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          organization_id: string
          requirement_data?: Json | null
          requirement_id?: string | null
          requirement_type: string
          step_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          organization_id?: string
          requirement_data?: Json | null
          requirement_id?: string | null
          requirement_type?: string
          step_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_steps: {
        Row: {
          created_at: string
          description: string | null
          due_offset_days: number | null
          estimated_duration_minutes: number | null
          id: string
          is_required: boolean
          order_index: number
          organization_id: string
          prerequisites: Json | null
          stage_id: string | null
          step_type: string
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_required?: boolean
          order_index: number
          organization_id: string
          prerequisites?: Json | null
          stage_id?: string | null
          step_type: string
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          estimated_duration_minutes?: number | null
          id?: string
          is_required?: boolean
          order_index?: number
          organization_id?: string
          prerequisites?: Json | null
          stage_id?: string | null
          step_type?: string
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      onboarding_task_resources: {
        Row: {
          created_at: string
          id: string
          is_required: boolean | null
          resource_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          resource_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean | null
          resource_id?: string
          task_id?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          category: Database["public"]["Enums"]["onboarding_task_category"]
          created_at: string
          description: string | null
          due_offset_days: number | null
          id: string
          organization_id: string
          owner_type: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links: Json
          stage_id: string | null
          template_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["onboarding_task_category"]
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          organization_id: string
          owner_type: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links?: Json
          stage_id?: string | null
          template_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["onboarding_task_category"]
          created_at?: string
          description?: string | null
          due_offset_days?: number | null
          id?: string
          organization_id?: string
          owner_type?: Database["public"]["Enums"]["onboarding_owner_type"]
          resource_links?: Json
          stage_id?: string | null
          template_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "onboarding_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          role_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          role_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          role_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_checklist_settings: {
        Row: {
          allow_self_verify: boolean | null
          auto_expire_hours: number | null
          created_at: string | null
          id: string
          organization_id: string
          require_photos: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_self_verify?: boolean | null
          auto_expire_hours?: number | null
          created_at?: string | null
          id?: string
          organization_id: string
          require_photos?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_self_verify?: boolean | null
          auto_expire_hours?: number | null
          created_at?: string | null
          id?: string
          organization_id?: string
          require_photos?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          created_at: string
          created_by: string
          current_uses: number
          expires_at: string
          id: string
          invite_code: string
          invited_role: string | null
          invited_team_id: string | null
          is_active: boolean
          max_uses: number | null
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          current_uses?: number
          expires_at?: string
          id?: string
          invite_code: string
          invited_role?: string | null
          invited_team_id?: string | null
          is_active?: boolean
          max_uses?: number | null
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          current_uses?: number
          expires_at?: string
          id?: string
          invite_code?: string
          invited_role?: string | null
          invited_team_id?: string | null
          is_active?: boolean
          max_uses?: number | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_invited_team_id_fkey"
            columns: ["invited_team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_invited_team_id_fkey"
            columns: ["invited_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_payment_settings: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_address: string | null
          bank_name: string | null
          bank_routing_number: string | null
          created_at: string
          default_payment_terms: string | null
          default_tax_rate: number | null
          id: string
          invoice_footer: string | null
          organization_id: string
          stripe_account_id: string | null
          stripe_publishable_key: string | null
          updated_at: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_address?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          id?: string
          invoice_footer?: string | null
          organization_id: string
          stripe_account_id?: string | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_address?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string
          default_payment_terms?: string | null
          default_tax_rate?: number | null
          id?: string
          invoice_footer?: string | null
          organization_id?: string
          stripe_account_id?: string | null
          stripe_publishable_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          timezone: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          timezone?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          timezone?: string | null
        }
        Relationships: []
      }
      parsed_data_staging: {
        Row: {
          batch_id: string
          confidence_score: number | null
          created_at: string
          extracted_data: Json
          file_name: string
          id: string
          organization_id: string
          pos_system: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_corrections: Json | null
          validation_errors: Json | null
        }
        Insert: {
          batch_id: string
          confidence_score?: number | null
          created_at?: string
          extracted_data: Json
          file_name: string
          id?: string
          organization_id: string
          pos_system: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_corrections?: Json | null
          validation_errors?: Json | null
        }
        Update: {
          batch_id?: string
          confidence_score?: number | null
          created_at?: string
          extracted_data?: Json
          file_name?: string
          id?: string
          organization_id?: string
          pos_system?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_corrections?: Json | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "parsed_data_staging_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_data_staging_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_data_staging_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_data_staging_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          notes: string | null
          organization_id: string
          payment_date: string
          payment_method: string | null
          recorded_by: string
          reference_number: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          notes?: string | null
          organization_id: string
          payment_date?: string
          payment_method?: string | null
          recorded_by: string
          reference_number?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string
          payment_method?: string | null
          recorded_by?: string
          reference_number?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_records_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "created_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_actions: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          module_id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          module_id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          module_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_actions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audit_log: {
        Row: {
          action_id: string
          change_type: string
          changed_by: string
          created_at: string
          id: string
          module_id: string
          new_value: boolean
          old_value: boolean | null
          organization_id: string
          target_job_role_id: string | null
          target_role: string | null
          target_user_id: string | null
        }
        Insert: {
          action_id: string
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          module_id: string
          new_value: boolean
          old_value?: boolean | null
          organization_id: string
          target_job_role_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_id?: string
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          module_id?: string
          new_value?: boolean
          old_value?: boolean | null
          organization_id?: string
          target_job_role_id?: string | null
          target_role?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permission_audit_log_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_job_role_id_fkey"
            columns: ["target_job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_audit_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_modules: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      petty_cash_boxes: {
        Row: {
          created_at: string
          current_balance: number
          id: string
          initial_amount: number
          is_active: boolean | null
          location: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_balance?: number
          id?: string
          initial_amount?: number
          is_active?: boolean | null
          location: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_balance?: number
          id?: string
          initial_amount?: number
          is_active?: boolean | null
          location?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      petty_cash_transactions: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          date: string
          description: string
          id: string
          organization_id: string
          petty_cash_box_id: string
          receipt_url: string | null
          team_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          organization_id: string
          petty_cash_box_id: string
          receipt_url?: string | null
          team_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          organization_id?: string
          petty_cash_box_id?: string
          receipt_url?: string | null
          team_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_transactions_petty_cash_box_id_fkey"
            columns: ["petty_cash_box_id"]
            isOneToOne: false
            referencedRelation: "petty_cash_boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_system_configs: {
        Row: {
          config_data: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          organization_id: string
          system_name: string
          updated_at: string
        }
        Insert: {
          config_data?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          organization_id: string
          system_name: string
          updated_at?: string
        }
        Update: {
          config_data?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          system_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_system_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_system_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_system_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_teams: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          project_id: string
          team_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id: string
          team_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          project_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_teams_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_teams_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          budget_spent: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_completed: boolean | null
          manager_id: string | null
          organization_id: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          tasks_count: number | null
          team_members: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          budget_spent?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id: string
          is_completed?: boolean | null
          manager_id?: string | null
          organization_id: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          tasks_count?: number | null
          team_members?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          budget_spent?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_completed?: boolean | null
          manager_id?: string | null
          organization_id?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          tasks_count?: number | null
          team_members?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answer_overrides: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          original_score: number
          overridden_at: string | null
          overridden_by: string
          override_score: number
          question_id: string
          quiz_attempt_id: string
          reason: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          original_score: number
          overridden_at?: string | null
          overridden_by: string
          override_score: number
          question_id: string
          quiz_attempt_id: string
          reason: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          original_score?: number
          overridden_at?: string | null
          overridden_by?: string
          override_score?: number
          question_id?: string
          quiz_attempt_id?: string
          reason?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_answer_overrides_attempt_id"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_quiz_answer_overrides_question_id"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          attempt_number: number
          completed_at: string | null
          id: string
          max_score: number
          organization_id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          answers: Json
          attempt_number: number
          completed_at?: string | null
          id?: string
          max_score: number
          organization_id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          completed_at?: string | null
          id?: string
          max_score?: number
          organization_id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_attempts_quiz_id"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          explanation: string | null
          id: string
          options: Json | null
          points: number | null
          question_order: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_order: number
          question_text: string
          question_type: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          points?: number | null
          question_order?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quiz_questions_quiz"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          max_attempts: number | null
          module_id: string | null
          organization_id: string | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          organization_id?: string | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          max_attempts?: number | null
          module_id?: string | null
          organization_id?: string | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_quizzes_module"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean | null
          location: string | null
          next_generation_date: string | null
          organization_id: string
          start_date: string
          type: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          next_generation_date?: string | null
          organization_id: string
          start_date: string
          type: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          location?: string | null
          next_generation_date?: string | null
          organization_id?: string
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      request_activity_feed: {
        Row: {
          activity_data: Json
          activity_type: string
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          request_id: string
          user_id: string
        }
        Insert: {
          activity_data?: Json
          activity_type: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          request_id: string
          user_id: string
        }
        Update: {
          activity_data?: Json
          activity_type?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: []
      }
      request_analytics: {
        Row: {
          approver_id: string | null
          created_at: string
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          organization_id: string
          previous_status: string | null
          processing_time_minutes: number | null
          request_id: string
          request_type_id: string
          user_id: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          organization_id: string
          previous_status?: string | null
          processing_time_minutes?: number | null
          request_id: string
          request_type_id: string
          user_id: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          organization_id?: string
          previous_status?: string | null
          processing_time_minutes?: number | null
          request_id?: string
          request_type_id?: string
          user_id?: string
        }
        Relationships: []
      }
      request_approval_workflows: {
        Row: {
          approval_levels: Json
          auto_escalate: boolean
          created_at: string
          created_by: string
          delegation_allowed: boolean
          emergency_override_roles: string[] | null
          id: string
          is_active: boolean
          organization_id: string
          request_type_id: string
          timeout_hours: number | null
          updated_at: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          approval_levels?: Json
          auto_escalate?: boolean
          created_at?: string
          created_by: string
          delegation_allowed?: boolean
          emergency_override_roles?: string[] | null
          id?: string
          is_active?: boolean
          organization_id: string
          request_type_id: string
          timeout_hours?: number | null
          updated_at?: string
          workflow_name: string
          workflow_type?: string
        }
        Update: {
          approval_levels?: Json
          auto_escalate?: boolean
          created_at?: string
          created_by?: string
          delegation_allowed?: boolean
          emergency_override_roles?: string[] | null
          id?: string
          is_active?: boolean
          organization_id?: string
          request_type_id?: string
          timeout_hours?: number | null
          updated_at?: string
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: []
      }
      request_approvals: {
        Row: {
          approval_level: number
          approved_at: string | null
          approver_id: string
          comments: string | null
          created_at: string
          id: string
          organization_id: string
          request_id: string
          status: string | null
        }
        Insert: {
          approval_level?: number
          approved_at?: string | null
          approver_id: string
          comments?: string | null
          created_at?: string
          id?: string
          organization_id: string
          request_id: string
          status?: string | null
        }
        Update: {
          approval_level?: number
          approved_at?: string | null
          approver_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          request_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_assignment_analytics: {
        Row: {
          approver_id: string
          assignment_rule_id: string | null
          assignment_score: number | null
          assignment_time: string
          created_at: string
          id: string
          job_role_id: string | null
          organization_id: string
          request_id: string
          response_time_hours: number | null
        }
        Insert: {
          approver_id: string
          assignment_rule_id?: string | null
          assignment_score?: number | null
          assignment_time?: string
          created_at?: string
          id?: string
          job_role_id?: string | null
          organization_id: string
          request_id: string
          response_time_hours?: number | null
        }
        Update: {
          approver_id?: string
          assignment_rule_id?: string | null
          assignment_score?: number | null
          assignment_time?: string
          created_at?: string
          id?: string
          job_role_id?: string | null
          organization_id?: string
          request_id?: string
          response_time_hours?: number | null
        }
        Relationships: []
      }
      request_assignment_rules: {
        Row: {
          assignment_strategy: string
          conditions: Json
          created_at: string
          created_by: string
          escalation_rules: Json | null
          id: string
          is_active: boolean
          organization_id: string
          priority_order: number
          request_type_id: string
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          assignment_strategy?: string
          conditions?: Json
          created_at?: string
          created_by: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean
          organization_id: string
          priority_order?: number
          request_type_id: string
          rule_name: string
          rule_type?: string
          updated_at?: string
        }
        Update: {
          assignment_strategy?: string
          conditions?: Json
          created_at?: string
          created_by?: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean
          organization_id?: string
          priority_order?: number
          request_type_id?: string
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          organization_id: string
          request_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          organization_id: string
          request_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          organization_id?: string
          request_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          organization_id: string
          priority: number | null
          request_type_id: string | null
          rule_name: string
          updated_at: string
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string
          created_by: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          organization_id: string
          priority?: number | null
          request_type_id?: string | null
          rule_name: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          organization_id?: string
          priority?: number | null
          request_type_id?: string | null
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          organization_id: string
          request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          organization_id: string
          request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          organization_id?: string
          request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_comments_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_request_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_request_comments_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_cost_tracking: {
        Row: {
          actual_cost: number | null
          budget_code: string | null
          cost_category: string
          cost_center: string | null
          cost_currency: string | null
          created_at: string
          estimated_cost: number | null
          id: string
          organization_id: string
          request_id: string
          tracking_data: Json | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          budget_code?: string | null
          cost_category: string
          cost_center?: string | null
          cost_currency?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          organization_id: string
          request_id: string
          tracking_data?: Json | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          budget_code?: string | null
          cost_category?: string
          cost_center?: string | null
          cost_currency?: string | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          organization_id?: string
          request_id?: string
          tracking_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      request_delegations: {
        Row: {
          delegate_approver_id: string
          delegated_at: string
          delegation_reason: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          organization_id: string
          original_approver_id: string
          request_id: string
        }
        Insert: {
          delegate_approver_id: string
          delegated_at?: string
          delegation_reason?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          original_approver_id: string
          request_id: string
        }
        Update: {
          delegate_approver_id?: string
          delegated_at?: string
          delegation_reason?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          original_approver_id?: string
          request_id?: string
        }
        Relationships: []
      }
      request_template_usage: {
        Row: {
          id: string
          organization_id: string
          request_id: string | null
          template_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          request_id?: string | null
          template_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          request_id?: string | null
          template_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      request_type_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          name: string
          organization_id: string | null
          popularity_score: number | null
          tags: string[] | null
          template_data: Json
          updated_at: string
          usage_count: number | null
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name: string
          organization_id?: string | null
          popularity_score?: number | null
          tags?: string[] | null
          template_data: Json
          updated_at?: string
          usage_count?: number | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          name?: string
          organization_id?: string | null
          popularity_score?: number | null
          tags?: string[] | null
          template_data?: Json
          updated_at?: string
          usage_count?: number | null
          version?: string | null
        }
        Relationships: []
      }
      request_types: {
        Row: {
          allows_attachments: boolean
          approval_roles: string[] | null
          category: string
          created_at: string
          created_by: string
          creator_role_restrictions: string[] | null
          default_job_roles: string[] | null
          description: string | null
          display_order: number | null
          expertise_tags: string[] | null
          form_schema: Json | null
          id: string
          is_active: boolean | null
          is_subcategory: boolean | null
          name: string
          organization_id: string
          parent_category_id: string | null
          parent_id: string | null
          permission_metadata: Json | null
          required_permissions: Json | null
          requires_approval: boolean | null
          selected_user_ids: string[] | null
          subcategory: string | null
          updated_at: string
          viewer_role_restrictions: string[] | null
        }
        Insert: {
          allows_attachments?: boolean
          approval_roles?: string[] | null
          category: string
          created_at?: string
          created_by: string
          creator_role_restrictions?: string[] | null
          default_job_roles?: string[] | null
          description?: string | null
          display_order?: number | null
          expertise_tags?: string[] | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean | null
          is_subcategory?: boolean | null
          name: string
          organization_id: string
          parent_category_id?: string | null
          parent_id?: string | null
          permission_metadata?: Json | null
          required_permissions?: Json | null
          requires_approval?: boolean | null
          selected_user_ids?: string[] | null
          subcategory?: string | null
          updated_at?: string
          viewer_role_restrictions?: string[] | null
        }
        Update: {
          allows_attachments?: boolean
          approval_roles?: string[] | null
          category?: string
          created_at?: string
          created_by?: string
          creator_role_restrictions?: string[] | null
          default_job_roles?: string[] | null
          description?: string | null
          display_order?: number | null
          expertise_tags?: string[] | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean | null
          is_subcategory?: boolean | null
          name?: string
          organization_id?: string
          parent_category_id?: string | null
          parent_id?: string | null
          permission_metadata?: Json | null
          required_permissions?: Json | null
          requires_approval?: boolean | null
          selected_user_ids?: string[] | null
          subcategory?: string | null
          updated_at?: string
          viewer_role_restrictions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "request_types_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "request_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_types_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "request_types"
            referencedColumns: ["id"]
          },
        ]
      }
      request_updates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          organization_id: string
          request_id: string
          title: string
          update_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          organization_id: string
          request_id: string
          title: string
          update_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          organization_id?: string
          request_id?: string
          title?: string
          update_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_request_updates_request_id"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_request_updates_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_request_updates_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_updates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          actual_processing_time: number | null
          archived_at: string | null
          assigned_at: string | null
          assigned_to: string | null
          attachments_count: number | null
          automation_applied: boolean | null
          automation_rule_ids: string[] | null
          comments_count: number | null
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_processing_time: number | null
          form_data: Json | null
          id: string
          organization_id: string
          priority: string | null
          request_type_id: string
          requested_by: string
          sla_breached: boolean | null
          sla_deadline: string | null
          status: string | null
          submitted_at: string | null
          template_used_id: string | null
          ticket_number: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          actual_processing_time?: number | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attachments_count?: number | null
          automation_applied?: boolean | null
          automation_rule_ids?: string[] | null
          comments_count?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_processing_time?: number | null
          form_data?: Json | null
          id?: string
          organization_id: string
          priority?: string | null
          request_type_id: string
          requested_by: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string | null
          submitted_at?: string | null
          template_used_id?: string | null
          ticket_number?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          actual_processing_time?: number | null
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          attachments_count?: number | null
          automation_applied?: boolean | null
          automation_rule_ids?: string[] | null
          comments_count?: number | null
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_processing_time?: number | null
          form_data?: Json | null
          id?: string
          organization_id?: string
          priority?: string | null
          request_type_id?: string
          requested_by?: string
          sla_breached?: boolean | null
          sla_deadline?: string | null
          status?: string | null
          submitted_at?: string | null
          template_used_id?: string | null
          ticket_number?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_request_type_id_fkey"
            columns: ["request_type_id"]
            isOneToOne: false
            referencedRelation: "request_types"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action_id: string
          created_at: string
          granted: boolean
          id: string
          module_id: string
          organization_id: string
          role: string
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          granted?: boolean
          id?: string
          module_id: string
          organization_id: string
          role: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          granted?: boolean
          id?: string
          module_id?: string
          organization_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channel_transactions: {
        Row: {
          channel_id: string
          commission_fee: number
          created_at: string
          date: string
          gross_sales: number
          id: string
          location: string
          net_sales: number
          order_count: number | null
          organization_id: string
          sales_data_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          commission_fee?: number
          created_at?: string
          date: string
          gross_sales?: number
          id?: string
          location: string
          net_sales?: number
          order_count?: number | null
          organization_id: string
          sales_data_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          commission_fee?: number
          created_at?: string
          date?: string
          gross_sales?: number
          id?: string
          location?: string
          net_sales?: number
          order_count?: number | null
          organization_id?: string
          sales_data_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_channel_transactions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "sales_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_channel_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_channel_transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_channels: {
        Row: {
          commission_rate: number
          commission_type: string
          created_at: string
          created_by: string
          description: string | null
          flat_fee_amount: number | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          organization_id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number
          commission_type?: string
          created_at?: string
          created_by: string
          description?: string | null
          flat_fee_amount?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          organization_id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number
          commission_type?: string
          created_at?: string
          created_by?: string
          description?: string | null
          flat_fee_amount?: number | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          organization_id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_channels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_channels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_data: {
        Row: {
          calculated_cash: number
          created_at: string
          date: string
          expenses: number | null
          gross_sales: number
          id: string
          labor_cost: number
          labor_hours: number
          labor_percentage: number
          location: string
          net_sales: number
          non_cash: number
          order_average: number
          order_count: number
          organization_id: string
          raw_data: Json | null
          refunds: number | null
          sales_per_labor_hour: number
          surcharges: number | null
          team_id: string | null
          tips: number
          total_cash: number
          updated_at: string
          user_id: string
          voids: number | null
        }
        Insert: {
          calculated_cash?: number
          created_at?: string
          date: string
          expenses?: number | null
          gross_sales?: number
          id?: string
          labor_cost?: number
          labor_hours?: number
          labor_percentage?: number
          location: string
          net_sales?: number
          non_cash?: number
          order_average?: number
          order_count?: number
          organization_id: string
          raw_data?: Json | null
          refunds?: number | null
          sales_per_labor_hour?: number
          surcharges?: number | null
          team_id?: string | null
          tips?: number
          total_cash?: number
          updated_at?: string
          user_id: string
          voids?: number | null
        }
        Update: {
          calculated_cash?: number
          created_at?: string
          date?: string
          expenses?: number | null
          gross_sales?: number
          id?: string
          labor_cost?: number
          labor_hours?: number
          labor_percentage?: number
          location?: string
          net_sales?: number
          non_cash?: number
          order_average?: number
          order_count?: number
          organization_id?: string
          raw_data?: Json | null
          refunds?: number | null
          sales_per_labor_hour?: number
          surcharges?: number | null
          team_id?: string | null
          tips?: number
          total_cash?: number
          updated_at?: string
          user_id?: string
          voids?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_data_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_data_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_periods: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          id: string
          is_published: boolean | null
          name: string
          organization_id: string
          published_at: string | null
          published_by: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          id?: string
          is_published?: boolean | null
          name: string
          organization_id: string
          published_at?: string | null
          published_by?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          id?: string
          is_published?: boolean | null
          name?: string
          organization_id?: string
          published_at?: string | null
          published_by?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_folders: {
        Row: {
          created_at: string
          folder_name: string
          id: string
          owner_id: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          folder_name: string
          id?: string
          owner_id: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          folder_name?: string
          id?: string
          owner_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_folders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_folders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_folders_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_folders_shared_with_user_id_fkey"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_swap_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          organization_id: string
          reason: string | null
          requester_id: string
          schedule_id: string | null
          status: string
          target_employee_id: string | null
          target_schedule_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          reason?: string | null
          requester_id: string
          schedule_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_schedule_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          reason?: string | null
          requester_id?: string
          schedule_id?: string | null
          status?: string
          target_employee_id?: string | null
          target_schedule_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_swap_requests_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "employee_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_swap_requests_target_schedule_id_fkey"
            columns: ["target_schedule_id"]
            isOneToOne: false
            referencedRelation: "employee_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_templates: {
        Row: {
          break_duration_minutes: number | null
          created_at: string
          end_time: string
          id: string
          is_recurring: boolean | null
          max_employees: number | null
          min_employees: number | null
          name: string
          organization_id: string
          recurrence_pattern: string | null
          start_time: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          break_duration_minutes?: number | null
          created_at?: string
          end_time: string
          id?: string
          is_recurring?: boolean | null
          max_employees?: number | null
          min_employees?: number | null
          name: string
          organization_id: string
          recurrence_pattern?: string | null
          start_time: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          break_duration_minutes?: number | null
          created_at?: string
          end_time?: string
          id?: string
          is_recurring?: boolean | null
          max_employees?: number | null
          min_employees?: number | null
          name?: string
          organization_id?: string
          recurrence_pattern?: string | null
          start_time?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "schedule_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignment_audit: {
        Row: {
          change_reason: string | null
          change_type: string
          changed_by: string
          created_at: string
          id: string
          new_assignment: Json | null
          old_assignment: Json | null
          organization_id: string
          task_id: string
        }
        Insert: {
          change_reason?: string | null
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_assignment?: Json | null
          old_assignment?: Json | null
          organization_id: string
          task_id: string
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_assignment?: Json | null
          old_assignment?: Json | null
          organization_id?: string
          task_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: string | null
          assigned_at: string | null
          assigned_to_id: string | null
          assigned_to_ids: string[] | null
          assigned_to_names: string[] | null
          assignment_notes: string | null
          assignment_source: string | null
          assignment_type: string | null
          completed_at: string | null
          cost: number | null
          created_at: string | null
          deadline: string | null
          description: string | null
          google_event_id_deadline: string | null
          google_event_id_focus_time: string | null
          google_event_id_reminder: string | null
          google_tasks_id: string | null
          id: string
          is_archived: boolean | null
          is_recurring: boolean | null
          last_synced_at: string | null
          next_due_date: string | null
          organization_id: string
          priority: string | null
          project_id: string | null
          recurrence_count: number | null
          recurrence_end_date: string | null
          recurrence_parent_id: string | null
          recurrence_pattern: Json | null
          scheduled_end: string | null
          scheduled_start: string | null
          source: string | null
          status: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          warning_period_hours: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_ids?: string[] | null
          assigned_to_names?: string[] | null
          assignment_notes?: string | null
          assignment_source?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          google_event_id_deadline?: string | null
          google_event_id_focus_time?: string | null
          google_event_id_reminder?: string | null
          google_tasks_id?: string | null
          id: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
          last_synced_at?: string | null
          next_due_date?: string | null
          organization_id: string
          priority?: string | null
          project_id?: string | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_pattern?: Json | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          warning_period_hours?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_at?: string | null
          assigned_to_id?: string | null
          assigned_to_ids?: string[] | null
          assigned_to_names?: string[] | null
          assignment_notes?: string | null
          assignment_source?: string | null
          assignment_type?: string | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          google_event_id_deadline?: string | null
          google_event_id_focus_time?: string | null
          google_event_id_reminder?: string | null
          google_tasks_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
          last_synced_at?: string | null
          next_due_date?: string | null
          organization_id?: string
          priority?: string | null
          project_id?: string | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_parent_id?: string | null
          recurrence_pattern?: Json | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          source?: string | null
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          warning_period_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_inventory_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          due_time: string | null
          id: string
          is_active: boolean
          organization_id: string
          schedule_days: string[] | null
          team_id: string
          template_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          due_time?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          schedule_days?: string[] | null
          team_id: string
          template_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          due_time?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          schedule_days?: string[] | null
          team_id?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_inventory_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_inventory_assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_inventory_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inventory_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      team_job_roles: {
        Row: {
          created_at: string
          id: string
          job_role_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_role_id: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_role_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_job_roles_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_job_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_job_roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_job_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_job_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          manager_id: string
          name: string
          organization_id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          manager_id: string
          name: string
          organization_id: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          manager_id?: string
          name?: string
          organization_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          id: string
          joined_at: string
          role: string
          system_role_override: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          system_role_override?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          system_role_override?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_counters: {
        Row: {
          last_number: number
          year: string
        }
        Insert: {
          last_number?: number
          year: string
        }
        Update: {
          last_number?: number
          year?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approval_notes: string | null
          approval_rejected_reason: string | null
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          clock_in: string
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out: string | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_paused: boolean | null
          notes: string | null
          organization_id: string
          paused_at: string | null
          shift_id: string | null
          task_id: string | null
          team_id: string | null
          total_paused_duration: unknown | null
          user_id: string
        }
        Insert: {
          approval_notes?: string | null
          approval_rejected_reason?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          clock_in?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          organization_id: string
          paused_at?: string | null
          shift_id?: string | null
          task_id?: string | null
          team_id?: string | null
          total_paused_duration?: unknown | null
          user_id: string
        }
        Update: {
          approval_notes?: string | null
          approval_rejected_reason?: string | null
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          clock_in?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          organization_id?: string
          paused_at?: string | null
          shift_id?: string | null
          task_id?: string | null
          team_id?: string | null
          total_paused_duration?: unknown | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entry_correction_requests: {
        Row: {
          admin_id: string | null
          admin_notes: string | null
          admin_reviewed_at: string | null
          created_at: string
          employee_id: string
          employee_reason: string
          id: string
          manager_id: string | null
          manager_notes: string | null
          manager_reviewed_at: string | null
          organization_id: string
          requested_at: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          created_at?: string
          employee_id: string
          employee_reason: string
          id?: string
          manager_id?: string | null
          manager_notes?: string | null
          manager_reviewed_at?: string | null
          organization_id: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string | null
          admin_reviewed_at?: string | null
          created_at?: string
          employee_id?: string
          employee_reason?: string
          id?: string
          manager_id?: string | null
          manager_notes?: string | null
          manager_reviewed_at?: string | null
          organization_id?: string
          requested_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entry_corrections: {
        Row: {
          corrected_clock_in: string | null
          corrected_clock_out: string | null
          corrected_notes: string | null
          correction_request_id: string
          created_at: string
          id: string
          original_clock_in: string | null
          original_clock_out: string | null
          original_notes: string | null
          time_entry_id: string
        }
        Insert: {
          corrected_clock_in?: string | null
          corrected_clock_out?: string | null
          corrected_notes?: string | null
          correction_request_id: string
          created_at?: string
          id?: string
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_notes?: string | null
          time_entry_id: string
        }
        Update: {
          corrected_clock_in?: string | null
          corrected_clock_out?: string | null
          corrected_notes?: string | null
          correction_request_id?: string
          created_at?: string
          id?: string
          original_clock_in?: string | null
          original_clock_out?: string | null
          original_notes?: string | null
          time_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entry_corrections_correction_request_id_fkey"
            columns: ["correction_request_id"]
            isOneToOne: false
            referencedRelation: "time_entry_correction_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      training_assignment_audit: {
        Row: {
          action_type: string
          assignment_id: string
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          performed_by: string
          reason: string | null
        }
        Insert: {
          action_type: string
          assignment_id: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          performed_by: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          assignment_id?: string
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          performed_by?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_assignment_audit_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignment_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignment_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          assigned_to: string
          assignment_type: string
          certificate_status: string | null
          certificate_uploaded_at: string | null
          certificate_url: string | null
          completed_at: string | null
          completion_score: number | null
          content_id: string
          content_title: string
          created_at: string
          due_date: string | null
          id: string
          is_retraining: boolean | null
          next_retraining_due: string | null
          notes: string | null
          organization_id: string
          original_assignment_id: string | null
          priority: string | null
          reassigned_by: string | null
          reassigned_from: string | null
          reassignment_date: string | null
          reassignment_reason: string | null
          started_at: string | null
          status: string
          updated_at: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          assigned_to: string
          assignment_type: string
          certificate_status?: string | null
          certificate_uploaded_at?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          completion_score?: number | null
          content_id: string
          content_title: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_retraining?: boolean | null
          next_retraining_due?: string | null
          notes?: string | null
          organization_id: string
          original_assignment_id?: string | null
          priority?: string | null
          reassigned_by?: string | null
          reassigned_from?: string | null
          reassignment_date?: string | null
          reassignment_reason?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          assigned_to?: string
          assignment_type?: string
          certificate_status?: string | null
          certificate_uploaded_at?: string | null
          certificate_url?: string | null
          completed_at?: string | null
          completion_score?: number | null
          content_id?: string
          content_title?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_retraining?: boolean | null
          next_retraining_due?: string | null
          notes?: string | null
          organization_id?: string
          original_assignment_id?: string | null
          priority?: string | null
          reassigned_by?: string | null
          reassigned_from?: string | null
          reassignment_date?: string | null
          reassignment_reason?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_reassigned_by_fkey"
            columns: ["reassigned_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_reassigned_by_fkey"
            columns: ["reassigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_assignments_reassigned_from_fkey"
            columns: ["reassigned_from"]
            isOneToOne: false
            referencedRelation: "training_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          completion_method: string | null
          compliance_template_id: string | null
          created_at: string
          created_by: string
          description: string | null
          difficulty_level: string | null
          estimated_duration_minutes: number | null
          external_base_url: string | null
          id: string
          is_active: boolean | null
          is_external: boolean | null
          organization_id: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          url_parameters: Json | null
        }
        Insert: {
          completion_method?: string | null
          compliance_template_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          external_base_url?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          organization_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          url_parameters?: Json | null
        }
        Update: {
          completion_method?: string | null
          compliance_template_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          external_base_url?: string | null
          id?: string
          is_active?: boolean | null
          is_external?: boolean | null
          organization_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          url_parameters?: Json | null
        }
        Relationships: []
      }
      training_modules: {
        Row: {
          content_type: string
          course_id: string
          created_at: string
          description: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          module_order: number
          text_content: string | null
          title: string
          updated_at: string
          video_source: string | null
          video_url: string | null
        }
        Insert: {
          content_type: string
          course_id: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          module_order: number
          text_content?: string | null
          title: string
          updated_at?: string
          video_source?: string | null
          video_url?: string | null
        }
        Update: {
          content_type?: string
          course_id?: string
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          module_order?: number
          text_content?: string | null
          title?: string
          updated_at?: string
          video_source?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_training_modules_course"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_retraining_notifications: {
        Row: {
          assignment_id: string | null
          course_id: string
          created_at: string
          escalation_level: number | null
          id: string
          notification_type: string
          organization_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          course_id: string
          created_at?: string
          escalation_level?: number | null
          id?: string
          notification_type: string
          organization_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          course_id?: string
          created_at?: string
          escalation_level?: number | null
          id?: string
          notification_type?: string
          organization_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_retraining_settings: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          organization_id: string
          retraining_interval_months: number
          updated_at: string
          warning_period_days: number
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          organization_id: string
          retraining_interval_months?: number
          updated_at?: string
          warning_period_days?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          retraining_interval_months?: number
          updated_at?: string
          warning_period_days?: number
        }
        Relationships: []
      }
      transaction_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          location: string | null
          notes: string | null
          organization_id: string
          receipt_url: string | null
          recurring_template_id: string | null
          tags: string[] | null
          team_id: string | null
          type: string
          updated_at: string
          user_id: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          date: string
          description: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          organization_id: string
          receipt_url?: string | null
          recurring_template_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          type: string
          updated_at?: string
          user_id: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          organization_id?: string
          receipt_url?: string | null
          recurring_template_id?: string | null
          tags?: string[] | null
          team_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "transaction_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_batches: {
        Row: {
          batch_name: string | null
          completed_at: string | null
          created_at: string
          failed_files: number
          id: string
          organization_id: string
          processed_files: number
          status: string
          total_files: number
          uploaded_by: string
        }
        Insert: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string
          failed_files?: number
          id?: string
          organization_id: string
          processed_files?: number
          status?: string
          total_files?: number
          uploaded_by: string
        }
        Update: {
          batch_name?: string | null
          completed_at?: string | null
          created_at?: string
          failed_files?: number
          id?: string
          organization_id?: string
          processed_files?: number
          status?: string
          total_files?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_deletion_audit: {
        Row: {
          affected_resources: Json
          deleted_by_user_email: string
          deleted_by_user_id: string
          deleted_user_email: string
          deleted_user_id: string
          deleted_user_name: string
          deleted_user_role: string
          deletion_reason: string | null
          deletion_timestamp: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          affected_resources?: Json
          deleted_by_user_email: string
          deleted_by_user_id: string
          deleted_user_email: string
          deleted_user_id: string
          deleted_user_name: string
          deleted_user_role: string
          deletion_reason?: string | null
          deletion_timestamp?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          affected_resources?: Json
          deleted_by_user_email?: string
          deleted_by_user_id?: string
          deleted_user_email?: string
          deleted_user_id?: string
          deleted_user_name?: string
          deleted_user_role?: string
          deletion_reason?: string | null
          deletion_timestamp?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      user_job_roles: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          job_role_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          job_role_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          job_role_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_roles_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_job_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_management_audit: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          performed_by_email: string
          performed_by_user_id: string
          target_user_email: string
          target_user_id: string
          target_user_name: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          performed_by_email: string
          performed_by_user_id: string
          target_user_email: string
          target_user_id: string
          target_user_name: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          performed_by_email?: string
          performed_by_user_id?: string
          target_user_email?: string
          target_user_id?: string
          target_user_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      user_permission_overrides: {
        Row: {
          action_id: string
          created_at: string
          granted: boolean
          granted_by: string
          id: string
          module_id: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          created_at?: string
          granted?: boolean
          granted_by: string
          id?: string
          module_id: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          created_at?: string
          granted?: boolean
          granted_by?: string
          id?: string
          module_id?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "permission_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_training_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          last_accessed_at: string | null
          module_id: string | null
          organization_id: string
          progress_percentage: number | null
          started_at: string | null
          status: string | null
          user_id: string
          video_completed_at: string | null
          video_progress_percentage: number | null
          video_watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          last_accessed_at?: string | null
          module_id?: string | null
          organization_id: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          user_id: string
          video_completed_at?: string | null
          video_progress_percentage?: number | null
          video_watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          last_accessed_at?: string | null
          module_id?: string | null
          organization_id?: string
          progress_percentage?: number | null
          started_at?: string | null
          status?: string | null
          user_id?: string
          video_completed_at?: string | null
          video_progress_percentage?: number | null
          video_watch_time_seconds?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          daily_email_enabled: boolean | null
          daily_email_time: string | null
          department: string | null
          email: string
          emergency_contact_needed: boolean | null
          employee_id: string | null
          expertise_tags: string[] | null
          google_calendar_sync_enabled: boolean | null
          google_calendar_token: string | null
          google_calendar_webhook_id: string | null
          google_refresh_token: string | null
          google_tasks_enabled: boolean | null
          google_tasks_token: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          location: string | null
          manager_id: string | null
          name: string
          organization_id: string
          phone: string | null
          preferred_name: string | null
          push_token: string | null
          role: string
          timezone: string | null
          workload_preference: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_email_enabled?: boolean | null
          daily_email_time?: string | null
          department?: string | null
          email: string
          emergency_contact_needed?: boolean | null
          employee_id?: string | null
          expertise_tags?: string[] | null
          google_calendar_sync_enabled?: boolean | null
          google_calendar_token?: string | null
          google_calendar_webhook_id?: string | null
          google_refresh_token?: string | null
          google_tasks_enabled?: boolean | null
          google_tasks_token?: string | null
          hire_date?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          manager_id?: string | null
          name: string
          organization_id: string
          phone?: string | null
          preferred_name?: string | null
          push_token?: string | null
          role: string
          timezone?: string | null
          workload_preference?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          daily_email_enabled?: boolean | null
          daily_email_time?: string | null
          department?: string | null
          email?: string
          emergency_contact_needed?: boolean | null
          employee_id?: string | null
          expertise_tags?: string[] | null
          google_calendar_sync_enabled?: boolean | null
          google_calendar_token?: string | null
          google_calendar_webhook_id?: string | null
          google_refresh_token?: string | null
          google_tasks_enabled?: boolean | null
          google_tasks_token?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          manager_id?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          preferred_name?: string | null
          push_token?: string | null
          role?: string
          timezone?: string | null
          workload_preference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      video_library_categories: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      video_library_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          organization_id: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
          youtube_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
          youtube_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_library_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "video_library_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      video_library_permissions: {
        Row: {
          created_at: string | null
          granted_by: string
          id: string
          organization_id: string
          permission_type: string
          team_id: string | null
          user_id: string | null
          video_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by: string
          id?: string
          organization_id: string
          permission_type?: string
          team_id?: string | null
          user_id?: string | null
          video_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string
          id?: string
          organization_id?: string
          permission_type?: string
          team_id?: string | null
          user_id?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_library_permissions_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_items: {
        Row: {
          item_id: string
          on_hand: number
          reorder_max: number | null
          reorder_min: number | null
          wac_unit_cost: number
          warehouse_id: string
        }
        Insert: {
          item_id: string
          on_hand?: number
          reorder_max?: number | null
          reorder_min?: number | null
          wac_unit_cost?: number
          warehouse_id: string
        }
        Update: {
          item_id?: string
          on_hand?: number
          reorder_max?: number | null
          reorder_min?: number | null
          wac_unit_cost?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wi_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wi_wh"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_receipt_lines: {
        Row: {
          id: string
          item_id: string
          line_total: number | null
          qty: number
          receipt_id: string
          unit_cost: number
        }
        Insert: {
          id?: string
          item_id: string
          line_total?: number | null
          qty: number
          receipt_id: string
          unit_cost: number
        }
        Update: {
          id?: string
          item_id?: string
          line_total?: number | null
          qty?: number
          receipt_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_wrl_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wrl_wr"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "warehouse_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          received_at: string | null
          status: string
          subtotal: number | null
          vendor_invoice: string | null
          vendor_name: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string
          subtotal?: number | null
          vendor_invoice?: string | null
          vendor_name?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          status?: string
          subtotal?: number | null
          vendor_invoice?: string | null
          vendor_name?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wr_wh"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfer_lines: {
        Row: {
          id: string
          item_id: string
          line_total: number | null
          qty: number
          transfer_id: string
          unit_price: number
        }
        Insert: {
          id?: string
          item_id: string
          line_total?: number | null
          qty: number
          transfer_id: string
          unit_price: number
        }
        Update: {
          id?: string
          item_id?: string
          line_total?: number | null
          qty?: number
          transfer_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_wtl_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wtl_wt"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "v_team_recent_transfers"
            referencedColumns: ["transfer_id"]
          },
          {
            foreignKeyName: "fk_wtl_wt"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "warehouse_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          charge_subtotal: number | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          received_at: string | null
          sent_at: string | null
          status: string
          to_team_id: string
          transfer_no: string | null
          warehouse_id: string
        }
        Insert: {
          charge_subtotal?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string
          to_team_id: string
          transfer_no?: string | null
          warehouse_id: string
        }
        Update: {
          charge_subtotal?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          received_at?: string | null
          sent_at?: string | null
          status?: string
          to_team_id?: string
          transfer_no?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wt_team"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wt_team"
            columns: ["to_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wt_wh"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          team_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          team_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          created_at: string
          delivered_at: string | null
          endpoint_id: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          endpoint_id: string
          event_type: string
          id?: string
          organization_id: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          endpoint_id?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          name: string
          organization_id: string
          retry_config: Json | null
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          name: string
          organization_id: string
          retry_config?: Json | null
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          name?: string
          organization_id?: string
          retry_config?: Json | null
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      workflow_actions: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          execution_order: number
          id: string
          is_active: boolean | null
          organization_id: string
          retry_config: Json | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          execution_order?: number
          id?: string
          is_active?: boolean | null
          organization_id: string
          retry_config?: Json | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          execution_order?: number
          id?: string
          is_active?: boolean | null
          organization_id?: string
          retry_config?: Json | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_conditions: {
        Row: {
          condition_order: number
          condition_type: string
          created_at: string
          field_path: string
          id: string
          is_active: boolean | null
          logic_operator: string | null
          operator: string
          organization_id: string
          updated_at: string
          value_data: Json
          workflow_id: string
        }
        Insert: {
          condition_order?: number
          condition_type: string
          created_at?: string
          field_path: string
          id?: string
          is_active?: boolean | null
          logic_operator?: string | null
          operator: string
          organization_id: string
          updated_at?: string
          value_data: Json
          workflow_id: string
        }
        Update: {
          condition_order?: number
          condition_type?: string
          created_at?: string
          field_path?: string
          id?: string
          is_active?: boolean | null
          logic_operator?: string | null
          operator?: string
          organization_id?: string
          updated_at?: string
          value_data?: Json
          workflow_id?: string
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          execution_data: Json | null
          id: string
          organization_id: string
          request_id: string
          started_at: string
          status: string
          trigger_event: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          execution_data?: Json | null
          id?: string
          organization_id: string
          request_id: string
          started_at?: string
          status?: string
          trigger_event: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          execution_data?: Json | null
          id?: string
          organization_id?: string
          request_id?: string
          started_at?: string
          status?: string
          trigger_event?: string
          workflow_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      approver_workloads: {
        Row: {
          active_requests: number | null
          approver_id: string | null
          avg_pending_hours: number | null
          pending_count: number | null
        }
        Relationships: []
      }
      daily_inventory_summary: {
        Row: {
          low_stock_items: number | null
          overstock_items: number | null
          summary_date: string | null
          team_id: string | null
          team_name: string | null
          total_inventory_value: number | null
          total_items: number | null
          total_stock_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_team_performance: {
        Row: {
          avg_completion_rate: number | null
          calculated_accuracy_percentage: number | null
          completed_counts: number | null
          items_counted: number | null
          month_start: string | null
          team_id: string | null
          team_name: string | null
          total_counts: number | null
          total_variances: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_user_hierarchy: {
        Row: {
          assigned_tasks_count: number | null
          completed_tasks_count: number | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          organization_id: string | null
          organization_name: string | null
          role: string | null
          role_level: number | null
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_details: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          manager_email: string | null
          manager_id: string | null
          manager_name: string | null
          member_count: number | null
          name: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "organization_user_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_team_checklist_scores: {
        Row: {
          date: string | null
          executed_instances: number | null
          execution_pct: number | null
          org_id: string | null
          team_id: string | null
          total_instances: number | null
          verification_pct: number | null
          verified_instances: number | null
        }
        Relationships: []
      }
      v_team_recent_transfers: {
        Row: {
          item_id: string | null
          qty: number | null
          sent_at: string | null
          status: string | null
          team_id: string | null
          transfer_id: string | null
          unit_price: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_wt_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wt_team"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_wtl_item"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_performance_analytics: {
        Row: {
          avg_item_cost: number | null
          items_supplied: number | null
          last_transaction_date: string | null
          teams_served: number | null
          total_inventory_value: number | null
          total_transactions: number | null
          vendor_id: string | null
          vendor_name: string | null
        }
        Relationships: []
      }
      weekly_inventory_movements: {
        Row: {
          po_number: string | null
          team_id: string | null
          team_name: string | null
          total_quantity: number | null
          total_value: number | null
          transaction_count: number | null
          transaction_type: string | null
          vendor_name: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_role_update: {
        Args: { new_role: string; target_user_id: string }
        Returns: Json
      }
      admin_update_user_email: {
        Args: { new_email: string; target_user_id: string }
        Returns: Json
      }
      admin_update_user_role: {
        Args: {
          admin_user_id?: string
          new_role: string
          target_user_id: string
        }
        Returns: Json
      }
      approve_time_entry: {
        Args: {
          approval_action: string
          approval_notes?: string
          entry_id: string
        }
        Returns: Json
      }
      audit_organization_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          orphaned_records: number
          records_without_org: number
          table_name: string
        }[]
      }
      auto_close_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      bulk_approve_time_entries: {
        Args: {
          approval_notes_text?: string
          entry_ids: string[]
          manager_id: string
        }
        Returns: Json
      }
      bump_count_item_actual: {
        Args:
          | { p_count_id: string; p_count_item_id: string; p_delta: number }
          | { p_count_id: string; p_delta: number; p_item_id: string }
        Returns: {
          count_item_id: string
          new_actual: number
        }[]
      }
      calculate_execution_score: {
        Args: { execution_id_param: string }
        Returns: number
      }
      calculate_meeting_effectiveness: {
        Args: { meeting_id: string }
        Returns: number
      }
      calculate_quiz_attempt_final_score: {
        Args: { attempt_id: string }
        Returns: Json
      }
      can_access_request_by_team: {
        Args: { request_user_id: string }
        Returns: boolean
      }
      can_change_user_role: {
        Args: { new_role: string; requester_id: string; target_user_id: string }
        Returns: Json
      }
      can_manage_user_role: {
        Args:
          | { manager_role: string; target_role: string }
          | { new_role: string; requester_role: string; target_role: string }
        Returns: boolean
      }
      can_user_access_project: {
        Args: { project_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_user_access_room: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_user_access_task: {
        Args: { task_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_user_access_team_data: {
        Args: { team_id_param: string; user_id_param: string }
        Returns: boolean
      }
      can_user_issue_action_to_recipient: {
        Args: {
          issuer_id: string
          organization_id: string
          recipient_id: string
        }
        Returns: boolean
      }
      check_and_create_retraining_assignments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_fcm_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_orphaned_training_assignments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      create_user_admin: {
        Args: {
          email: string
          password: string
          user_name: string
          user_role: string
        }
        Returns: Json
      }
      debug_auth_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      end_of_day_auto_close: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_missing_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          auth_created_at: string
          auth_email: string
          auth_user_id: string
          missing_from_public: boolean
        }[]
      }
      generate_daily_checklist_executions: {
        Args: { target_date: string }
        Returns: undefined
      }
      generate_invite_code: {
        Args: {
          created_by_id: string
          expires_days?: number
          max_uses_param?: number
          org_id: string
        }
        Returns: string
      }
      generate_invite_code_with_role: {
        Args: {
          created_by_id: string
          expires_days?: number
          invited_role?: string
          invited_team_id?: string
          max_uses_param?: number
          org_id: string
        }
        Returns: string
      }
      generate_invoice_file_path: {
        Args: { filename: string; org_id: string; user_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { org_id: string }
        Returns: string
      }
      generate_recurring_task_occurrence: {
        Args: { organization_id_param: string; parent_task_id: string }
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_archive_threshold_days: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_current_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_daily_movements: {
        Args: { p_date?: string; p_team_id?: string }
        Returns: {
          po_numbers: string[]
          total_quantity: number
          total_value: number
          transaction_count: number
          transaction_type: string
        }[]
      }
      get_daily_task_summary: {
        Args: { target_date?: string; target_user_id: string }
        Returns: Json
      }
      get_employee_detailed_tasks: {
        Args: { end_date: string; start_date: string; target_user_id: string }
        Returns: {
          created_at: string
          days_until_due: number
          deadline: string
          description: string
          is_overdue: boolean
          priority: string
          project_id: string
          project_title: string
          status: string
          task_id: string
          time_spent_minutes: number
          title: string
          updated_at: string
        }[]
      }
      get_employee_hours_stats: {
        Args: { end_date: string; start_date: string; target_user_id: string }
        Returns: {
          day: string
          minutes: number
        }[]
      }
      get_employee_project_contributions: {
        Args: { end_date: string; start_date: string; target_user_id: string }
        Returns: {
          completed_tasks: number
          completion_rate: number
          project_id: string
          project_title: string
          task_count: number
        }[]
      }
      get_employee_task_stats: {
        Args: { end_date: string; start_date: string; target_user_id: string }
        Returns: {
          completed_tasks: number
          completion_rate: number
          total_tasks: number
        }[]
      }
      get_instance_display_code: {
        Args: { instance_id: string }
        Returns: string
      }
      get_organization_stats: {
        Args: { org_id: string }
        Returns: Json
      }
      get_orphaned_assignments_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_pending_time_approvals: {
        Args: { manager_user_id: string; team_filter_id?: string }
        Returns: {
          clock_in: string
          clock_out: string
          created_at: string
          duration_minutes: number
          id: string
          notes: string
          team_id: string
          team_name: string
          user_email: string
          user_id: string
          user_name: string
          work_date: string
        }[]
      }
      get_project_comment_stats: {
        Args: { project_id_param: string }
        Returns: Json
      }
      get_quiz_attempts_with_final_scores: {
        Args:
          | { organization_id_param: string; quiz_id_param: string }
          | { quiz_id_param: string }
        Returns: {
          answers: Json
          attempt_number: number
          completed_at: string
          email: string
          final_passed: boolean
          final_score: number
          has_overrides: boolean
          id: string
          max_score: number
          name: string
          organization_id: string
          original_passed: boolean
          original_score: number
          override_count: number
          quiz_id: string
          role: string
          started_at: string
          total_adjustment: number
          user_id: string
        }[]
      }
      get_real_time_inventory_value: {
        Args: { p_team_id?: string }
        Returns: {
          low_stock_count: number
          overstock_count: number
          team_id: string
          team_name: string
          total_items: number
          total_value: number
        }[]
      }
      get_request_notification_recipients: {
        Args: { request_id_param: string }
        Returns: {
          email: string
          name: string
          notification_type: string
          user_id: string
        }[]
      }
      get_role_hierarchy: {
        Args: Record<PropertyKey, never>
        Returns: {
          hierarchy_level: number
          role_name: string
        }[]
      }
      get_team_stats: {
        Args: { org_id: string }
        Returns: Json
      }
      get_template_code: {
        Args: { template_id: string }
        Returns: string
      }
      get_user_accessible_projects: {
        Args: Record<PropertyKey, never>
        Returns: {
          budget: number | null
          budget_spent: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_completed: boolean | null
          manager_id: string | null
          organization_id: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          tasks_count: number | null
          team_members: string[] | null
          title: string | null
          updated_at: string | null
        }[]
      }
      get_user_deletion_impact: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_managed_team_ids: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      get_user_management_impact: {
        Args: { target_user_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_team_manager: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_teams: {
        Args: { user_id_param: string }
        Returns: {
          role: string
          team_id: string
          team_name: string
        }[]
      }
      is_admin_or_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_meeting_organizer: {
        Args: { meeting_id: string; user_id: string }
        Returns: boolean
      }
      is_meeting_participant: {
        Args: { meeting_id: string; user_id: string }
        Returns: boolean
      }
      is_room_participant: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      is_sole_admin_anywhere: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_user_room_admin: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_user_team_member: {
        Args: { team_id_param: string; user_id_param: string }
        Returns: boolean
      }
      log_data_access: {
        Args:
          | { action_type: string; record_count: number; table_name: string }
          | { operation: string; table_name: string; user_id: string }
        Returns: undefined
      }
      manage_time_entry_approval: {
        Args: {
          approval_notes_text?: string
          entry_id: string
          manager_id: string
          new_status: Database["public"]["Enums"]["approval_status"]
          rejection_reason?: string
        }
        Returns: Json
      }
      manual_sync_meeting_to_google: {
        Args:
          | { action_param?: string; meeting_id_param: string }
          | { force_sync?: boolean; meeting_id: string }
        Returns: Json
      }
      migrate_legacy_folders_to_database: {
        Args: { target_organization_id: string }
        Returns: Json
      }
      pause_time_entry: {
        Args: { p_task_id?: string; p_user_id: string }
        Returns: Json
      }
      post_warehouse_receipt: {
        Args: { p_receipt_id: string; p_user: string }
        Returns: undefined
      }
      process_calendar_sync_queue: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      purge_sales_data: {
        Args: { p_date_from?: string; p_date_to?: string; p_location?: string }
        Returns: Json
      }
      recalculate_attempt_score: {
        Args: { p_quiz_attempt_id: string }
        Returns: undefined
      }
      receive_warehouse_transfer: {
        Args: { p_transfer_id: string; p_user: string }
        Returns: undefined
      }
      register_fcm_token: {
        Args: { p_device_info?: Json; p_platform: string; p_token: string }
        Returns: string
      }
      resume_time_entry: {
        Args: { p_task_id?: string; p_user_id: string }
        Returns: Json
      }
      retry_failed_sync_operations: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      rpc_task_report_user_day_lists: {
        Args: {
          p_day: string
          p_org: string
          p_team?: string[]
          p_tz?: string
          p_user: string
        }
        Returns: {
          assigned_at: string
          bucket: string
          completed_at: string
          created_at: string
          due_at: string
          priority: string
          status: string
          task_id: string
          team_id: string
          title: string
        }[]
      }
      rpc_task_report_user_week_lists: {
        Args: {
          p_org: string
          p_team?: string[]
          p_tz?: string
          p_user: string
          p_week_start: string
        }
        Returns: {
          assigned_at: string
          bucket: string
          completed_at: string
          created_at: string
          day_date: string
          due_at: string
          priority: string
          status: string
          task_id: string
          team_id: string
          title: string
        }[]
      }
      send_daily_emails_and_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_notification_to_multiple: {
        Args: {
          metadata_json?: Json
          notification_content: string
          notification_title: string
          notification_type: string
          org_id: string
          recipient_ids: string[]
          related_event_id?: string
          related_task_id?: string
        }
        Returns: number
      }
      send_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_timezone_aware_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_warehouse_transfer: {
        Args: { p_transfer_id: string; p_user: string }
        Returns: undefined
      }
      sync_user_profile_across_tables: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      transfer_superadmin_role: {
        Args: {
          current_superadmin_id: string
          new_superadmin_id: string
          organization_id: string
        }
        Returns: Json
      }
      update_assignment_completion_score: {
        Args: { attempt_id: string }
        Returns: undefined
      }
      update_daily_summary: {
        Args: { target_date: string; target_user_id: string }
        Returns: undefined
      }
      update_time_entry_clock_out: {
        Args: { p_task_id: string; p_user_id: string }
        Returns: undefined
      }
      user_is_admin_or_superadmin: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_is_project_creator: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      user_is_project_member: {
        Args: { project_id: string; user_id: string }
        Returns: boolean
      }
      user_is_project_team_member: {
        Args: { project_id_val: string; user_id_val: string }
        Returns: boolean
      }
      validate_and_use_invite_code: {
        Args: { code: string }
        Returns: Json
      }
      validate_assigned_to_ids: {
        Args: { ids: string[] }
        Returns: boolean
      }
      validate_invite_code_without_consuming: {
        Args: { code: string }
        Returns: Json
      }
      would_leave_org_without_superadmin: {
        Args: { target_org_id: string; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      assignment_type: "individual" | "team" | "role_based"
      assignment_type_v2: "individual" | "team" | "role"
      checklist_priority: "low" | "medium" | "high" | "critical"
      checklist_status: "draft" | "active" | "inactive" | "archived"
      checklist_status_v2:
        | "pending"
        | "submitted"
        | "verified"
        | "rejected"
        | "expired"
      execution_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "overdue"
        | "verified"
      message_type: "text" | "system"
      onboarding_feedback_status: "pending" | "completed"
      onboarding_instance_status:
        | "active"
        | "completed"
        | "on_hold"
        | "cancelled"
      onboarding_owner_type: "hr" | "manager" | "employee"
      onboarding_task_category:
        | "hr_documentation"
        | "compliance_training"
        | "job_specific_training"
        | "culture_engagement"
      onboarding_task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
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
      approval_status: ["pending", "approved", "rejected"],
      assignment_type: ["individual", "team", "role_based"],
      assignment_type_v2: ["individual", "team", "role"],
      checklist_priority: ["low", "medium", "high", "critical"],
      checklist_status: ["draft", "active", "inactive", "archived"],
      checklist_status_v2: [
        "pending",
        "submitted",
        "verified",
        "rejected",
        "expired",
      ],
      execution_status: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "verified",
      ],
      message_type: ["text", "system"],
      onboarding_feedback_status: ["pending", "completed"],
      onboarding_instance_status: [
        "active",
        "completed",
        "on_hold",
        "cancelled",
      ],
      onboarding_owner_type: ["hr", "manager", "employee"],
      onboarding_task_category: [
        "hr_documentation",
        "compliance_training",
        "job_specific_training",
        "culture_engagement",
      ],
      onboarding_task_status: [
        "pending",
        "in_progress",
        "completed",
        "blocked",
      ],
    },
  },
} as const
