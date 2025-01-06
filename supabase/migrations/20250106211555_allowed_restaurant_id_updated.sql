ALTER TABLE "public"."allowed_restaurants"
DROP COLUMN "id",
ADD COLUMN "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY;



