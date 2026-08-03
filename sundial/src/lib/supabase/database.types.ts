// Generated from the live Supabase project (sundial-os / xuzcmtkcqfvicgfqoyal).
// Regenerate after schema migrations via the Supabase MCP or CLI.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      agent_definitions: {
        Row: {
          config: Json;
          created_at: string;
          description: string | null;
          enabled: boolean;
          id: string;
          max_steps: number;
          max_tokens: number;
          model: string;
          name: string;
          requires_approval_for: string[];
          system_prompt: string;
          tools: string[];
          triggers: Json;
          updated_at: string;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id: string;
          max_steps?: number;
          max_tokens?: number;
          model?: string;
          name: string;
          requires_approval_for?: string[];
          system_prompt: string;
          tools?: string[];
          triggers?: Json;
          updated_at?: string;
        };
        Update: {
          config?: Json;
          created_at?: string;
          description?: string | null;
          enabled?: boolean;
          id?: string;
          max_steps?: number;
          max_tokens?: number;
          model?: string;
          name?: string;
          requires_approval_for?: string[];
          system_prompt?: string;
          tools?: string[];
          triggers?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_runs: {
        Row: {
          agent_id: string;
          completed_at: string | null;
          correlation_id: string | null;
          cost_microdollars: number;
          created_at: string;
          error: string | null;
          id: string;
          input: Json | null;
          input_tokens: number;
          output: Json | null;
          output_tokens: number;
          started_at: string | null;
          status: string;
          trigger_source: string | null;
          trigger_type: string;
        };
        Insert: {
          agent_id: string;
          completed_at?: string | null;
          correlation_id?: string | null;
          cost_microdollars?: number;
          created_at?: string;
          error?: string | null;
          id: string;
          input?: Json | null;
          input_tokens?: number;
          output?: Json | null;
          output_tokens?: number;
          started_at?: string | null;
          status?: string;
          trigger_source?: string | null;
          trigger_type: string;
        };
        Update: {
          agent_id?: string;
          completed_at?: string | null;
          correlation_id?: string | null;
          cost_microdollars?: number;
          created_at?: string;
          error?: string | null;
          id?: string;
          input?: Json | null;
          input_tokens?: number;
          output?: Json | null;
          output_tokens?: number;
          started_at?: string | null;
          status?: string;
          trigger_source?: string | null;
          trigger_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_runs_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      agent_steps: {
        Row: {
          content: Json;
          created_at: string;
          id: string;
          kind: string;
          run_id: string;
          step_index: number;
          tool_name: string | null;
        };
        Insert: {
          content?: Json;
          created_at?: string;
          id: string;
          kind: string;
          run_id: string;
          step_index: number;
          tool_name?: string | null;
        };
        Update: {
          content?: Json;
          created_at?: string;
          id?: string;
          kind?: string;
          run_id?: string;
          step_index?: number;
          tool_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agent_steps_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "agent_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      approvals: {
        Row: {
          action_payload: Json;
          action_summary: string;
          agent_id: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          expires_at: string | null;
          id: string;
          run_id: string | null;
          status: string;
          tool_name: string;
        };
        Insert: {
          action_payload: Json;
          action_summary: string;
          agent_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          expires_at?: string | null;
          id: string;
          run_id?: string | null;
          status?: string;
          tool_name: string;
        };
        Update: {
          action_payload?: Json;
          action_summary?: string;
          agent_id?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          expires_at?: string | null;
          id?: string;
          run_id?: string | null;
          status?: string;
          tool_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approvals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agent_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approvals_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "approvals_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "agent_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_email: string | null;
          actor_id: string | null;
          created_at: string;
          details: Json;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_type: string;
        };
        Insert: {
          action: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          id: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type: string;
        };
        Update: {
          action?: string;
          actor_email?: string | null;
          actor_id?: string | null;
          created_at?: string;
          details?: Json;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_type?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          company: string | null;
          created_at: string;
          email: string | null;
          health_score: number | null;
          id: string;
          metadata: Json;
          name: string;
          phone: string | null;
          status: string;
          stripe_customer_id: string | null;
          updated_at: string;
          vertical: string | null;
          zoho_contact_id: string | null;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          email?: string | null;
          health_score?: number | null;
          id: string;
          metadata?: Json;
          name: string;
          phone?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
          vertical?: string | null;
          zoho_contact_id?: string | null;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          email?: string | null;
          health_score?: number | null;
          id?: string;
          metadata?: Json;
          name?: string;
          phone?: string | null;
          status?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
          vertical?: string | null;
          zoho_contact_id?: string | null;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          content: string;
          created_at: string;
          embedding: string | null;
          id: string;
          kind: string;
          metadata: Json;
          subject_id: string | null;
          subject_type: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          embedding?: string | null;
          id: string;
          kind?: string;
          metadata?: Json;
          subject_id?: string | null;
          subject_type?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          kind?: string;
          metadata?: Json;
          subject_id?: string | null;
          subject_type?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          actor_id: string | null;
          actor_type: string;
          correlation_id: string | null;
          created_at: string;
          event_id: string;
          id: number;
          payload: Json;
          subject_id: string | null;
          subject_type: string | null;
          type: string;
        };
        Insert: {
          actor_id?: string | null;
          actor_type: string;
          correlation_id?: string | null;
          created_at?: string;
          event_id: string;
          id?: never;
          payload?: Json;
          subject_id?: string | null;
          subject_type?: string | null;
          type: string;
        };
        Update: {
          actor_id?: string | null;
          actor_type?: string;
          correlation_id?: string | null;
          created_at?: string;
          event_id?: string;
          id?: never;
          payload?: Json;
          subject_id?: string | null;
          subject_type?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount_cents: number;
          client_id: string | null;
          created_at: string;
          currency: string;
          due_date: string | null;
          id: string;
          line_items: Json;
          notes: string | null;
          number: string;
          paid_at: string | null;
          project_id: string | null;
          status: string;
          stripe_invoice_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          id: string;
          line_items?: Json;
          notes?: string | null;
          number: string;
          paid_at?: string | null;
          project_id?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          due_date?: string | null;
          id?: string;
          line_items?: Json;
          notes?: string | null;
          number?: string;
          paid_at?: string | null;
          project_id?: string | null;
          status?: string;
          stripe_invoice_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      memories: {
        Row: {
          content: string;
          created_at: string;
          embedding: string | null;
          id: string;
          importance: number;
          kind: string;
          metadata: Json;
          scope: string;
          source_run_id: string | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          embedding?: string | null;
          id: string;
          importance?: number;
          kind?: string;
          metadata?: Json;
          scope: string;
          source_run_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          importance?: number;
          kind?: string;
          metadata?: Json;
          scope?: string;
          source_run_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "memories_source_run_id_fkey";
            columns: ["source_run_id"];
            isOneToOne: false;
            referencedRelation: "agent_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          currency: string;
          id: string;
          invoice_id: string | null;
          metadata: Json;
          method: string | null;
          received_at: string;
          status: string;
          stripe_payment_id: string | null;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          currency?: string;
          id: string;
          invoice_id?: string | null;
          metadata?: Json;
          method?: string | null;
          received_at: string;
          status: string;
          stripe_payment_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          invoice_id?: string | null;
          metadata?: Json;
          method?: string | null;
          received_at?: string;
          status?: string;
          stripe_payment_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          client_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json;
          name: string;
          start_date: string | null;
          status: string;
          target_end_date: string | null;
          updated_at: string;
          vertical: string | null;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          id: string;
          metadata?: Json;
          name: string;
          start_date?: string | null;
          status?: string;
          target_end_date?: string | null;
          updated_at?: string;
          vertical?: string | null;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json;
          name?: string;
          start_date?: string | null;
          status?: string;
          target_end_date?: string | null;
          updated_at?: string;
          vertical?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          assignee: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          document_id: string | null;
          due_date: string | null;
          id: string;
          metadata: Json;
          position: number;
          priority: string;
          project_id: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          assignee?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_id?: string | null;
          due_date?: string | null;
          id: string;
          metadata?: Json;
          position?: number;
          priority?: string;
          project_id?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          assignee?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          document_id?: string | null;
          due_date?: string | null;
          id?: string;
          metadata?: Json;
          position?: number;
          priority?: string;
          project_id?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_assignee_fkey";
            columns: ["assignee"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          event_type: string;
          id: string;
          idempotency_key: string | null;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          processing_error: string | null;
          received_at: string;
          signature: string | null;
          source: string;
        };
        Insert: {
          event_type: string;
          id: string;
          idempotency_key?: string | null;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          processing_error?: string | null;
          received_at?: string;
          signature?: string | null;
          source: string;
        };
        Update: {
          event_type?: string;
          id?: string;
          idempotency_key?: string | null;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          processing_error?: string | null;
          received_at?: string;
          signature?: string | null;
          source?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_documents: {
        Args: {
          match_count?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          id: string;
          kind: string;
          similarity: number;
          title: string;
        }[];
      };
      match_memories: {
        Args: {
          match_count?: number;
          match_scope?: string;
          query_embedding: string;
        };
        Returns: {
          content: string;
          id: string;
          importance: number;
          kind: string;
          scope: string;
          similarity: number;
        }[];
      };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database["public"];

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"];
