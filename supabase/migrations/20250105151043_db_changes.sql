drop policy "Allow company_admins to manage meal balances" on "public"."meal_balances";

drop policy "Allow employees to view their own balances" on "public"."meal_balances";

drop policy "Allow access to related addresses" on "public"."addresses";

revoke delete on table "public"."meal_balances" from "anon";

revoke insert on table "public"."meal_balances" from "anon";

revoke references on table "public"."meal_balances" from "anon";

revoke select on table "public"."meal_balances" from "anon";

revoke trigger on table "public"."meal_balances" from "anon";

revoke truncate on table "public"."meal_balances" from "anon";

revoke update on table "public"."meal_balances" from "anon";

revoke delete on table "public"."meal_balances" from "authenticated";

revoke insert on table "public"."meal_balances" from "authenticated";

revoke references on table "public"."meal_balances" from "authenticated";

revoke select on table "public"."meal_balances" from "authenticated";

revoke trigger on table "public"."meal_balances" from "authenticated";

revoke truncate on table "public"."meal_balances" from "authenticated";

revoke update on table "public"."meal_balances" from "authenticated";

revoke delete on table "public"."meal_balances" from "service_role";

revoke insert on table "public"."meal_balances" from "service_role";

revoke references on table "public"."meal_balances" from "service_role";

revoke select on table "public"."meal_balances" from "service_role";

revoke trigger on table "public"."meal_balances" from "service_role";

revoke truncate on table "public"."meal_balances" from "service_role";

revoke update on table "public"."meal_balances" from "service_role";

alter table "public"."companies" drop constraint "companies_address_id_fkey";

alter table "public"."meal_balances" drop constraint "meal_balances_employee_id_fkey";

alter table "public"."meal_balances" drop constraint "meal_balances_employee_id_key";

alter table "public"."meal_balances" drop constraint "meal_balances_membership_id_fkey";

alter table "public"."restaurants" drop constraint "restaurants_address_id_fkey";

alter table "public"."meal_balances" drop constraint "meal_balances_pkey";

drop index if exists "public"."meal_balances_employee_id_key";

drop index if exists "public"."meal_balances_pkey";

drop table "public"."meal_balances";

create table "public"."allowed_restaurants" (
    "id" bigint generated by default as identity not null,
    "company_id" uuid,
    "restaurant_id" uuid,
    "distance_km" smallint,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."hours_range" (
    "id" uuid not null default gen_random_uuid(),
    "from" time with time zone,
    "to" time with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."app_users" drop column "company_email";

alter table "public"."app_users" drop column "secondary_email";

alter table "public"."app_users" add column "personal_email" text;

alter table "public"."app_users" alter column "company_id" drop not null;

alter table "public"."app_users" alter column "type" set not null;

alter table "public"."companies" drop column "address_id";

alter table "public"."companies" add column "address" uuid not null;

alter table "public"."memberships" drop column "meals_per_week";

alter table "public"."memberships" drop column "monthly_price_per_employee";

alter table "public"."memberships" add column "price_per_meal" smallint;

alter table "public"."menu_items" add column "meals_per_week" smallint;

alter table "public"."restaurants" drop column "address_id";

alter table "public"."restaurants" add column "address" uuid;

alter table "public"."restaurants" add column "lunch_hours" uuid;

alter table "public"."restaurants" alter column "opening_hours" set data type uuid using "opening_hours"::uuid;

CREATE UNIQUE INDEX "HoursRange_pkey" ON public.hours_range USING btree (id);

CREATE UNIQUE INDEX allowed_restaurants_pkey ON public.allowed_restaurants USING btree (id);

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_pkey" PRIMARY KEY using index "allowed_restaurants_pkey";

alter table "public"."hours_range" add constraint "HoursRange_pkey" PRIMARY KEY using index "HoursRange_pkey";

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."allowed_restaurants" validate constraint "allowed_restaurants_company_id_fkey";

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."allowed_restaurants" validate constraint "allowed_restaurants_restaurant_id_fkey";

alter table "public"."companies" add constraint "companies_address_fkey" FOREIGN KEY (address) REFERENCES addresses(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."companies" validate constraint "companies_address_fkey";

alter table "public"."restaurants" add constraint "restaurants_address_fkey" FOREIGN KEY (address) REFERENCES addresses(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_address_fkey";

alter table "public"."restaurants" add constraint "restaurants_lunch_hours_fkey" FOREIGN KEY (lunch_hours) REFERENCES hours_range(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_lunch_hours_fkey";

alter table "public"."restaurants" add constraint "restaurants_opening_hours_fkey" FOREIGN KEY (opening_hours) REFERENCES hours_range(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_opening_hours_fkey";

grant delete on table "public"."allowed_restaurants" to "anon";

grant insert on table "public"."allowed_restaurants" to "anon";

grant references on table "public"."allowed_restaurants" to "anon";

grant select on table "public"."allowed_restaurants" to "anon";

grant trigger on table "public"."allowed_restaurants" to "anon";

grant truncate on table "public"."allowed_restaurants" to "anon";

grant update on table "public"."allowed_restaurants" to "anon";

grant delete on table "public"."allowed_restaurants" to "authenticated";

grant insert on table "public"."allowed_restaurants" to "authenticated";

grant references on table "public"."allowed_restaurants" to "authenticated";

grant select on table "public"."allowed_restaurants" to "authenticated";

grant trigger on table "public"."allowed_restaurants" to "authenticated";

grant truncate on table "public"."allowed_restaurants" to "authenticated";

grant update on table "public"."allowed_restaurants" to "authenticated";

grant delete on table "public"."allowed_restaurants" to "service_role";

grant insert on table "public"."allowed_restaurants" to "service_role";

grant references on table "public"."allowed_restaurants" to "service_role";

grant select on table "public"."allowed_restaurants" to "service_role";

grant trigger on table "public"."allowed_restaurants" to "service_role";

grant truncate on table "public"."allowed_restaurants" to "service_role";

grant update on table "public"."allowed_restaurants" to "service_role";

grant delete on table "public"."hours_range" to "anon";

grant insert on table "public"."hours_range" to "anon";

grant references on table "public"."hours_range" to "anon";

grant select on table "public"."hours_range" to "anon";

grant trigger on table "public"."hours_range" to "anon";

grant truncate on table "public"."hours_range" to "anon";

grant update on table "public"."hours_range" to "anon";

grant delete on table "public"."hours_range" to "authenticated";

grant insert on table "public"."hours_range" to "authenticated";

grant references on table "public"."hours_range" to "authenticated";

grant select on table "public"."hours_range" to "authenticated";

grant trigger on table "public"."hours_range" to "authenticated";

grant truncate on table "public"."hours_range" to "authenticated";

grant update on table "public"."hours_range" to "authenticated";

grant delete on table "public"."hours_range" to "service_role";

grant insert on table "public"."hours_range" to "service_role";

grant references on table "public"."hours_range" to "service_role";

grant select on table "public"."hours_range" to "service_role";

grant trigger on table "public"."hours_range" to "service_role";

grant truncate on table "public"."hours_range" to "service_role";

grant update on table "public"."hours_range" to "service_role";

create policy "Allow access to related addresses"
on "public"."addresses"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM companies
  WHERE ((companies.address = addresses.id) AND (companies.id = ( SELECT app_users.company_id
           FROM app_users
          WHERE (app_users.id = auth.uid())))))));



