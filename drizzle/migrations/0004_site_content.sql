CREATE TABLE "site_faqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"src" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"category" text,
	"magazine_page" boolean DEFAULT false NOT NULL,
	"category_cover" boolean DEFAULT false NOT NULL,
	"focus" text DEFAULT 'center' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"gallery_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"publication" text DEFAULT '' NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"cover_photo_id" uuid,
	"cover_focus" text DEFAULT 'center' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_projects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_text" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_photos" ADD CONSTRAINT "site_photos_project_id_site_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."site_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_projects" ADD CONSTRAINT "site_projects_cover_photo_id_site_photos_id_fk" FOREIGN KEY ("cover_photo_id") REFERENCES "public"."site_photos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "site_photos_project_idx" ON "site_photos" USING btree ("project_id","sort_order");--> statement-breakpoint
-- Visitors (the publishable key) may only read what the site shows; all edits go
-- through /admin server functions using the service role.
GRANT SELECT ON "site_projects", "site_photos", "site_faqs", "site_text" TO anon;--> statement-breakpoint
GRANT ALL ON "site_projects", "site_photos", "site_faqs", "site_text" TO service_role;--> statement-breakpoint
ALTER TABLE "site_projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_photos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_faqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_text" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "Anyone can read published projects" ON "site_projects" FOR SELECT TO anon USING ("published");--> statement-breakpoint
CREATE POLICY "Anyone can read gallery photos and photos of published projects" ON "site_photos" FOR SELECT TO anon
  USING ("project_id" IS NULL OR EXISTS (SELECT 1 FROM "site_projects" p WHERE p."id" = "project_id" AND p."published"));--> statement-breakpoint
CREATE POLICY "Anyone can read FAQs" ON "site_faqs" FOR SELECT TO anon USING (true);--> statement-breakpoint
CREATE POLICY "Anyone can read page text" ON "site_text" FOR SELECT TO anon USING (true);--> statement-breakpoint
-- Public bucket for photos uploaded from /admin (readable by URL; only the service role writes).
INSERT INTO storage.buckets ("id", "name", "public", "file_size_limit", "allowed_mime_types")
  VALUES ('site-photos', 'site-photos', true, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp'])
  ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
-- Seed: the projects, photos and FAQs the site shipped with (generated from builtInRows
-- in src/lib/site-data.ts), so nothing changes for visitors when the tables go live.
INSERT INTO "site_projects" ("id", "slug", "title", "publication", "intro", "cover_focus", "sort_order", "published") VALUES
  ('f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'mccrea-project', 'McCrea Project', 'Home Beautiful', '', 'center', 0, true),
  ('7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'point-leo-project', 'Point Leo project', 'Home Beautiful', '', 'center', 1, true),
  ('fc4aad06-743f-428a-ae73-34fbf16d19cb', 'mt-martha-project', 'Mt.Martha Project', 'Australian House & Garden', '', 'center bottom', 2, true),
  ('986972c4-fcc3-4be2-863a-61c8d0978a04', 'pardalote-project', 'Pardalote Project', '', '', 'center', 3, true),
  ('719f7860-5d9c-477a-a33a-d96d213afa80', 'fingal-project', 'Fingal Project', '', '', 'center', 4, true),
  ('7499e6b7-6d9c-4926-a522-bac0081d25b9', 'dava-project', 'Dava Project', '', '', 'center', 5, true);
--> statement-breakpoint
INSERT INTO "site_photos" ("id", "project_id", "src", "caption", "category", "magazine_page", "category_cover", "focus", "sort_order", "gallery_order") VALUES
  ('f6cf1ca4-3e8c-4085-a1fb-cd7972691431', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:home-beautiful-mathew-st-feature.jpg', 'Terrazzo tiling across the bathroom walls and floor, shown in the printed feature.', NULL, true, false, 'center', 0, 0),
  ('e34b7d36-4dc3-47a9-a016-354f0d880aa8', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:home-beautiful-mathew-st-feature-2.jpg', 'Olive-grey subway tiles in a horizontal stack, paired with a speckled terrazzo floor in the printed feature.', NULL, true, false, 'center', 1, 0),
  ('8a179eda-771f-4d29-8efb-607f0c098099', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:home-beautiful-mathew-st-feature-3.jpg', 'Grey square tiles with varied tones and a glossy finish, laid in a grid in the powder room shown in print.', NULL, true, false, 'center', 2, 0),
  ('d5243bc0-2be2-4a1b-9230-6d4525f57364', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-bath-detail.jpg', 'Glossy olive-green wall tiles laid in a horizontal stack around the bath.', 'Bathroom Tiling', false, false, 'center', 3, 24),
  ('f99b4d01-c352-4a66-8831-acc2d84aace9', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-bathroom.jpg', 'Green subway wall tiles paired with a speckled terrazzo floor.', 'Bathroom Tiling', false, false, 'center', 4, 25),
  ('f107a738-ab73-4db7-9e4b-50077f34725c', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-terrazzo-vanity.jpg', 'Terrazzo tiles continue across the floor and into the shower, bringing the speckled finish onto the walls.', 'Bathroom Tiling', false, false, 'center', 5, 26),
  ('b7d48818-5e83-4974-9ddd-f2cff0156c27', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-bath-vanity.jpg', 'Olive-green tiles form a horizontal grid around the bath and along the vanity wall.', 'Bathroom Tiling', false, false, 'center', 6, 27),
  ('f504eec9-71f9-4527-b747-b301fb981d3f', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-vanity-counter.jpg', 'A close-up of the glossy green splashback tiles and their horizontal layout.', 'Bathroom Tiling', false, false, 'center', 7, 28),
  ('3bb36fc0-81a3-430d-b659-68860901f08d', 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2', 'asset:mccrea-pantry.jpg', 'Glossy green subway tiles line the pantry splashback in a horizontal stack.', 'Splashback', false, false, 'center', 8, 29),
  ('2d8fd2e2-3549-496c-be81-a7a28990d017', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:home-beautiful-pt-leo-feature.jpg', 'The Point Leo bathroom tiling as shown in the printed feature.', NULL, true, false, 'center', 0, 0),
  ('ac1ab3fb-bc0f-49c1-9298-eebc108e8fda', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-1.jpg', 'Pale grey finger tiles follow the curved shower wall in a vertical layout, beside a veined stone-look floor.', 'Bathroom Tiling', false, false, 'center', 1, 30),
  ('2fe2c717-38a8-4e56-9627-0e1a6385806b', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-2.jpg', 'Pale grey finger tiles laid vertically across the double-shower wall.', 'Bathroom Tiling', false, false, 'center', 2, 31),
  ('0247583a-e8ce-40f0-991d-058d589d6697', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-3.jpg', 'Grey finger tiles form a fine vertical grid around the vanity splashback.', 'Bathroom Tiling', false, false, 'center', 3, 32),
  ('aa0f70eb-2999-45c8-a23d-b4d5d0df53e8', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-4.jpg', 'Vertical grey finger tiles wrap the shower walls, contrasting with the broad veined surfaces below.', 'Bathroom Tiling', false, false, 'center', 4, 33),
  ('154b5a3f-da2d-4fe6-80dc-79d9506b785d', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-5.jpg', 'Large veined grey floor tiles contrast with the fine vertical pattern of the grey wall tiles.', 'Bathroom Tiling', false, false, 'center', 5, 34),
  ('4c3af825-5e31-4fe8-b076-2f0353f9ae8b', '7bec6ea4-37f7-4fc4-86cd-051badccd4be', 'asset:pt-leo-6.jpg', 'Grey finger tiles behind the bath pair with large-format, veined grey floor tiles.', 'Bathroom Tiling', false, false, 'center', 6, 35),
  ('32c07ada-44c0-42c5-bd12-6612ba96e40d', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:house-garden-mt-martha-feature.jpg', 'White square tiles and a sage-green feature wall, shown together in the printed bathroom feature.', NULL, true, false, 'center', 0, 0),
  ('612fc13d-3807-4351-9007-ab99c9ad9457', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:mt-martha-1.jpg', 'Pale picket-mosaic splashback tiles paired with a dark, speckled terrazzo floor.', 'Bathroom Tiling', false, false, 'center', 1, 36),
  ('db093fa8-2867-40e0-9eea-dbe85c7b809a', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:mt-martha-2.jpg', 'White finger tiles create a fine vertical pattern across the vanity splashback.', 'Bathroom Tiling', false, false, 'center', 2, 37),
  ('292ea9f8-32dd-4961-b930-eddad4b03022', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:mt-martha-3.jpg', 'White square wall tiles laid in a straight grid with clearly defined grout lines.', 'Bathroom Tiling', false, false, 'center', 3, 38),
  ('f7d7b191-e7da-43a6-8d53-7bb874abdaf1', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:mt-martha-4.jpg', 'White square tiles around the bath meet a seafoam-green tiled feature wall.', 'Bathroom Tiling', false, false, 'center', 4, 39),
  ('ec28dff1-75ef-48cc-988d-5f32e0997ac0', 'fc4aad06-743f-428a-ae73-34fbf16d19cb', 'asset:mt-martha-5.jpg', 'Variegated teal and sage wall tiles bring a softly changing colour pattern to the bath surround.', 'Bathroom Tiling', false, false, 'center', 5, 40),
  ('b4634469-e370-41f4-946a-566235677f0d', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:bathroom-black-vanity.jpg', 'Glossy black wall tiles reflect the light, highlighting their textured surface and grout lines.', 'Bathroom Tiling', false, false, 'center', 0, 13),
  ('ef360618-f7bd-4e9a-a49d-73f0e49c2119', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:dark-bathroom.jpg', 'Glossy black subway tiles create a reflective tiled backdrop across the vanity wall.', 'Bathroom Tiling', false, false, 'center', 1, 12),
  ('e07abd65-3113-4583-9a99-a891f723a8c2', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-kids-ensuite.jpg', 'Cream subway tiles in a stacked layout contrast with dark stone-look tiling.', 'Bathroom Tiling', false, false, 'center', 2, 41),
  ('7bfcfa65-2a0f-4833-855b-7eda1adb68ac', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-2.jpg', 'Glossy green wall tiles laid horizontally across the vanity splashback.', 'Bathroom Tiling', false, false, 'center', 3, 42),
  ('e2fbae82-f76f-48e7-8bbd-e5d6a4987b01', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-3.jpg', 'Green tiles in a vertical layout above a band of charcoal tiling.', 'Bathroom Tiling', false, false, 'center', 4, 43),
  ('c4fd4f15-8421-4b18-aea0-2e10e456c6ed', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-4.jpg', 'Light neutral tiles in a stacked layout contrast with charcoal tiled surfaces.', 'Bathroom Tiling', false, false, 'center', 5, 44),
  ('38f11b88-40b0-4a56-878c-f8b251edb1b0', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-green-vanity.jpg', 'Deep green glossy tiles form a richly coloured vanity splashback.', 'Bathroom Tiling', false, false, 'center', 6, 45),
  ('3b1331b5-de36-443d-bd9a-ef78d52d6dfe', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-pendant.jpg', 'Glossy green wall tiles catch the light across the vanity splashback.', 'Bathroom Tiling', false, false, 'center', 7, 46),
  ('71a0a335-8303-4b58-a887-90bcaeedc776', '986972c4-fcc3-4be2-863a-61c8d0978a04', 'asset:pardalote-timber-vanity.jpg', 'Dark glossy tiles create a reflective finish across the vanity wall.', 'Bathroom Tiling', false, false, 'center', 8, 47),
  ('e936692e-e029-4a70-9cc8-4f73d9a5e905', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:floor-brick-living.jpg', 'Brick pavers in a running-bond layout continue through the open-plan living area.', 'Floor Tiling', false, false, 'center', 0, 11),
  ('33c816e5-f908-4dc5-a5c1-9cb4a5eaa115', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:floor-brick-hallway.jpg', 'Brick pavers laid in a running bond, with staggered joints extending down the hallway.', 'Floor Tiling', false, false, 'bottom', 1, 10),
  ('554af0bf-ce3b-4f7a-b86b-7310caa5b651', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-kitchen-dining.jpg', 'Brick pavers in a running bond through the kitchen and dining space, with glossy splashback tiles behind the open shelves.', 'Floor Tiling', false, false, 'center', 2, 48),
  ('e7770513-836b-409d-856f-cec42b59f800', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-kitchen-island.jpg', 'Brick floor pavers laid in a running bond beneath the kitchen island.', 'Floor Tiling', false, false, 'center', 3, 49),
  ('d745c828-375a-4aa1-9ec3-051ba4591233', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-kitchen-wide.jpg', 'Brick pavers in a running bond flow through the open-plan kitchen and dining space.', 'Floor Tiling', false, false, 'center', 4, 50),
  ('6ae35cdf-b7da-40f3-a5d7-ace11d976d09', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-living-outdoor.jpg', 'Brick pavers in a running bond across the living room floor, opening to the outdoor deck.', 'Floor Tiling', false, false, 'center', 5, 51),
  ('26a42892-0d58-4c13-878c-3bb00305d3e8', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-outdoor-living.jpg', 'Brick pavers in a running bond lead from the living area out to the timber deck.', 'Floor Tiling', false, false, 'center', 6, 52),
  ('ab0582d4-f79b-47eb-95e0-f9ed9d343f9e', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-sauna-outdoor.jpg', 'Dark-grey floor tiles laid in a straight grid around the outdoor fireplace.', 'Outdoors', false, false, 'center', 7, 53),
  ('387f8790-91f3-4d9e-a1af-65eb16dfe8dc', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-master-ensuite.jpg', 'Grey stone-look tiles on the walls and floor, with glossy green finger tiles inside the shower.', 'Bathroom Tiling', false, false, 'center', 8, 54),
  ('cf496472-3dd8-46a6-9fc7-6237effae408', '719f7860-5d9c-477a-a33a-d96d213afa80', 'asset:fingal-ensuite-green-tiles.jpg', 'Glossy green finger tiles laid in a vertical stack across the shower walls and vanity splashback.', 'Bathroom Tiling', false, false, 'center', 9, 55),
  ('7433c292-35d6-4002-977a-54049a08ac16', '7499e6b7-6d9c-4926-a522-bac0081d25b9', 'asset:dava-bath.jpg', 'Large-format pale grey wall tiles create a simple grid around the bath.', 'Bathroom Tiling', false, false, 'center', 0, 56),
  ('82e92d3a-17c0-436b-931b-0bf8efecf56e', NULL, 'asset:bathroom-hero.jpg', 'Grey stone-look tiles paired with a green vertical-tile feature wall.', 'Bathroom Tiling', false, false, 'center', 0, 0),
  ('2341c957-212f-4b00-9fe1-f793b1ee2355', NULL, 'asset:splashback-herringbone.jpg', 'Soft grey herringbone with crisp white grout.', 'Splashback', false, false, 'center', 0, 1),
  ('7a3dc9c6-1377-41d5-8d13-d09b08ce35a6', NULL, 'asset:splashback-white-subway.jpg', 'Glossy white subway tiles with a hand-made ripple.', 'Splashback', false, false, 'center', 0, 2),
  ('11cd50be-2d38-450a-8ae8-a647f34eaf12', NULL, 'asset:splashback-herringbone-island.jpg', 'Ash herringbone tiles running to the window.', 'Splashback', false, false, 'center', 0, 3),
  ('5c46a73f-ded2-4ccb-8ff6-5e353e5f5df2', NULL, 'asset:splashback-green-pantry.jpg', 'Deep green tiles down a butler’s pantry.', 'Splashback', false, false, 'center', 0, 4),
  ('c5035903-e7df-4bb7-81cb-217cb6aa389a', NULL, 'asset:splashback-lady-nelson.jpg', 'Soft blue tiles with a gentle ripple.', 'Splashback', false, false, 'center', 0, 5),
  ('82d79522-07b6-42c2-902c-ae37415d70f3', NULL, 'asset:splashback-ivory-grid.jpg', 'Warm ivory tiles laid in a straight grid.', 'Splashback', false, false, 'center', 0, 6),
  ('45cdd117-8cf8-4d19-b8ca-c825ce122df1', NULL, 'asset:splashback-black-gloss.jpg', 'High-gloss black tiles under a skylight.', 'Splashback', false, false, 'center', 0, 7),
  ('785404f4-e1a4-428b-b780-45a3f693d90b', NULL, 'asset:kitchen-brick.jpg', 'Brick floor pavers laid in a running bond through the kitchen.', 'Floor Tiling', false, false, 'center', 0, 8),
  ('aed91d0f-9a7a-4120-af85-e3e6d4b2ba4f', NULL, 'asset:kitchen-island.jpg', 'Brick floor pavers with staggered joints across the kitchen and dining area.', 'Floor Tiling', false, false, 'center', 0, 9),
  ('59a10c12-3a2e-49e1-ae74-4893b280cd97', NULL, 'asset:bathroom-dual-vanity.jpg', 'Glossy black wall tiles above a band of large-format charcoal splashback tiles.', 'Bathroom Tiling', false, false, 'center', 0, 14),
  ('f53d9885-afe1-4fd0-928b-7cf73f29771e', NULL, 'asset:outdoors-1.jpg', 'Grey paving tiles laid in a straight grid beside the house.', 'Outdoors', false, false, 'center', 0, 15),
  ('09ec18d6-efbe-4495-b7ff-56bb83a39ef5', NULL, 'asset:outdoors-2.jpg', 'Dark-grey terrace tiles with a rain-wet surface highlighting their tonal variation.', 'Outdoors', false, false, 'center', 0, 16),
  ('963c2a57-646f-4e7c-ac15-ae67ae856d77', NULL, 'asset:outdoors-3.jpg', 'Light-beige poolside paving in a straight grid, with a linear drain.', 'Outdoors', false, false, 'center', 0, 17),
  ('4c391921-7067-424d-bad3-b950edb876d5', NULL, 'asset:outdoors-4.jpg', 'Neutral square patio tiles laid in a straight grid.', 'Outdoors', false, false, 'center', 0, 18),
  ('d76caf5b-9a4f-4595-bb39-010f3060ca98', NULL, 'asset:outdoors-5.jpg', 'Beige patio tiles with an integrated linear drain.', 'Outdoors', false, false, 'center', 0, 19),
  ('4d2f2ba1-7bb8-4000-8ac0-5b63a3e6c524', NULL, 'asset:outdoors-6.jpg', 'Cream travertine-style pavers laid in a French pattern.', 'Outdoors', false, true, 'center', 0, 20),
  ('592288b0-0438-4c3b-a512-45ddc17ce745', NULL, 'asset:outdoors-7-tiled.jpg', 'Charcoal entry steps laid in a running bond.', 'Outdoors', false, false, 'center', 0, 21),
  ('b3aafb25-b635-4ef8-8a92-c43ab56f5090', NULL, 'asset:outdoors-8.jpg', 'Grey stone-look paving under a covered patio.', 'Outdoors', false, false, 'center', 0, 22),
  ('1f9e1845-772c-4254-9a9d-b1ccdfe97298', NULL, 'asset:outdoors-9.jpg', 'Light-coloured entry tiles with a straight edge against the aggregate driveway.', 'Outdoors', false, false, 'center', 0, 23);
--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = 'f107a738-ab73-4db7-9e4b-50077f34725c' WHERE "id" = 'f508b4d2-8b06-4b6b-8ef1-2e5b6fc06ae2';--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = '4c3af825-5e31-4fe8-b076-2f0353f9ae8b' WHERE "id" = '7bec6ea4-37f7-4fc4-86cd-051badccd4be';--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = 'ec28dff1-75ef-48cc-988d-5f32e0997ac0' WHERE "id" = 'fc4aad06-743f-428a-ae73-34fbf16d19cb';--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = 'b4634469-e370-41f4-946a-566235677f0d' WHERE "id" = '986972c4-fcc3-4be2-863a-61c8d0978a04';--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = 'e936692e-e029-4a70-9cc8-4f73d9a5e905' WHERE "id" = '719f7860-5d9c-477a-a33a-d96d213afa80';--> statement-breakpoint
UPDATE "site_projects" SET "cover_photo_id" = '7433c292-35d6-4002-977a-54049a08ac16' WHERE "id" = '7499e6b7-6d9c-4926-a522-bac0081d25b9';
--> statement-breakpoint
INSERT INTO "site_faqs" ("id", "question", "answer", "sort_order") VALUES
  ('27e8be47-06dc-4d1a-9e3c-ae000e8ccafb', 'How do I get a quote?', 'Send an enquiry with your suburb, the type of tiling and a short description of your project. Include approximate dimensions if you have them. Shaun can discuss the details and the next steps with you.', 0),
  ('8e8f0df5-3c9d-4d2a-8854-0d5e23358976', 'Can I enquire before choosing my tiles?', 'Yes. You can start a conversation while you are still exploring ideas. Mention the look you have in mind and whether you have already selected any tiles.', 1),
  ('9d480ddb-2177-413d-970e-69e03e1c55d9', 'Do you cover my suburb?', 'Fyson Tiling is based on the Mornington Peninsula. Include your suburb in your enquiry so availability for your location can be confirmed.', 2),
  ('c0cd82c1-2b9d-4b99-a0df-cda7a43a7779', 'How much will my project cost?', 'Every space is different. Tile selection, area, layout and preparation all affect the scope. An individual quote is the best way to understand the cost of your project.', 3),
  ('03e54067-bd62-4119-a7b5-15fbf52f91e6', 'When can work start?', 'Timing depends on the project and current availability. Share your preferred dates in your enquiry; a start date can be discussed before you commit.', 4);
