import { pgTable, uuid, text, timestamp, check } from "drizzle-orm/pg-core";
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
