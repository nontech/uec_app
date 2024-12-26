

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."types_user" AS ENUM (
    'employee',
    'company_admin',
    'admin'
);


ALTER TYPE "public"."types_user" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "address" "text",
    "postal_code" integer,
    "city" "text",
    "state" "text",
    "country" "text" DEFAULT 'Germany'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "type" "text",
    "company_id" "uuid" NOT NULL,
    "company_email" "text" NOT NULL,
    "secondary_email" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text",
    "status" "text",
    "profile_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "app_users_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "app_users_type_check" CHECK (("type" = ANY (ARRAY['employee'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."app_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "address_id" "uuid" NOT NULL,
    "billing_email" "text",
    "vat_id" "text",
    "tax_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "amount" numeric,
    "status" "text",
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meal_balances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid",
    "membership_id" "uuid",
    "remaining_meals" integer,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."meal_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memberships" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "plan_type" "text",
    "monthly_price_per_employee" numeric,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "memberships_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['S'::"text", 'M'::"text", 'L'::"text", 'XL'::"text"]))),
    CONSTRAINT "memberships_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."menu_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "restaurant_id" "uuid",
    "name" "text",
    "description" "text",
    "price" numeric,
    "is_available" boolean,
    "day" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."menu_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_id" "uuid",
    "type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."restaurants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "cuisine_type" "text",
    "image_url" "text",
    "address_id" "uuid",
    "opening_hours" "text",
    "tier" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "restaurants_tier_check" CHECK (("tier" = ANY (ARRAY['S'::"text", 'M'::"text", 'L'::"text", 'XL'::"text"])))
);


ALTER TABLE "public"."restaurants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "employee_id" "uuid",
    "restaurant_id" "uuid",
    "menu_item_id" "uuid",
    "amount" numeric,
    "payment_status" "text",
    "payment_method" "text",
    "transaction_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_employee_id_key" UNIQUE ("employee_id");



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_users"
    ADD CONSTRAINT "app_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_company_id_fkey1" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_employee_id_fkey1" FOREIGN KEY ("employee_id") REFERENCES "public"."app_users"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_employee_id_fkey2" FOREIGN KEY ("employee_id") REFERENCES "public"."app_users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id");



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_membership_id_fkey1" FOREIGN KEY ("membership_id") REFERENCES "public"."meal_balances"("id");



ALTER TABLE ONLY "public"."meal_balances"
    ADD CONSTRAINT "meal_balances_membership_id_fkey2" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."memberships"
    ADD CONSTRAINT "memberships_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."menu_items"
    ADD CONSTRAINT "menu_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."restaurants"
    ADD CONSTRAINT "restaurants_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."app_users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id");



CREATE POLICY "Allow access to related addresses" ON "public"."addresses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."companies"
  WHERE (("companies"."address_id" = "addresses"."id") AND ("companies"."id" = ( SELECT "app_users"."company_id"
           FROM "public"."app_users"
          WHERE ("app_users"."id" = "auth"."uid"())))))));



CREATE POLICY "Allow access to related company data" ON "public"."companies" FOR SELECT USING (("auth"."uid"() IN ( SELECT "app_users"."id"
   FROM "public"."app_users"
  WHERE ("app_users"."company_id" = "companies"."id"))));



CREATE POLICY "Allow company_admins to manage all users" ON "public"."app_users" USING ((EXISTS ( SELECT 1
   FROM "public"."app_users" "app_users_1"
  WHERE (("app_users_1"."id" = "auth"."uid"()) AND ("app_users_1"."type" = 'company_admin'::"text")))));



CREATE POLICY "Allow company_admins to manage meal balances" ON "public"."meal_balances" USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."id" = "auth"."uid"()) AND ("app_users"."type" = 'company_admin'::"text") AND ("app_users"."company_id" = ( SELECT "app_users_1"."company_id"
           FROM "public"."app_users" "app_users_1"
          WHERE ("app_users_1"."id" = "meal_balances"."employee_id")))))));



CREATE POLICY "Allow company_admins to manage memberships" ON "public"."memberships" USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."id" = "auth"."uid"()) AND ("app_users"."type" = 'company_admin'::"text") AND ("app_users"."company_id" = "memberships"."company_id")))));



CREATE POLICY "Allow company_admins to manage payment methods" ON "public"."payment_methods" USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."id" = "auth"."uid"()) AND ("app_users"."type" = 'company_admin'::"text") AND ("app_users"."company_id" = "payment_methods"."company_id")))));



CREATE POLICY "Allow company_admins to view and manage transactions" ON "public"."transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."id" = "auth"."uid"()) AND ("app_users"."type" = 'company_admin'::"text") AND ("app_users"."company_id" = ( SELECT "app_users_1"."company_id"
           FROM "public"."app_users" "app_users_1"
          WHERE ("app_users_1"."id" = "transactions"."employee_id")))))));



CREATE POLICY "Allow company_admins to view invoices" ON "public"."invoices" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."app_users"
  WHERE (("app_users"."id" = "auth"."uid"()) AND ("app_users"."type" = 'company_admin'::"text") AND ("app_users"."company_id" = "invoices"."company_id")))));



CREATE POLICY "Allow employees to view memberships" ON "public"."memberships" FOR SELECT USING (("auth"."uid"() IN ( SELECT "app_users"."id"
   FROM "public"."app_users"
  WHERE ("app_users"."company_id" = "memberships"."company_id"))));



CREATE POLICY "Allow employees to view menu items" ON "public"."menu_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."memberships"
  WHERE (("memberships"."company_id" = ( SELECT "app_users"."company_id"
           FROM "public"."app_users"
          WHERE ("app_users"."id" = "auth"."uid"()))) AND ("memberships"."plan_type" = ( SELECT "restaurants"."tier"
           FROM "public"."restaurants"
          WHERE ("restaurants"."id" = "menu_items"."restaurant_id")))))));



CREATE POLICY "Allow employees to view their own balances" ON "public"."meal_balances" FOR SELECT USING (("auth"."uid"() = "employee_id"));



CREATE POLICY "Allow employees to view their own data" ON "public"."app_users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow employees to view their own transactions" ON "public"."transactions" FOR SELECT USING (("auth"."uid"() = "employee_id"));



CREATE POLICY "Allow public access to restaurants" ON "public"."restaurants" FOR SELECT USING (true);



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meal_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."menu_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."restaurants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."app_users" TO "anon";
GRANT ALL ON TABLE "public"."app_users" TO "authenticated";
GRANT ALL ON TABLE "public"."app_users" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."meal_balances" TO "anon";
GRANT ALL ON TABLE "public"."meal_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."meal_balances" TO "service_role";



GRANT ALL ON TABLE "public"."memberships" TO "anon";
GRANT ALL ON TABLE "public"."memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."memberships" TO "service_role";



GRANT ALL ON TABLE "public"."menu_items" TO "anon";
GRANT ALL ON TABLE "public"."menu_items" TO "authenticated";
GRANT ALL ON TABLE "public"."menu_items" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."restaurants" TO "anon";
GRANT ALL ON TABLE "public"."restaurants" TO "authenticated";
GRANT ALL ON TABLE "public"."restaurants" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
