// =============================================================================
// GENERATED FILE — DO NOT EDIT BY HAND.
// Produced by: supabase gen types typescript --local > src/lib/supabase/database.types.ts
// Regenerate after every migration. Source of truth is supabase/migrations/.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      game: {
        Row: {
          id: string;
          ordinal: number;
          season_id: string;
          slug: string;
          status: Database['public']['Enums']['game_status'];
        };
        Insert: {
          id?: string;
          ordinal: number;
          season_id: string;
          slug: string;
          status?: Database['public']['Enums']['game_status'];
        };
        Update: {
          id?: string;
          ordinal?: number;
          season_id?: string;
          slug?: string;
          status?: Database['public']['Enums']['game_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'game_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'season';
            referencedColumns: ['id'];
          },
        ];
      };
      game_result: {
        Row: {
          confirmed: boolean;
          created_at: string;
          game_id: string;
          note: string | null;
          placement: number;
          season_player_id: string;
          updated_at: string;
        };
        Insert: {
          confirmed?: boolean;
          created_at?: string;
          game_id: string;
          note?: string | null;
          placement: number;
          season_player_id: string;
          updated_at?: string;
        };
        Update: {
          confirmed?: boolean;
          created_at?: string;
          game_id?: string;
          note?: string | null;
          placement?: number;
          season_player_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'game_result_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'game';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_result_season_player_id_fkey';
            columns: ['season_player_id'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
        ];
      };
      match: {
        Row: {
          id: string;
          leg: number;
          player_a: string;
          player_b: string;
          series_len: Database['public']['Enums']['series_length'];
          slot_id: string | null;
          stage_id: string;
        };
        Insert: {
          id?: string;
          leg?: number;
          player_a: string;
          player_b: string;
          series_len: Database['public']['Enums']['series_length'];
          slot_id?: string | null;
          stage_id: string;
        };
        Update: {
          id?: string;
          leg?: number;
          player_a?: string;
          player_b?: string;
          series_len?: Database['public']['Enums']['series_length'];
          slot_id?: string | null;
          stage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_player_a_fkey';
            columns: ['player_a'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_player_b_fkey';
            columns: ['player_b'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'match_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'stage';
            referencedColumns: ['id'];
          },
        ];
      };
      match_game: {
        Row: {
          created_at: string;
          game_number: number;
          match_id: string;
          score_a: number;
          score_b: number;
          tiebreak_winner:
            | Database['public']['Enums']['tiebreak_winner']
            | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          game_number: number;
          match_id: string;
          score_a: number;
          score_b: number;
          tiebreak_winner?:
            | Database['public']['Enums']['tiebreak_winner']
            | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          game_number?: number;
          match_id?: string;
          score_a?: number;
          score_b?: number;
          tiebreak_winner?:
            | Database['public']['Enums']['tiebreak_winner']
            | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'match_game_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'match';
            referencedColumns: ['id'];
          },
        ];
      };
      player: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      power_up: {
        Row: {
          can_target_others: boolean;
          id: string;
          is_curse: boolean;
          season_id: string;
          slug: string;
        };
        Insert: {
          can_target_others?: boolean;
          id?: string;
          is_curse?: boolean;
          season_id: string;
          slug: string;
        };
        Update: {
          can_target_others?: boolean;
          id?: string;
          is_curse?: boolean;
          season_id?: string;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'power_up_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'season';
            referencedColumns: ['id'];
          },
        ];
      };
      power_up_use: {
        Row: {
          affected_season_player_id: string;
          game_id: string;
          id: string;
          points_delta: number;
          power_up_id: string;
          used_by_season_player_id: string;
        };
        Insert: {
          affected_season_player_id: string;
          game_id: string;
          id?: string;
          points_delta: number;
          power_up_id: string;
          used_by_season_player_id: string;
        };
        Update: {
          affected_season_player_id?: string;
          game_id?: string;
          id?: string;
          points_delta?: number;
          power_up_id?: string;
          used_by_season_player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'power_up_use_affected_season_player_id_fkey';
            columns: ['affected_season_player_id'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'power_up_use_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'game';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'power_up_use_power_up_id_fkey';
            columns: ['power_up_id'];
            isOneToOne: false;
            referencedRelation: 'power_up';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'power_up_use_used_by_season_player_id_fkey';
            columns: ['used_by_season_player_id'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
        ];
      };
      round: {
        Row: {
          id: string;
          label: string | null;
          ordinal: number;
          stage_id: string;
        };
        Insert: {
          id?: string;
          label?: string | null;
          ordinal: number;
          stage_id: string;
        };
        Update: {
          id?: string;
          label?: string | null;
          ordinal?: number;
          stage_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'round_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'stage';
            referencedColumns: ['id'];
          },
        ];
      };
      round_result: {
        Row: {
          created_at: string;
          raw_score: number;
          round_id: string;
          season_player_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          raw_score: number;
          round_id: string;
          season_player_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          raw_score?: number;
          round_id?: string;
          season_player_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'round_result_round_id_fkey';
            columns: ['round_id'];
            isOneToOne: false;
            referencedRelation: 'round';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'round_result_season_player_id_fkey';
            columns: ['season_player_id'];
            isOneToOne: false;
            referencedRelation: 'season_player';
            referencedColumns: ['id'];
          },
        ];
      };
      season: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          number: number;
          started_at: string | null;
          status: Database['public']['Enums']['season_status'];
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          number: number;
          started_at?: string | null;
          status?: Database['public']['Enums']['season_status'];
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          number?: number;
          started_at?: string | null;
          status?: Database['public']['Enums']['season_status'];
        };
        Relationships: [];
      };
      season_ladder: {
        Row: {
          placement: number;
          points: number;
          season_id: string;
        };
        Insert: {
          placement: number;
          points: number;
          season_id: string;
        };
        Update: {
          placement?: number;
          points?: number;
          season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'season_ladder_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'season';
            referencedColumns: ['id'];
          },
        ];
      };
      season_player: {
        Row: {
          id: string;
          player_id: string;
          season_id: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          season_id: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          season_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'season_player_player_id_fkey';
            columns: ['player_id'];
            isOneToOne: false;
            referencedRelation: 'player';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'season_player_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'season';
            referencedColumns: ['id'];
          },
        ];
      };
      season_result: {
        Row: {
          confirmed: boolean;
          created_at: string;
          note: string | null;
          placement: number;
          season_id: string;
          season_player_id: string;
          updated_at: string;
        };
        Insert: {
          confirmed?: boolean;
          created_at?: string;
          note?: string | null;
          placement: number;
          season_id: string;
          season_player_id: string;
          updated_at?: string;
        };
        Update: {
          confirmed?: boolean;
          created_at?: string;
          note?: string | null;
          placement?: number;
          season_id?: string;
          season_player_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'season_result_season_id_fkey';
            columns: ['season_id'];
            isOneToOne: false;
            referencedRelation: 'season';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'season_result_season_id_season_player_id_fkey';
            columns: ['season_id', 'season_player_id'];
            isOneToOne: true;
            referencedRelation: 'season_player';
            referencedColumns: ['season_id', 'id'];
          },
        ];
      };
      stage: {
        Row: {
          aggregation: Database['public']['Enums']['stage_aggregation'] | null;
          game_id: string;
          id: string;
          kind: Database['public']['Enums']['stage_kind'];
          ordinal: number;
        };
        Insert: {
          aggregation?: Database['public']['Enums']['stage_aggregation'] | null;
          game_id: string;
          id?: string;
          kind: Database['public']['Enums']['stage_kind'];
          ordinal: number;
        };
        Update: {
          aggregation?: Database['public']['Enums']['stage_aggregation'] | null;
          game_id?: string;
          id?: string;
          kind?: Database['public']['Enums']['stage_kind'];
          ordinal?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'stage_game_id_fkey';
            columns: ['game_id'];
            isOneToOne: false;
            referencedRelation: 'game';
            referencedColumns: ['id'];
          },
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
      game_status: 'not-started' | 'in-progress' | 'complete';
      season_status: 'not-started' | 'live' | 'complete';
      series_length: 'bo1' | 'bo3' | 'bo5';
      stage_aggregation: 'sum' | 'rank-then-sum';
      stage_kind:
        | 'round-robin'
        | 'single-elim'
        | 'final-bronze'
        | 'double-elim-reset'
        | 'double-elim-no-reset'
        | 'rounds';
      tiebreak_winner: 'a' | 'b';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      game_status: ['not-started', 'in-progress', 'complete'],
      season_status: ['not-started', 'live', 'complete'],
      series_length: ['bo1', 'bo3', 'bo5'],
      stage_aggregation: ['sum', 'rank-then-sum'],
      stage_kind: [
        'round-robin',
        'single-elim',
        'final-bronze',
        'double-elim-reset',
        'double-elim-no-reset',
        'rounds',
      ],
      tiebreak_winner: ['a', 'b'],
    },
  },
} as const;
