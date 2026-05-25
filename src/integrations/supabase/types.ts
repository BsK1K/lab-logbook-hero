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
          tipo_usuario?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
