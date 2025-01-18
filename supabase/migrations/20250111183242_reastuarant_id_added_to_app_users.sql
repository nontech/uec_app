alter table "public"."app_users" add column "restaurant_id" uuid;

alter table "public"."app_users" add constraint "app_users_restaurant_id_fkey" FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."app_users" validate constraint "app_users_restaurant_id_fkey";


