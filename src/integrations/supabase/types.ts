export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: string;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      enskripsyon: {
        Row: {
          cert_lang: string;
          certificate_unlocked: boolean;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          verification_id: string;
          whatsapp: string;
        };
        Insert: {
          cert_lang?: string;
          certificate_unlocked?: boolean;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          verification_id: string;
          whatsapp: string;
        };
        Update: {
          cert_lang?: string;
          certificate_unlocked?: boolean;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          verification_id?: string;
          whatsapp?: string;
        };
        Relationships: [];
      };
      admin_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompts: {
        Row: {
          created_at: string;
          id: string;
          prompt: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          prompt: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          prompt?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      modules: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_paid: boolean;
          module_date: string;
          payment_methods: Json;
          price: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          is_paid?: boolean;
          module_date: string;
          payment_methods?: Json;
          price?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_paid?: boolean;
          module_date?: string;
          payment_methods?: Json;
          price?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_codes: {
        Row: {
          id: string;
          module_id: string;
          code: string;
          created_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          module_id: string;
          code: string;
          created_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          module_id?: string;
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_codes_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_records: {
        Row: {
          id: string;
          module_id: string;
          attendance_code_id: string;
          first_name: string;
          last_name: string;
          email: string;
          verification_id: string;
          marked_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          attendance_code_id: string;
          first_name: string;
          last_name: string;
          email: string;
          verification_id: string;
          marked_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          attendance_code_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          verification_id?: string;
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_attendance_code_id_fkey";
            columns: ["attendance_code_id"];
            isOneToOne: false;
            referencedRelation: "attendance_codes";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      enskri_patisipan: {
        Args: {
          p_cert_lang: string;
          p_email: string;
          p_full_name: string;
          p_whatsapp: string;
        };
        Returns: Json;
      };
      jwenn_sertifika: { Args: { p_email: string }; Returns: Json };
      plas_ki_rete: { Args: never; Returns: number };
      module_is_completed: { Args: { p_module: unknown }; Returns: boolean };
      verifye_sertifika: { Args: { p_verification_id: string }; Returns: Json };
      is_admin: { Args: { user_id: string }; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
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
    Enums: {},
  },
} as const;
