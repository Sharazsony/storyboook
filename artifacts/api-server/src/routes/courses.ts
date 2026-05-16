import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, eventsTable } from "@workspace/db";
import { eq, and, gt, isNotNull } from "drizzle-orm";
import { google } from "googleapis";
import { createOAuth2Client } from "../lib/google";
import { extractEventFromText } from "../lib/groq";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getAuthClientForUser(user: typeof usersTable.$inferSelect) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.accessToken ?? undefined,
    refresh_token: user.refreshToken ?? undefined,
    expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
  });
  return oauth2Client;
}

router.get("/courses", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const authClient = getAuthClientForUser(user);
    const classroom = google.classroom({ version: "v1", auth: authClient });
    const { data } = await classroom.courses.list({ courseStates: ["ACTIVE"] });
    const courses = (data.courses ?? []).map((c) => ({
      id: c.id ?? "",
      name: c.name ?? "",
      section: c.section ?? null,
      room: c.room ?? null,
    }));
    res.json(courses);
  } catch (err) {
    logger.error({ err }, "Failed to list courses");
    res.status(500).json({ error: "Failed to fetch courses from Google Classroom" });
  }
});

router.post("/courses/sync", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const authClient = getAuthClientForUser(user);
    const classroom = google.classroom({ version: "v1", auth: authClient });
    const calendar = google.calendar({ version: "v3", auth: authClient });

    const { data: coursesData } = await classroom.courses.list({ courseStates: ["ACTIVE"] });
    const courses = coursesData.courses ?? [];

    let announcementsFound = 0;
    let eventsExtracted = 0;
    let calendarSynced = 0;

    for (const course of courses) {
      if (!course.id) continue;

      try {
        const { data: announcementsData } = await classroom.courses.announcements.list({
          courseId: course.id,
          pageSize: 20,
          orderBy: "updateTime desc",
        });
        const announcements = announcementsData.announcements ?? [];
        announcementsFound += announcements.length;

        for (const ann of announcements) {
          if (!ann.text || !ann.id) continue;

          // Check if already processed
          const existing = await db
            .select()
            .from(eventsTable)
            .where(
              and(
                eq(eventsTable.userId, user.id),
                eq(eventsTable.announcementId, ann.id)
              )
            );

          if (existing.length > 0) continue;

          const extracted = await extractEventFromText(ann.text);
          if (!extracted || extracted.confidence < 0.4) continue;

          const [newEvent] = await db
            .insert(eventsTable)
            .values({
              userId: user.id,
              courseId: course.id,
              courseName: course.name ?? "Unknown Course",
              eventType: extracted.event_type,
              eventDate: extracted.date,
              rawText: ann.text.slice(0, 1000),
              confidence: extracted.confidence,
              announcementId: ann.id,
            })
            .returning();

          eventsExtracted++;

          // Auto-sync to calendar if date is available
          if (extracted.date && newEvent) {
            try {
              const calEvent = await calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                  summary: `${extracted.event_type.charAt(0).toUpperCase() + extracted.event_type.slice(1)} — ${course.name}`,
                  description: ann.text.slice(0, 500),
                  start: { date: extracted.date },
                  end: { date: extracted.date },
                },
              });

              await db
                .update(eventsTable)
                .set({ calendarEventId: calEvent.data.id ?? null })
                .where(eq(eventsTable.id, newEvent.id));

              calendarSynced++;
            } catch (calErr) {
              logger.warn({ calErr }, "Failed to sync event to calendar");
            }
          }
        }
      } catch (courseErr) {
        logger.warn({ courseErr, courseId: course.id }, "Failed to process course");
      }
    }

    res.json({
      coursesProcessed: courses.length,
      announcementsFound,
      eventsExtracted,
      calendarSynced,
    });
  } catch (err) {
    logger.error({ err }, "Sync failed");
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
