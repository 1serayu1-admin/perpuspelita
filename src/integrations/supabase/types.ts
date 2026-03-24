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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string
          id: string
          school_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string
          id?: string
          school_id?: string | null
          user_name: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string
          id?: string
          school_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      authorized_devices: {
        Row: {
          created_at: string
          device_name: string
          fingerprint: string
          id: string
          is_approved: boolean
          last_used_at: string | null
          owner_user_id: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_name?: string
          fingerprint: string
          id?: string
          is_approved?: boolean
          last_used_at?: string | null
          owner_user_id: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_name?: string
          fingerprint?: string
          id?: string
          is_approved?: boolean
          last_used_at?: string | null
          owner_user_id?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorized_devices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_history: {
        Row: {
          backup_size: string | null
          backup_status: string
          backup_type: string
          backup_url: string | null
          created_at: string
          created_by: string | null
          id: string
          school_id: string | null
        }
        Insert: {
          backup_size?: string | null
          backup_status?: string
          backup_type?: string
          backup_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          school_id?: string | null
        }
        Update: {
          backup_size?: string | null
          backup_status?: string
          backup_type?: string
          backup_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          available: number
          category_id: string | null
          cover_url: string | null
          created_at: string
          id: string
          isbn: string
          publisher: string
          school_id: string | null
          shelf_location: string
          stock: number
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          author?: string
          available?: number
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string
          publisher?: string
          school_id?: string | null
          shelf_location?: string
          stock?: number
          title: string
          updated_at?: string
          year?: number
        }
        Update: {
          author?: string
          available?: number
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          isbn?: string
          publisher?: string
          school_id?: string | null
          shelf_location?: string
          stock?: number
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      borrow_requests: {
        Row: {
          book_id: string | null
          book_title: string
          class_name: string | null
          created_at: string
          duration: number | null
          id: string
          reason: string
          rejection_reason: string | null
          request_date: string
          requester_id: string
          requester_name: string
          requester_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          book_title: string
          class_name?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          reason?: string
          rejection_reason?: string | null
          request_date?: string
          requester_id: string
          requester_name: string
          requester_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          book_title?: string
          class_name?: string | null
          created_at?: string
          duration?: number | null
          id?: string
          reason?: string
          rejection_reason?: string | null
          request_date?: string
          requester_id?: string
          requester_name?: string
          requester_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrow_requests_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrow_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowings: {
        Row: {
          book_id: string | null
          book_title: string
          borrow_date: string
          borrower_id: string
          borrower_name: string
          class_name: string | null
          created_at: string
          due_date: string
          duration: number | null
          id: string
          return_date: string | null
          school_id: string | null
          status: string
          subject: string | null
          teacher_name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          book_title: string
          borrow_date?: string
          borrower_id: string
          borrower_name: string
          class_name?: string | null
          created_at?: string
          due_date: string
          duration?: number | null
          id?: string
          return_date?: string | null
          school_id?: string | null
          status?: string
          subject?: string | null
          teacher_name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          book_title?: string
          borrow_date?: string
          borrower_id?: string
          borrower_name?: string
          class_name?: string | null
          created_at?: string
          due_date?: string
          duration?: number | null
          id?: string
          return_date?: string | null
          school_id?: string | null
          status?: string
          subject?: string | null
          teacher_name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrowings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          homeroom_teacher: string
          id: string
          major: string
          name: string
          school_id: string | null
          student_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          homeroom_teacher?: string
          id?: string
          major?: string
          name: string
          school_id?: string | null
          student_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          homeroom_teacher?: string
          id?: string
          major?: string
          name?: string
          school_id?: string | null
          student_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          school_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          allowed_ips: string[]
          created_at: string
          email: string | null
          id: string
          ip_access_mode: string
          is_active: boolean
          logo_url: string | null
          motto: string | null
          name: string
          phone: string | null
          primary_color: string | null
          updated_at: string
          vision: string | null
        }
        Insert: {
          address?: string | null
          allowed_ips?: string[]
          created_at?: string
          email?: string | null
          id?: string
          ip_access_mode?: string
          is_active?: boolean
          logo_url?: string | null
          motto?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          vision?: string | null
        }
        Update: {
          address?: string | null
          allowed_ips?: string[]
          created_at?: string
          email?: string | null
          id?: string
          ip_access_mode?: string
          is_active?: boolean
          logo_url?: string | null
          motto?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          updated_at?: string
          vision?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          device_fingerprint: string | null
          id: string
          ip_address: string
          school_id: string | null
          status: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string
          school_id?: string | null
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string
          school_id?: string | null
          status?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          major: string
          membership_end: string | null
          membership_start: string | null
          name: string
          nis: string
          school_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          major?: string
          membership_end?: string | null
          membership_start?: string | null
          name: string
          nis?: string
          school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          major?: string
          membership_end?: string | null
          membership_start?: string | null
          name?: string
          nis?: string
          school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          membership_end: string | null
          membership_start: string | null
          name: string
          nip: string
          school_id: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          membership_end?: string | null
          membership_start?: string | null
          name: string
          nip?: string
          school_id?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          membership_end?: string | null
          membership_start?: string | null
          name?: string
          nip?: string
          school_id?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_book_available: { Args: { _book_id: string }; Returns: boolean }
      get_email_by_username: { Args: { _username: string }; Returns: string }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_book_available: { Args: { _book_id: string }; Returns: boolean }
      insert_security_log: {
        Args: {
          _action: string
          _detail: string
          _device_fingerprint: string
          _ip_address: string
          _school_id?: string
          _status: string
          _user_email: string
        }
        Returns: undefined
      }
      is_same_school: {
        Args: { _school_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "global_super_admin"
        | "school_super_admin"
        | "admin"
        | "guru"
        | "siswa"
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
      app_role: [
        "global_super_admin",
        "school_super_admin",
        "admin",
        "guru",
        "siswa",
      ],
    },
  },
} as const
