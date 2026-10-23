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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      chamados: {
        Row: {
          created_at: string
          detalhes: string | null
          estado: string
          id: string
          imagens: string[]
          marca: string
          numero_serie: string
          possui_garantia: boolean
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          detalhes?: string | null
          estado: string
          id?: string
          imagens?: string[]
          marca: string
          numero_serie: string
          possui_garantia?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          detalhes?: string | null
          estado?: string
          id?: string
          imagens?: string[]
          marca?: string
          numero_serie?: string
          possui_garantia?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      netbook_loans: {
        Row: {
          categoria: string
          created_at: string
          devolvido_at: string | null
          id: string
          nome: string
          qtd_multilaser: number
          qtd_positivo: number
          retirada_at: string
          sala: string
          school_reservation_id: string | null
          tipo_usuario: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          devolvido_at?: string | null
          id?: string
          nome: string
          qtd_multilaser?: number
          qtd_positivo?: number
          retirada_at?: string
          sala: string
          school_reservation_id?: string | null
          tipo_usuario: string
        }
        Update: {
          categoria?: string
          created_at?: string
          devolvido_at?: string | null
          id?: string
          nome?: string
          qtd_multilaser?: number
          qtd_positivo?: number
          retirada_at?: string
          sala?: string
          school_reservation_id?: string | null
          tipo_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "netbook_loans_school_reservation_id_fkey"
            columns: ["school_reservation_id"]
            isOneToOne: false
            referencedRelation: "school_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_allocations: {
        Row: {
          equipment_id: string
          reservation_id: string
        }
        Insert: {
          equipment_id: string
          reservation_id: string
        }
        Update: {
          equipment_id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_allocations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "school_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_allocations_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "school_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      school_equipment: {
        Row: {
          asset_code: string | null
          battery: number | null
          battery_observed_at: string | null
          condition: string
          current_location_id: string | null
          destination: string | null
          enabled: boolean
          home_id: string
          id: string
          internal_index: number
          kind: string
          state: string
        }
        Insert: {
          asset_code?: string | null
          battery?: number | null
          battery_observed_at?: string | null
          condition?: string
          current_location_id?: string | null
          destination?: string | null
          enabled?: boolean
          home_id: string
          id?: string
          internal_index: number
          kind: string
          state?: string
        }
        Update: {
          asset_code?: string | null
          battery?: number | null
          battery_observed_at?: string | null
          condition?: string
          current_location_id?: string | null
          destination?: string | null
          enabled?: boolean
          home_id?: string
          id?: string
          internal_index?: number
          kind?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_equipment_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "school_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_equipment_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "school_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      school_movements: {
        Row: {
          action: string
          actor_id: string
          battery: number | null
          created_at: string
          destination: string | null
          destination_id: string | null
          equipment_id: string
          id: string
          loan_id: string | null
          notes: string
          reservation_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          battery?: number | null
          created_at?: string
          destination?: string | null
          destination_id?: string | null
          equipment_id: string
          id?: string
          loan_id?: string | null
          notes?: string
          reservation_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          battery?: number | null
          created_at?: string
          destination?: string | null
          destination_id?: string | null
          equipment_id?: string
          id?: string
          loan_id?: string | null
          notes?: string
          reservation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_movements_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "school_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_movements_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "school_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_movements_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "netbook_loans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_movements_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "school_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      school_reservations: {
        Row: {
          created_at: string
          destination: string
          ends_at: string
          id: string
          notes: string
          purpose: string
          quantity: number
          resource_id: string
          starts_at: string
          status: string
          students: number | null
          teacher: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination?: string
          ends_at: string
          id?: string
          notes?: string
          purpose?: string
          quantity?: number
          resource_id: string
          starts_at: string
          status?: string
          students?: number | null
          teacher: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          ends_at?: string
          id?: string
          notes?: string
          purpose?: string
          quantity?: number
          resource_id?: string
          starts_at?: string
          status?: string
          students?: number | null
          teacher?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_reservations_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "school_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      school_resources: {
        Row: {
          accepted_battery: number[]
          battery_valid_hours: number
          capacity: number
          code: string
          enabled: boolean
          id: string
          kind: string
          location: string
          name: string
          requires_approval: boolean
        }
        Insert: {
          accepted_battery?: number[]
          battery_valid_hours?: number
          capacity?: number
          code: string
          enabled?: boolean
          id?: string
          kind: string
          location: string
          name: string
          requires_approval?: boolean
        }
        Update: {
          accepted_battery?: number[]
          battery_valid_hours?: number
          capacity?: number
          code?: string
          enabled?: boolean
          id?: string
          kind?: string
          location?: string
          name?: string
          requires_approval?: boolean
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author: string
          content: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          chamado_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee?: string | null
          chamado_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string | null
          chamado_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      school_action: {
        Args: { p_action: string; p_data: Json }
        Returns: string
      }
      school_audit: {
        Args: { p_action: string; p_id: string; p_meta: Json; p_text: string }
        Returns: undefined
      }
      school_available: {
        Args: { p_end: string; p_resource: string; p_start: string }
        Returns: string[]
      }
      school_lock: { Args: never; Returns: undefined }
      school_snapshot: {
        Args: { p_end: string; p_start: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
