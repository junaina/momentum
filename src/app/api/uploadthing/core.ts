import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import * as authService from "@/server/services/auth.service";
import { SESSION_COOKIE_NAME } from "@/server/auth/session";

const f = createUploadthing();

/**
 * Read a cookie value from a standard Cookie header.
 * (No any/unknown — plain string parsing.)
 */
function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export const ourFileRouter = {
  avatar: f({
    image: {
      maxFileSize: "2MB", // free-tier friendly cap
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      // Authenticate upload using your session cookie
      const cookie = req.headers.get("cookie");
      const token = getCookieValue(cookie, SESSION_COOKIE_NAME);

      if (!token) throw new UploadThingError("Unauthorized");

      const user = await authService.getUserFromSessionToken(token);
      if (!user) throw new UploadThingError("Unauthorized");

      // Attach metadata for use in onUploadComplete if needed later
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // We’re NOT writing to DB here because your client already PATCHes /api/auth/me
      // But we return something useful if you want it.
      return { userId: metadata.userId, url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
