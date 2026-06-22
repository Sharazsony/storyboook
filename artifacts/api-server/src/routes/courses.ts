import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, eventsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { createOAuth2Client } from "../lib/google";
import { extractEventsFromText } from "../lib/groq";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const EVENT_EMOJI: Record<string, string> = {
  quiz: "📝",
  exam: "📚",
  viva: "🎤",
  assignment: "📋",
  presentation: "🖥️",
  other: "📌",
};

const EVENT_COLOR_ID: Record<string, string> = {
  quiz: "5",
  exam: "11",
  viva: "3",
  assignment: "2",
  presentation: "6",
  other: "7",
};

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
          pageSize: 30,
          orderBy: "updateTime desc",
        });
        const announcements = announcementsData.announcements ?? [];
        announcementsFound += announcements.length;

        for (const ann of announcements) {
          if (!ann.text || !ann.id) continue;

          const announcementDate = ann.creationTime
            ? new Date(ann.creationTime).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10);

          const extractedEvents = await extractEventsFromText(ann.text, announcementDate);

          for (const extracted of extractedEvents) {
            const existing = await db
              .select()
              .from(eventsTable)
              .where(
                and(
                  eq(eventsTable.userId, user.id),
                  eq(eventsTable.announcementId, ann.id),
                  eq(eventsTable.eventType, extracted.event_type)
                )
              );

            if (existing.length > 0) continue;

            const [newEvent] = await db
              .insert(eventsTable)
              .values({
                userId: user.id,
                courseId: course.id,
                courseName: course.name ?? "Unknown Course",
                eventType: extracted.event_type,
                eventDate: extracted.date,
                rawText: extracted.title
                  ? `${extracted.title}\n\n${ann.text.slice(0, 900)}`
                  : ann.text.slice(0, 1000),
                confidence: extracted.confidence,
                announcementId: ann.id,
              })
              .returning();

            eventsExtracted++;

            if (extracted.date && newEvent) {
              try {
                const emoji = EVENT_EMOJI[extracted.event_type] ?? "📌";
                const colorId = EVENT_COLOR_ID[extracted.event_type] ?? "7";
                const title = extracted.title || (course.name ?? "Unknown Course");

                const calEvent = await calendar.events.insert({
                  calendarId: "primary",
                  requestBody: {
                    summary: `${emoji} ${title} — ${course.name}`,
                    description: ann.text.slice(0, 500),
                    colorId,
                    start: { date: extracted.date },
                    end: { date: extracted.date },
                    reminders: {
                      useDefault: false,
                      overrides: [
                        { method: "popup", minutes: 24 * 60 },
                        { method: "popup", minutes: 60 },
                      ],
                    },
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
