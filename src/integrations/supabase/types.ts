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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      booking_feedback: {
        Row: {
          booking_id: string
          client_id: string
          comment: string | null
          created_at: string
          declined: boolean
          id: string
          rating: number
        }
        Insert: {
          booking_id: string
          client_id: string
          comment?: string | null
          created_at?: string
          declined?: boolean
          id?: string
          rating: number
        }
        Update: {
          booking_id?: string
          client_id?: string
          comment?: string | null
          created_at?: string
          declined?: boolean
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          admin_notes: string | null
          booking_details: Json
          checklist_id: string | null
          client_id: string
          client_viewed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          invoice_id: string | null
          scheduled_date: string | null
          service_type: string
          skip_invoice: boolean | null
          started_at: string | null
          status: string
          team_member_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          admin_notes?: string | null
          booking_details: Json
          checklist_id?: string | null
          client_id: string
          client_viewed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          scheduled_date?: string | null
          service_type: string
          skip_invoice?: boolean | null
          started_at?: string | null
          status?: string
          team_member_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          admin_notes?: string | null
          booking_details?: Json
          checklist_id?: string | null
          client_id?: string
          client_viewed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          scheduled_date?: string | null
          service_type?: string
          skip_invoice?: boolean | null
          started_at?: string | null
          status?: string
          team_member_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "client_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_rooms: {
        Row: {
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          is_completed: boolean
          room_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          room_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          room_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_rooms_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "client_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_tasks: {
        Row: {
          added_by: string
          added_by_role: string
          created_at: string
          id: string
          notes: string | null
          room_id: string
          sort_order: number
          task_text: string
          updated_at: string
        }
        Insert: {
          added_by: string
          added_by_role: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id: string
          sort_order?: number
          task_text: string
          updated_at?: string
        }
        Update: {
          added_by?: string
          added_by_role?: string
          created_at?: string
          id?: string
          notes?: string | null
          room_id?: string
          sort_order?: number
          task_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "checklist_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_checklists: {
        Row: {
          city: string | null
          client_id: string | null
          created_at: string
          id: string
          last_updated: string
          postal_code: string | null
          special_requirements: string | null
          street: string
        }
        Insert: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          postal_code?: string | null
          special_requirements?: string | null
          street: string
        }
        Update: {
          city?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          last_updated?: string
          postal_code?: string | null
          special_requirements?: string | null
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_checklists_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_feedback: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          job_id: string
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_job_id: string | null
          title: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_job_id?: string | null
          title: string
          type: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_job_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notifications_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          allergies_notes: string | null
          city: string | null
          client_source: string | null
          client_type: string | null
          company_id: string | null
          company_legal_name: string | null
          contact_preference: string | null
          dic: string | null
          created_at: string
          date_added: string | null
          date_of_birth: string | null
          email: string | null
          has_allergies: boolean | null
          has_children: boolean | null
          has_pets: boolean | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          reliable_person: string | null
          special_instructions: string | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          allergies_notes?: string | null
          city?: string | null
          client_source?: string | null
          client_type?: string | null
          company_id?: string | null
          company_legal_name?: string | null
          contact_preference?: string | null
          dic?: string | null
          created_at?: string
          date_added?: string | null
          date_of_birth?: string | null
          email?: string | null
          has_allergies?: boolean | null
          has_children?: boolean | null
          has_pets?: boolean | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          reliable_person?: string | null
          special_instructions?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          allergies_notes?: string | null
          city?: string | null
          client_source?: string | null
          client_type?: string | null
          company_id?: string | null
          company_legal_name?: string | null
          contact_preference?: string | null
          dic?: string | null

          created_at?: string
          date_added?: string | null
          date_of_birth?: string | null
          email?: string | null
          has_allergies?: boolean | null
          has_children?: boolean | null
          has_pets?: boolean | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          reliable_person?: string | null
          special_instructions?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_info: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_code: string | null
          bank_name: string | null
          city: string | null
          company_name: string
          country: string | null
          created_at: string
          dic: string | null
          email: string | null
          iban: string | null
          ic: string | null
          id: string
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          swift: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_code?: string | null
          bank_name?: string | null
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string
          dic?: string | null
          email?: string | null
          iban?: string | null
          ic?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          swift?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_code?: string | null
          bank_name?: string | null
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string
          dic?: string | null
          email?: string | null
          iban?: string | null
          ic?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          swift?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      educational_content: {
        Row: {
          category: string
          content_type: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          content_type: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      extra_services: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number | null
          total: number
          unit_price: number
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number | null
          total: number
          unit_price: number
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number | null
          total?: number
          unit_price?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string | null
          client_address: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_phone: string | null
          client_vat: string | null
          created_at: string
          currency: string | null
          date_created: string
          date_due: string | null
          date_performance: string | null
          id: string
          invoice_number: string
          notes: string | null
          payment_method: string | null
          pdf_path: string | null
          status: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string
          variable_symbol: string | null
          vat_amount: number
        }
        Insert: {
          booking_id?: string | null
          client_address?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          client_vat?: string | null
          created_at?: string
          currency?: string | null
          date_created?: string
          date_due?: string | null
          date_performance?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          payment_method?: string | null
          pdf_path?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
          variable_symbol?: string | null
          vat_amount?: number
        }
        Update: {
          booking_id?: string | null
          client_address?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          client_vat?: string | null
          created_at?: string
          currency?: string | null
          date_created?: string
          date_due?: string | null
          date_performance?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_method?: string | null
          pdf_path?: string | null
          status?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
          variable_symbol?: string | null
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_earnings: {
        Row: {
          amount: number
          created_at: string
          id: string
          job_id: string
          team_member_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          job_id: string
          team_member_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          job_id?: string
          team_member_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_earnings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_earnings_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      job_expenses: {
        Row: {
          cleaner_expense: number | null
          created_at: string
          id: string
          job_id: string
          team_member_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cleaner_expense?: number | null
          created_at?: string
          id?: string
          job_id: string
          team_member_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cleaner_expense?: number | null
          created_at?: string
          id?: string
          job_id?: string
          team_member_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_extra_services: {
        Row: {
          created_at: string | null
          extra_service_id: string
          id: string
          job_id: string
        }
        Insert: {
          created_at?: string | null
          extra_service_id: string
          id?: string
          job_id: string
        }
        Update: {
          created_at?: string | null
          extra_service_id?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_extra_services_extra_service_id_fkey"
            columns: ["extra_service_id"]
            isOneToOne: false
            referencedRelation: "extra_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_extra_services_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: Database["public"]["Enums"]["job_category"]
          client_id: string
          completed_date: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          expenses: number | null
          id: string
          job_number: string
          notes: string | null
          payment_received_date: string | null
          payment_type: string | null
          revenue: number
          scheduled_date: string
          scheduled_dates: string[] | null
          status: string | null
          supplies_expense_total: number | null
          supplies_needed: string[] | null
          team_member_id: string | null
          team_member_ids: string[] | null
          title: string
          transport_expense_total: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["job_category"]
          client_id: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          expenses?: number | null
          id?: string
          job_number: string
          notes?: string | null
          payment_received_date?: string | null
          payment_type?: string | null
          revenue?: number
          scheduled_date: string
          scheduled_dates?: string[] | null
          status?: string | null
          supplies_expense_total?: number | null
          supplies_needed?: string[] | null
          team_member_id?: string | null
          team_member_ids?: string[] | null
          title: string
          transport_expense_total?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["job_category"]
          client_id?: string
          completed_date?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          expenses?: number | null
          id?: string
          job_number?: string
          notes?: string | null
          payment_received_date?: string | null
          payment_type?: string | null
          revenue?: number
          scheduled_date?: string
          scheduled_dates?: string[] | null
          status?: string | null
          supplies_expense_total?: number | null
          supplies_needed?: string[] | null
          team_member_id?: string | null
          team_member_ids?: string[] | null
          title?: string
          transport_expense_total?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_credits: {
        Row: {
          client_id: string
          created_at: string | null
          current_credits: number | null
          id: string
          total_earned: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          current_credits?: number | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          current_credits?: number | null
          id?: string
          total_earned?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          related_job_id: string | null
          type: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_job_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          related_job_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      protocols: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["job_category"]
          client_id: string
          created_at: string
          description: string | null
          id: string
          notes: string | null
          quote_number: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["job_category"]
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          quote_number: string
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["job_category"]
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          quote_number?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          position: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          position?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          position?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string | null
          description: string | null
          id: string
          job_id: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
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
      generate_invoice_number: { Args: never; Returns: string }
      generate_job_number: { Args: never; Returns: string }
      generate_quote_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cleaner_assigned_to_booking: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      is_cleaner_assigned_to_client: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_user_approved: { Args: { user_uuid: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "invoice_user" | "client" | "cleaner"
      job_category:
      | "home_cleaning"
      | "commercial_cleaning"
      | "window_cleaning"
      | "post_construction_cleaning"
      | "upholstery_cleaning"
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
      app_role: ["admin", "user", "invoice_user", "client", "cleaner"],
      job_category: [
        "home_cleaning",
        "commercial_cleaning",
        "window_cleaning",
        "post_construction_cleaning",
        "upholstery_cleaning",
      ],
    },
  },
} as const
