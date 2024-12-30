alter table "public"."invoices" drop constraint "invoices_company_id_fkey1";

alter table "public"."meal_balances" drop constraint "meal_balances_employee_id_fkey1";

alter table "public"."meal_balances" drop constraint "meal_balances_employee_id_fkey2";

alter table "public"."meal_balances" drop constraint "meal_balances_membership_id_fkey1";

alter table "public"."meal_balances" drop constraint "meal_balances_membership_id_fkey2";

alter table "public"."app_users" disable row level security;

alter table "public"."menu_items" disable row level security;


