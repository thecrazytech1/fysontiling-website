CREATE TABLE "site_gallery_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_gallery_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
GRANT SELECT ON "site_gallery_categories" TO anon;--> statement-breakpoint
GRANT ALL ON "site_gallery_categories" TO service_role;--> statement-breakpoint
ALTER TABLE "site_gallery_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Anyone can read gallery categories" ON "site_gallery_categories" FOR SELECT TO anon USING (true);--> statement-breakpoint
-- The four categories the site launched with, then any other name already on a photo,
-- so the foreign key below always holds.
INSERT INTO "site_gallery_categories" ("name", "sort_order") VALUES
  ('Bathroom Tiling', 0), ('Splashback', 1), ('Floor Tiling', 2), ('Outdoors', 3);--> statement-breakpoint
INSERT INTO "site_gallery_categories" ("name", "sort_order")
  SELECT DISTINCT "category", 100 FROM "site_photos" WHERE "category" IS NOT NULL
  ON CONFLICT ("name") DO NOTHING;--> statement-breakpoint
ALTER TABLE "site_photos" ADD CONSTRAINT "site_photos_category_site_gallery_categories_name_fk" FOREIGN KEY ("category") REFERENCES "public"."site_gallery_categories"("name") ON DELETE no action ON UPDATE cascade;
