import {
  pgTable,
  uuid,
  text,
  timestamp,
  check,
  integer,
  boolean,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const projectEnquiries = pgTable(
  "project_enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    suburb: text("suburb").notNull(),
    service: text("service").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "project_enquiries_service_check",
      sql`${table.service} IN (
        'Bathroom tiling',
        'Kitchens & splashbacks',
        'Wall & floor tiling',
        'Something else'
      )`,
    ),
    check(
      "project_enquiries_status_check",
      sql`${table.status} IN ('new', 'contacted', 'done')`,
    ),
  ],
);

// Website content Shaun edits from /admin. Row-level security, grants, the photo
// storage bucket and the seed of the existing site content live in the migration SQL.

export const siteProjects = pgTable("site_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  publication: text("publication").notNull().default(""),
  intro: text("intro").notNull().default(""),
  coverPhotoId: uuid("cover_photo_id").references((): AnyPgColumn => sitePhotos.id, {
    onDelete: "set null",
  }),
  coverFocus: text("cover_focus").notNull().default("center"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// A photo belongs to a project, the inspiration gallery (category set), or both.
// src is "asset:<file>" for photos bundled with the site, "storage:<path>" for uploads.
export const sitePhotos = pgTable(
  "site_photos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => siteProjects.id, { onDelete: "cascade" }),
    src: text("src").notNull(),
    caption: text("caption").notNull().default(""),
    category: text("category"),
    magazinePage: boolean("magazine_page").notNull().default(false),
    categoryCover: boolean("category_cover").notNull().default(false),
    focus: text("focus").notNull().default("center"),
    sortOrder: integer("sort_order").notNull().default(0),
    galleryOrder: integer("gallery_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("site_photos_project_idx").on(table.projectId, table.sortOrder)],
);

export const siteFaqs = pgTable("site_faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Overrides for the page text defaults in src/lib/site-text.ts; no row means the default shows.
export const siteText = pgTable("site_text", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
