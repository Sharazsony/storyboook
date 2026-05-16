import { google } from "googleapis";

export function createOAuth2Client() {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
  const redirectUri = process.env["GOOGLE_REDIRECT_URI"] ?? getDefaultRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getDefaultRedirectUri(): string {
  const domains = process.env["REPLIT_DOMAINS"];
  if (domains) {
    const primary = domains.split(",")[0]!.trim();
    return `https://${primary}/api/auth/google/callback`;
  }
  const devDomain = process.env["REPLIT_DEV_DOMAIN"];
  if (devDomain) {
    return `https://${devDomain}/api/auth/google/callback`;
  }
  return "http://localhost:3000/api/auth/google/callback";
}

export const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/calendar",
];
