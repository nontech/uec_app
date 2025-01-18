create type "public"."types_user" as enum ('employee', 'company_admin', 'admin');

create table "public"."addresses" (
    "id" uuid not null default uuid_generate_v4(),
    "address" text,
    "postal_code" integer,
    "city" text,
    "state" text,
    "country" text not null default 'Germany'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."allowed_restaurants" (
    "company_id" uuid,
    "restaurant_id" uuid,
    "distance_km" real,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" uuid not null default gen_random_uuid()
);


create table "public"."app_users" (
    "id" uuid not null default uuid_generate_v4(),
    "type" text not null,
    "company_id" uuid,
    "first_name" text not null,
    "last_name" text,
    "status" text,
    "profile_image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "personal_email" text,
    "membership_id" uuid,
    "meals_per_week" smallint,
    "email" text not null,
    "restaurant_id" uuid
);


create table "public"."companies" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "logo_url" text,
    "billing_email" text,
    "vat_id" text,
    "tax_id" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "address" uuid not null
);


create table "public"."hours_range" (
    "id" uuid not null default gen_random_uuid(),
    "from" time with time zone,
    "to" time with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


create table "public"."invoices" (
    "id" uuid not null default uuid_generate_v4(),
    "company_id" uuid,
    "amount" numeric,
    "status" text,
    "due_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."invoices" enable row level security;

create table "public"."memberships" (
    "id" uuid not null default uuid_generate_v4(),
    "company_id" uuid,
    "plan_type" text,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "status" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "price_per_meal" smallint
);


create table "public"."menu_items" (
    "id" uuid not null default uuid_generate_v4(),
    "restaurant_id" uuid,
    "name" text,
    "description" text,
    "price" text,
    "is_available" boolean,
    "category" text default 'Main'::text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "days" text[]
);


create table "public"."payment_methods" (
    "id" uuid not null default uuid_generate_v4(),
    "company_id" uuid,
    "type" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."payment_methods" enable row level security;

create table "public"."restaurants" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text,
    "description" text,
    "cuisine_type" text,
    "image_url" text,
    "opening_hours" uuid,
    "tier" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "address" uuid,
    "lunch_hours" uuid
);


create table "public"."transactions" (
    "id" uuid not null default uuid_generate_v4(),
    "employee_id" uuid,
    "restaurant_id" uuid,
    "menu_item_id" uuid,
    "amount" numeric,
    "payment_status" text,
    "payment_method" text,
    "transaction_date" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."transactions" enable row level security;

CREATE UNIQUE INDEX "HoursRange_pkey" ON public.hours_range USING btree (id);

CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);

CREATE UNIQUE INDEX allowed_restaurants_pkey ON public.allowed_restaurants USING btree (id);

CREATE UNIQUE INDEX app_users_pkey ON public.app_users USING btree (id);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

CREATE UNIQUE INDEX memberships_pkey ON public.memberships USING btree (id);

CREATE UNIQUE INDEX menu_items_pkey ON public.menu_items USING btree (id);

CREATE UNIQUE INDEX payment_methods_pkey ON public.payment_methods USING btree (id);

CREATE UNIQUE INDEX restaurants_pkey ON public.restaurants USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

alter table "public"."addresses" add constraint "addresses_pkey" PRIMARY KEY using index "addresses_pkey";

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_pkey" PRIMARY KEY using index "allowed_restaurants_pkey";

alter table "public"."app_users" add constraint "app_users_pkey" PRIMARY KEY using index "app_users_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."hours_range" add constraint "HoursRange_pkey" PRIMARY KEY using index "HoursRange_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."memberships" add constraint "memberships_pkey" PRIMARY KEY using index "memberships_pkey";

alter table "public"."menu_items" add constraint "menu_items_pkey" PRIMARY KEY using index "menu_items_pkey";

alter table "public"."payment_methods" add constraint "payment_methods_pkey" PRIMARY KEY using index "payment_methods_pkey";

alter table "public"."restaurants" add constraint "restaurants_pkey" PRIMARY KEY using index "restaurants_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."allowed_restaurants" validate constraint "allowed_restaurants_company_id_fkey";

alter table "public"."allowed_restaurants" add constraint "allowed_restaurants_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."allowed_restaurants" validate constraint "allowed_restaurants_restaurant_id_fkey";

alter table "public"."app_users" add constraint "app_users_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."app_users" validate constraint "app_users_company_id_fkey";

alter table "public"."app_users" add constraint "app_users_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES memberships(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."app_users" validate constraint "app_users_membership_id_fkey";

alter table "public"."app_users" add constraint "app_users_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."app_users" validate constraint "app_users_restaurant_id_fkey";

alter table "public"."companies" add constraint "companies_address_fkey" FOREIGN KEY (address) REFERENCES addresses(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."companies" validate constraint "companies_address_fkey";

alter table "public"."invoices" add constraint "invoices_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."invoices" validate constraint "invoices_company_id_fkey";

alter table "public"."memberships" add constraint "memberships_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_company_id_fkey";

alter table "public"."memberships" add constraint "memberships_plan_type_check" CHECK ((plan_type = ANY (ARRAY['S'::text, 'M'::text, 'L'::text, 'XL'::text]))) not valid;

alter table "public"."memberships" validate constraint "memberships_plan_type_check";

alter table "public"."memberships" add constraint "memberships_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))) not valid;

alter table "public"."memberships" validate constraint "memberships_status_check";

alter table "public"."menu_items" add constraint "menu_items_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."menu_items" validate constraint "menu_items_restaurant_id_fkey";

alter table "public"."payment_methods" add constraint "payment_methods_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."payment_methods" validate constraint "payment_methods_company_id_fkey";

alter table "public"."restaurants" add constraint "restaurants_address_fkey" FOREIGN KEY (address) REFERENCES addresses(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_address_fkey";

alter table "public"."restaurants" add constraint "restaurants_lunch_hours_fkey" FOREIGN KEY (lunch_hours) REFERENCES hours_range(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_lunch_hours_fkey";

alter table "public"."restaurants" add constraint "restaurants_opening_hours_fkey" FOREIGN KEY (opening_hours) REFERENCES hours_range(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."restaurants" validate constraint "restaurants_opening_hours_fkey";

alter table "public"."restaurants" add constraint "restaurants_tier_check" CHECK ((tier = ANY (ARRAY['S'::text, 'M'::text, 'L'::text, 'XL'::text]))) not valid;

alter table "public"."restaurants" validate constraint "restaurants_tier_check";

alter table "public"."transactions" add constraint "transactions_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES app_users(id) not valid;

alter table "public"."transactions" validate constraint "transactions_employee_id_fkey";

alter table "public"."transactions" add constraint "transactions_menu_item_id_fkey" FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) not valid;

alter table "public"."transactions" validate constraint "transactions_menu_item_id_fkey";

alter table "public"."transactions" add constraint "transactions_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) not valid;

alter table "public"."transactions" validate constraint "transactions_restaurant_id_fkey";

grant delete on table "public"."addresses" to "anon";

grant insert on table "public"."addresses" to "anon";

grant references on table "public"."addresses" to "anon";

grant select on table "public"."addresses" to "anon";

grant trigger on table "public"."addresses" to "anon";

grant truncate on table "public"."addresses" to "anon";

grant update on table "public"."addresses" to "anon";

grant delete on table "public"."addresses" to "authenticated";

grant insert on table "public"."addresses" to "authenticated";

grant references on table "public"."addresses" to "authenticated";

grant select on table "public"."addresses" to "authenticated";

grant trigger on table "public"."addresses" to "authenticated";

grant truncate on table "public"."addresses" to "authenticated";

grant update on table "public"."addresses" to "authenticated";

grant delete on table "public"."addresses" to "service_role";

grant insert on table "public"."addresses" to "service_role";

grant references on table "public"."addresses" to "service_role";

grant select on table "public"."addresses" to "service_role";

grant trigger on table "public"."addresses" to "service_role";

grant truncate on table "public"."addresses" to "service_role";

grant update on table "public"."addresses" to "service_role";

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

grant delete on table "public"."app_users" to "anon";

grant insert on table "public"."app_users" to "anon";

grant references on table "public"."app_users" to "anon";

grant select on table "public"."app_users" to "anon";

grant trigger on table "public"."app_users" to "anon";

grant truncate on table "public"."app_users" to "anon";

grant update on table "public"."app_users" to "anon";

grant delete on table "public"."app_users" to "authenticated";

grant insert on table "public"."app_users" to "authenticated";

grant references on table "public"."app_users" to "authenticated";

grant select on table "public"."app_users" to "authenticated";

grant trigger on table "public"."app_users" to "authenticated";

grant truncate on table "public"."app_users" to "authenticated";

grant update on table "public"."app_users" to "authenticated";

grant delete on table "public"."app_users" to "service_role";

grant insert on table "public"."app_users" to "service_role";

grant references on table "public"."app_users" to "service_role";

grant select on table "public"."app_users" to "service_role";

grant trigger on table "public"."app_users" to "service_role";

grant truncate on table "public"."app_users" to "service_role";

grant update on table "public"."app_users" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

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

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

grant delete on table "public"."memberships" to "anon";

grant insert on table "public"."memberships" to "anon";

grant references on table "public"."memberships" to "anon";

grant select on table "public"."memberships" to "anon";

grant trigger on table "public"."memberships" to "anon";

grant truncate on table "public"."memberships" to "anon";

grant update on table "public"."memberships" to "anon";

grant delete on table "public"."memberships" to "authenticated";

grant insert on table "public"."memberships" to "authenticated";

grant references on table "public"."memberships" to "authenticated";

grant select on table "public"."memberships" to "authenticated";

grant trigger on table "public"."memberships" to "authenticated";

grant truncate on table "public"."memberships" to "authenticated";

grant update on table "public"."memberships" to "authenticated";

grant delete on table "public"."memberships" to "service_role";

grant insert on table "public"."memberships" to "service_role";

grant references on table "public"."memberships" to "service_role";

grant select on table "public"."memberships" to "service_role";

grant trigger on table "public"."memberships" to "service_role";

grant truncate on table "public"."memberships" to "service_role";

grant update on table "public"."memberships" to "service_role";

grant delete on table "public"."menu_items" to "anon";

grant insert on table "public"."menu_items" to "anon";

grant references on table "public"."menu_items" to "anon";

grant select on table "public"."menu_items" to "anon";

grant trigger on table "public"."menu_items" to "anon";

grant truncate on table "public"."menu_items" to "anon";

grant update on table "public"."menu_items" to "anon";

grant delete on table "public"."menu_items" to "authenticated";

grant insert on table "public"."menu_items" to "authenticated";

grant references on table "public"."menu_items" to "authenticated";

grant select on table "public"."menu_items" to "authenticated";

grant trigger on table "public"."menu_items" to "authenticated";

grant truncate on table "public"."menu_items" to "authenticated";

grant update on table "public"."menu_items" to "authenticated";

grant delete on table "public"."menu_items" to "service_role";

grant insert on table "public"."menu_items" to "service_role";

grant references on table "public"."menu_items" to "service_role";

grant select on table "public"."menu_items" to "service_role";

grant trigger on table "public"."menu_items" to "service_role";

grant truncate on table "public"."menu_items" to "service_role";

grant update on table "public"."menu_items" to "service_role";

grant delete on table "public"."payment_methods" to "anon";

grant insert on table "public"."payment_methods" to "anon";

grant references on table "public"."payment_methods" to "anon";

grant select on table "public"."payment_methods" to "anon";

grant trigger on table "public"."payment_methods" to "anon";

grant truncate on table "public"."payment_methods" to "anon";

grant update on table "public"."payment_methods" to "anon";

grant delete on table "public"."payment_methods" to "authenticated";

grant insert on table "public"."payment_methods" to "authenticated";

grant references on table "public"."payment_methods" to "authenticated";

grant select on table "public"."payment_methods" to "authenticated";

grant trigger on table "public"."payment_methods" to "authenticated";

grant truncate on table "public"."payment_methods" to "authenticated";

grant update on table "public"."payment_methods" to "authenticated";

grant delete on table "public"."payment_methods" to "service_role";

grant insert on table "public"."payment_methods" to "service_role";

grant references on table "public"."payment_methods" to "service_role";

grant select on table "public"."payment_methods" to "service_role";

grant trigger on table "public"."payment_methods" to "service_role";

grant truncate on table "public"."payment_methods" to "service_role";

grant update on table "public"."payment_methods" to "service_role";

grant delete on table "public"."restaurants" to "anon";

grant insert on table "public"."restaurants" to "anon";

grant references on table "public"."restaurants" to "anon";

grant select on table "public"."restaurants" to "anon";

grant trigger on table "public"."restaurants" to "anon";

grant truncate on table "public"."restaurants" to "anon";

grant update on table "public"."restaurants" to "anon";

grant delete on table "public"."restaurants" to "authenticated";

grant insert on table "public"."restaurants" to "authenticated";

grant references on table "public"."restaurants" to "authenticated";

grant select on table "public"."restaurants" to "authenticated";

grant trigger on table "public"."restaurants" to "authenticated";

grant truncate on table "public"."restaurants" to "authenticated";

grant update on table "public"."restaurants" to "authenticated";

grant delete on table "public"."restaurants" to "service_role";

grant insert on table "public"."restaurants" to "service_role";

grant references on table "public"."restaurants" to "service_role";

grant select on table "public"."restaurants" to "service_role";

grant trigger on table "public"."restaurants" to "service_role";

grant truncate on table "public"."restaurants" to "service_role";

grant update on table "public"."restaurants" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";

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


create policy "Allow company_admins to manage all users"
on "public"."app_users"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM app_users app_users_1
  WHERE ((app_users_1.id = auth.uid()) AND (app_users_1.type = 'company_admin'::text)))));


create policy "Allow employees to view their own data"
on "public"."app_users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Allow access to related company data"
on "public"."companies"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT app_users.id
   FROM app_users
  WHERE (app_users.company_id = companies.id))));


create policy "Allow company_admins to view invoices"
on "public"."invoices"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.type = 'company_admin'::text) AND (app_users.company_id = invoices.company_id)))));


create policy "Allow company_admins to manage memberships"
on "public"."memberships"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.type = 'company_admin'::text) AND (app_users.company_id = memberships.company_id)))));


create policy "Allow employees to view memberships"
on "public"."memberships"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT app_users.id
   FROM app_users
  WHERE (app_users.company_id = memberships.company_id))));


create policy "Allow employees to view menu items"
on "public"."menu_items"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM memberships
  WHERE ((memberships.company_id = ( SELECT app_users.company_id
           FROM app_users
          WHERE (app_users.id = auth.uid()))) AND (memberships.plan_type = ( SELECT restaurants.tier
           FROM restaurants
          WHERE (restaurants.id = menu_items.restaurant_id)))))));


create policy "Allow company_admins to manage payment methods"
on "public"."payment_methods"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.type = 'company_admin'::text) AND (app_users.company_id = payment_methods.company_id)))));


create policy "Allow public access to restaurants"
on "public"."restaurants"
as permissive
for select
to public
using (true);


create policy "Allow company_admins to view and manage transactions"
on "public"."transactions"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM app_users
  WHERE ((app_users.id = auth.uid()) AND (app_users.type = 'company_admin'::text) AND (app_users.company_id = ( SELECT app_users_1.company_id
           FROM app_users app_users_1
          WHERE (app_users_1.id = transactions.employee_id)))))));


create policy "Allow employees to view their own transactions"
on "public"."transactions"
as permissive
for select
to public
using ((auth.uid() = employee_id));



