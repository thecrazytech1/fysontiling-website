CREATE TABLE "site_images" (
	"key" text PRIMARY KEY NOT NULL,
	"photo_id" uuid,
	"focus" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_images" ADD CONSTRAINT "site_images_photo_id_site_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."site_photos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
GRANT SELECT ON "site_images" TO anon;--> statement-breakpoint
GRANT ALL ON "site_images" TO service_role;--> statement-breakpoint
ALTER TABLE "site_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Anyone can read page image choices" ON "site_images" FOR SELECT TO anon USING (true);
