alter table "public"."app_users" drop constraint "app_users_status_check";

alter table "public"."app_users" drop constraint "app_users_type_check";

alter table "public"."memberships" drop constraint "memberships_company_id_fkey";

alter table "public"."menu_items" drop constraint "menu_items_restaurant_id_fkey";

alter table "public"."addresses" disable row level security;

alter table "public"."companies" disable row level security;

alter table "public"."meal_balances" disable row level security;

alter table "public"."memberships" disable row level security;

alter table "public"."restaurants" disable row level security;

alter table "public"."memberships" add constraint "memberships_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_company_id_fkey";

alter table "public"."menu_items" add constraint "menu_items_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."menu_items" validate constraint "menu_items_restaurant_id_fkey";


