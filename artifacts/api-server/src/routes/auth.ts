import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { createOAuth2Client, SCOPES } from "../lib/google";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/auth/debug-redirect", (_req: Request, res: Response): void => {
  try {
    const oauth2Client = createOAuth2Client();
    const redirectUri = (oauth2Client as unknown as { redirectUri: string }).redirectUri;
    const envVar = process.env["GOOGLE_REDIRECT_URI"];
    const allKeys = Object.keys(oauth2Client);
    res.json({ 
      redirectUri,
      envVar,
      oauth2ClientKeys: allKeys,
      clientId: process.env["GOOGLE_CLIENT_ID"],
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/auth/google", (_req: Request, res: Response): void => {
  try {
    const oauth2Client = createOAuth2Client();
    const redirectUri = (oauth2Client as unknown as { redirectUri: string }).redirectUri;
    logger.info({ redirectUri }, "OAuth redirect URI being used");
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      prompt: "select_account consent",
    });
    res.redirect(authUrl);
  } catch (err) {
    logger.error({ err }, "Failed to generate auth URL");
    res.status(500).json({ error: "OAuth configuration error" });
  }
});

router.get("/auth/google/callback", async (req: Request, res: Response): Promise<void> => {
  const { code, error } = req.query as { code?: string; error?: string };
  const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";

  if (error) {
    req.log.warn({ error }, "OAuth error from Google");
    res.redirect(`${frontendUrl}/?auth_error=access_denied`);
    return;
  }

  if (!code) {
    res.redirect(`${frontendUrl}/?auth_error=no_code`);
    return;
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email || !profile.id) {
      res.redirect(`${frontendUrl}/?auth_error=no_profile`);
      return;
    }

    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.googleId, profile.id));

    let user: typeof usersTable.$inferSelect;

    if (existing.length > 0) {
      const [updated] = await db
        .update(usersTable)
        .set({
          name: profile.name ?? existing[0]!.name,
          picture: profile.picture ?? null,
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? existing[0]!.refreshToken,
          tokenExpiry,
        })
        .where(eq(usersTable.googleId, profile.id))
        .returning();
      user = updated!;
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({
          email: profile.email,
          name: profile.name ?? profile.email,
          picture: profile.picture ?? null,
          googleId: profile.id,
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiry,
        })
        .returning();
      user = created!;
    }

    (req.session as { userId?: number }).userId = user.id;
    req.log.info({ userId: user.id }, "User authenticated");
    
    // Redirect to frontend - use environment variable or localhost:3000 for development
    const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
    res.redirect(`${frontendUrl}/`);
  } catch (err) {
    logger.error({ err }, "OAuth callback error");
    const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
    res.redirect(`${frontendUrl}/?auth_error=callback_failed`);
  }
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      logger.error({ err }, "Session destroy error");
    }
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const userId = (req.session as { userId?: number }).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch user");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
