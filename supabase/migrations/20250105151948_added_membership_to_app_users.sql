alter table "public"."app_users" add column "membership_id" uuid;

alter table "public"."app_users" add constraint "app_users_membership_id_fkey" FOREIGN KEY (membership_id) REFERENCES memberships(id) ON UPDATE CASCADE ON DELETE SET NULL not valid;

alter table "public"."app_users" validate constraint "app_users_membership_id_fkey";


