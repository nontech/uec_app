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
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
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
      addresses: {
        Row: {
          address: string | null;
          city: string | null;
          country: string;
          created_at: string | null;
          id: string;
          postal_code: number | null;
          state: string | null;
          updated_at: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string | null;
          id?: string;
          postal_code?: number | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country?: string;
          created_at?: string | null;
          id?: string;
          postal_code?: number | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      app_users: {
        Row: {
          company_email: string;
          company_id: string;
          created_at: string;
          first_name: string;
          id: string;
          last_name: string | null;
          profile_image_url: string | null;
          secondary_email: string | null;
          status: string | null;
          type: string | null;
          updated_at: string;
        };
        Insert: {
          company_email: string;
          company_id: string;
          created_at?: string;
          first_name: string;
          id?: string;
          last_name?: string | null;
          profile_image_url?: string | null;
          secondary_email?: string | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string;
        };
        Update: {
          company_email?: string;
          company_id?: string;
          created_at?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          profile_image_url?: string | null;
          secondary_email?: string | null;
          status?: string | null;
          type?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'app_users_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      companies: {
        Row: {
          address_id: string;
          billing_email: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          tax_id: string | null;
          updated_at: string | null;
          vat_id: string | null;
        };
        Insert: {
          address_id: string;
          billing_email?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          tax_id?: string | null;
          updated_at?: string | null;
          vat_id?: string | null;
        };
        Update: {
          address_id?: string;
          billing_email?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          tax_id?: string | null;
          updated_at?: string | null;
          vat_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          }
        ];
      };
      invoices: {
        Row: {
          amount: number | null;
          company_id: string | null;
          created_at: string | null;
          due_date: string | null;
          id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount?: number | null;
          company_id?: string | null;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number | null;
          company_id?: string | null;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_company_id_fkey1';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      meal_balances: {
        Row: {
          created_at: string | null;
          employee_id: string | null;
          end_date: string | null;
          id: string;
          membership_id: string | null;
          remaining_meals: number | null;
          start_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          employee_id?: string | null;
          end_date?: string | null;
          id?: string;
          membership_id?: string | null;
          remaining_meals?: number | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          employee_id?: string | null;
          end_date?: string | null;
          id?: string;
          membership_id?: string | null;
          remaining_meals?: number | null;
          start_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'meal_balances_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: true;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_balances_employee_id_fkey1';
            columns: ['employee_id'];
            isOneToOne: true;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_balances_employee_id_fkey2';
            columns: ['employee_id'];
            isOneToOne: true;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_balances_membership_id_fkey';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'memberships';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_balances_membership_id_fkey1';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'meal_balances';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'meal_balances_membership_id_fkey2';
            columns: ['membership_id'];
            isOneToOne: false;
            referencedRelation: 'memberships';
            referencedColumns: ['id'];
          }
        ];
      };
      memberships: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          end_date: string | null;
          id: string;
          monthly_price_per_employee: number | null;
          plan_type: string | null;
          start_date: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          monthly_price_per_employee?: number | null;
          plan_type?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          monthly_price_per_employee?: number | null;
          plan_type?: string | null;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      menu_items: {
        Row: {
          category: string | null;
          created_at: string | null;
          day: string | null;
          description: string | null;
          id: string;
          is_available: boolean | null;
          name: string | null;
          price: number | null;
          restaurant_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          day?: string | null;
          description?: string | null;
          id?: string;
          is_available?: boolean | null;
          name?: string | null;
          price?: number | null;
          restaurant_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          day?: string | null;
          description?: string | null;
          id?: string;
          is_available?: boolean | null;
          name?: string | null;
          price?: number | null;
          restaurant_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_items_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_methods: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_methods_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          }
        ];
      };
      restaurants: {
        Row: {
          address_id: string | null;
          created_at: string | null;
          cuisine_type: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string | null;
          opening_hours: string | null;
          tier: string | null;
          updated_at: string | null;
        };
        Insert: {
          address_id?: string | null;
          created_at?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string | null;
          opening_hours?: string | null;
          tier?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address_id?: string | null;
          created_at?: string | null;
          cuisine_type?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string | null;
          opening_hours?: string | null;
          tier?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'restaurants_address_id_fkey';
            columns: ['address_id'];
            isOneToOne: false;
            referencedRelation: 'addresses';
            referencedColumns: ['id'];
          }
        ];
      };
      transactions: {
        Row: {
          amount: number | null;
          created_at: string | null;
          employee_id: string | null;
          id: string;
          menu_item_id: string | null;
          payment_method: string | null;
          payment_status: string | null;
          restaurant_id: string | null;
          transaction_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          amount?: number | null;
          created_at?: string | null;
          employee_id?: string | null;
          id?: string;
          menu_item_id?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          restaurant_id?: string | null;
          transaction_date?: string | null;
          updated_at?: string | null;
        };
        Update: {
          amount?: number | null;
          created_at?: string | null;
          employee_id?: string | null;
          id?: string;
          menu_item_id?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          restaurant_id?: string | null;
          transaction_date?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_employee_id_fkey';
            columns: ['employee_id'];
            isOneToOne: false;
            referencedRelation: 'app_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_menu_item_id_fkey';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transactions_restaurant_id_fkey';
            columns: ['restaurant_id'];
            isOneToOne: false;
            referencedRelation: 'restaurants';
            referencedColumns: ['id'];
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
      types_user: 'employee' | 'company_admin' | 'admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
      PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
      PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;