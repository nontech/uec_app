alter table "public"."app_users" add column "meals_per_week" smallint;

alter table "public"."menu_items" drop column "meals_per_week";


