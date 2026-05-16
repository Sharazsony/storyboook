import { Router, type IRouter, type Response } from "express";
import { db, eventsTable, usersTable } from "@workspace/db";
import { eq, and, gte, isNotNull, sql } from "drizzle-orm";
import { google } from "googleapis";
import { createOAuth2Client } from "../lib/google";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";
import {
  ListEventsQueryParams,
  DeleteEventParams,
  SyncEventToCalendarParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const parsed = ListEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    let query = db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, user.id))
      .$dynamic();

    const conditions = [eq(eventsTable.userId, user.id)];
    if (parsed.data.event_type) {
      conditions.push(eq(eventsTable.eventType, parsed.data.event_type));
    }
    if (parsed.data.course_id) {
      conditions.push(eq(eventsTable.courseId, parsed.data.course_id));
    }

    const events = await db
      .select()
      .from(eventsTable)
      .where(and(...conditions))
      .orderBy(sql`${eventsTable.eventDate} ASC NULLS LAST, ${eventsTable.createdAt} DESC`);

    res.json(
      events.map((e) => ({
        ...e,
        eventDate: e.eventDate ?? null,
        calendarEventId: e.calendarEventId ?? null,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    logger.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.get("/events/upcoming", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const today = new Date().toISOString().slice(0, 10);
  const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    const events = await db
      .select()
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.userId, user.id),
          isNotNull(eventsTable.eventDate),
          gte(eventsTable.eventDate, today),
          sql`${eventsTable.eventDate} <= ${twoWeeks}`
        )
      )
      .orderBy(eventsTable.eventDate);

    res.json(
      events.map((e) => ({
        ...e,
        eventDate: e.eventDate ?? null,
        calendarEventId: e.calendarEventId ?? null,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    logger.error({ err }, "Failed to fetch upcoming events");
    res.status(500).json({ error: "Failed to fetch upcoming events" });
  }
});

router.get("/events/summary", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  try {
    const allEvents = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.userId, user.id));

    const byTypeCounts: Record<string, number> = {};
    let withDates = 0;

    for (const event of allEvents) {
      byTypeCounts[event.eventType] = (byTypeCounts[event.eventType] ?? 0) + 1;
      if (event.eventDate) withDates++;
    }

    const byType = Object.entries(byTypeCounts).map(([eventType, count]) => ({
      eventType,
      count,
    }));

    res.json({
      total: allEvents.length,
      byType,
      withDates,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch summary");
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

router.delete("/events/:id", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteEventParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [deleted] = await db
      .delete(eventsTable)
      .where(and(eq(eventsTable.id, params.data.id), eq(eventsTable.userId, user.id)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    res.sendStatus(204);
  } catch (err) {
    logger.error({ err }, "Failed to delete event");
    res.status(500).json({ error: "Failed to delete event" });
  }
});

router.post("/events/:id/calendar", requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SyncEventToCalendarParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const [event] = await db
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, params.data.id), eq(eventsTable.userId, user.id)));

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: user.accessToken ?? undefined,
      refresh_token: user.refreshToken ?? undefined,
      expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
    });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const eventDate = event.eventDate ?? new Date().toISOString().slice(0, 10);
    const calEvent = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `${event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)} — ${event.courseName}`,
        description: event.rawText,
        start: { date: eventDate },
        end: { date: eventDate },
      },
    });

    const calendarEventId = calEvent.data.id ?? "";
    await db
      .update(eventsTable)
      .set({ calendarEventId })
      .where(eq(eventsTable.id, event.id));

    res.json({ success: true, calendarEventId });
  } catch (err) {
    logger.error({ err }, "Failed to sync to calendar");
    res.status(500).json({ error: "Failed to sync to Google Calendar" });
  }
});

export default router;
