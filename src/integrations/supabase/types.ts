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
          id: string
          location: string | null
          organization_id: string
          organizer_id: string
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          location?: string | null
          organization_id: string
          organizer_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          location?: string | null
          organization_id?: string
          organizer_id?: string
          start_time?: string
          status?: string
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
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
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
          module_id: string
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
          module_id: string
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
          module_id?: string
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
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_types: {
        Row: {
          approval_roles: string[] | null
          category: string
          created_at: string
          created_by: string
          description: string | null
          form_schema: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          approval_roles?: string[] | null
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          approval_roles?: string[] | null
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          form_schema?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          form_data: Json | null
          id: string
          organization_id: string
          priority: string | null
          request_type_id: string
          requested_by: string
          status: string | null
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          form_data?: Json | null
          id?: string
          organization_id: string
          priority?: string | null
          request_type_id: string
          requested_by: string
          status?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          form_data?: Json | null
          id?: string
          organization_id?: string
          priority?: string | null
          request_type_id?: string
          requested_by?: string
          status?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
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
      tasks: {
        Row: {
          archived_at: string | null
          assigned_to_id: string | null
          assigned_to_ids: string[] | null
          assigned_to_names: string[] | null
          completed_at: string | null
          cost: number | null
          created_at: string | null
          deadline: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          is_recurring: boolean | null
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
          status: string | null
          team_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          warning_period_hours: number | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to_id?: string | null
          assigned_to_ids?: string[] | null
          assigned_to_names?: string[] | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
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
          status?: string | null
          team_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          warning_period_hours?: number | null
        }
        Update: {
          archived_at?: string | null
          assigned_to_id?: string | null
          assigned_to_ids?: string[] | null
          assigned_to_names?: string[] | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          is_recurring?: boolean | null
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
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_paused: boolean | null
          notes: string | null
          organization_id: string
          paused_at: string | null
          task_id: string | null
          team_id: string | null
          total_paused_duration: unknown | null
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          organization_id: string
          paused_at?: string | null
          task_id?: string | null
          team_id?: string | null
          total_paused_duration?: unknown | null
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          organization_id?: string
          paused_at?: string | null
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
          id: string
          module_order: number
          text_content: string | null
          title: string
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          content_type: string
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          module_order: number
          text_content?: string | null
          title: string
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          content_type?: string
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          module_order?: number
          text_content?: string | null
          title?: string
          updated_at?: string
          youtube_video_id?: string | null
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
          hire_date: string | null
          id: string
          job_title: string | null
          manager_id: string | null
          name: string
          organization_id: string
          phone: string | null
          preferred_name: string | null
          push_token: string | null
          role: string
          timezone: string | null
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
          hire_date?: string | null
          id: string
          job_title?: string | null
          manager_id?: string | null
          name: string
          organization_id: string
          phone?: string | null
          preferred_name?: string | null
          push_token?: string | null
          role: string
          timezone?: string | null
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
          hire_date?: string | null
          id?: string
          job_title?: string | null
          manager_id?: string | null
          name?: string
          organization_id?: string
          phone?: string | null
          preferred_name?: string | null
          push_token?: string | null
          role?: string
          timezone?: string | null
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
    }
    Views: {
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
    }
    Functions: {
      admin_role_update: {
        Args: { new_role: string; target_user_id: string }
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
      calculate_meeting_effectiveness: {
        Args: { meeting_id: string }
        Returns: number
      }
      calculate_quiz_attempt_final_score: {
        Args: { attempt_id: string }
        Returns: Json
      }
      can_change_user_role: {
        Args: { new_role: string; requester_id: string; target_user_id: string }
        Returns: Json
      }
      can_manage_user_role: {
        Args: { manager_role: string; target_role: string }
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
      create_get_all_projects_function: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_get_all_tasks_function: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      generate_recurring_task_occurrence: {
        Args: { organization_id_param: string; parent_task_id: string }
        Returns: string
      }
      get_all_projects: {
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
      get_organization_stats: {
        Args: { org_id: string }
        Returns: Json
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
          adjusted_passed: boolean
          adjusted_score: number
          answers: Json
          attempt_number: number
          completed_at: string
          email: string
          has_overrides: boolean
          id: string
          max_score: number
          name: string
          organization_id: string
          override_count: number
          passed: boolean
          quiz_id: string
          role: string
          score: number
          started_at: string
          total_adjustment: number
          user_id: string
        }[]
      }
      get_team_stats: {
        Args: { org_id: string }
        Returns: Json
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
      migrate_legacy_folders_to_database: {
        Args: { target_organization_id: string }
        Returns: Json
      }
      pause_time_entry: {
        Args: { p_task_id?: string; p_user_id: string }
        Returns: Json
      }
      purge_sales_data: {
        Args: { p_date_from?: string; p_date_to?: string; p_location?: string }
        Returns: Json
      }
      recalculate_attempt_score: {
        Args: { p_quiz_attempt_id: string }
        Returns: undefined
      }
      resume_time_entry: {
        Args: { p_task_id?: string; p_user_id: string }
        Returns: Json
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
