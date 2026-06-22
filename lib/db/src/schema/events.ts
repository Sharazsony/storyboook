import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  courseId: text("course_id").notNull(),
  courseName: text("course_name").notNull(),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date"),
  rawText: text("raw_text").notNull(),
  confidence: real("confidence").notNull().default(0),
  calendarEventId: text("calendar_event_id"),
  announcementId: text("announcement_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
