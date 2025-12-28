import { hashPassword, verifyPassword } from "@/server/auth/password";
import { randomBytes } from "crypto";
import { hashIp } from "@/server/auth/ip-hash";
import * as usersRepo from "@/server/repos/users.repo";
import * as sessionsRepo from "@/server/repos/sessions.repo";
import * as authAttemptsRepo from "@/server/repos/auth-attempts.repo";
import { SignupBody, LoginBody } from "@/server/validators/auth.zod";

export class SignupConflictError extends Error {
  constructor(public field: "email" | "username", message: string) {
    super(message);
  }
}
export class AuthInvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email/username or password.");
  }
}
export class AuthRateLimitedError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Too many incorrect attempts. Try again in a bit.");
  }
}
const SESSION_TTL_DAYS = 30;
//rate limits
const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX_FAILURES = 10;
const LOGIN_BLOCK_SECONDS = 10 * 60;

function generateSessionToken(): string {
  // 64 hex chars, strong enough for session tokens
  return randomBytes(32).toString("hex");
}

export async function signup(input: SignupBody) {
  const existingEmail = await usersRepo.findUserByEmail(
    input.email.toLowerCase()
  );
  if (existingEmail) {
    throw new SignupConflictError("email", "That email is already in use.");
  }

  const existingUsername = await usersRepo.findUserByUsername(
    input.username.toLowerCase()
  );
  if (existingUsername) {
    throw new SignupConflictError("username", "That username is taken.");
  }

  const passwordHash = await hashPassword(input.password);

  return usersRepo.createUser({
    email: input.email.toLowerCase(),
    username: input.username.toLowerCase(),
    name: input.name,
    passwordHash,
  });
}
// NEW: login
export async function login(input: LoginBody & { ip?: string | null }) {
  const now = new Date();
  const identifier = input.identifier.trim().toLowerCase();

  // Rate limit by IP hash (best-effort “browser-ish”)
  const ipHash = input.ip ? hashIp(input.ip) : undefined;
  if (ipHash) {
    const since = new Date(now.getTime() - LOGIN_WINDOW_MINUTES * 60 * 1000);
    const failures = await authAttemptsRepo.countRecentFailures({
      ipHash,
      since,
    });
    if (failures >= LOGIN_MAX_FAILURES) {
      throw new AuthRateLimitedError(LOGIN_BLOCK_SECONDS);
    }
  }

  const user = await usersRepo.findUserForLogin(identifier);

  // Don’t leak whether account exists
  const ok = user?.passwordHash
    ? await verifyPassword(input.password, user.passwordHash)
    : false;

  if (!user || !ok) {
    await authAttemptsRepo.recordAuthAttempt({
      email: identifier.includes("@") ? identifier : undefined,
      ipHash,
      success: false,
      failureReason: "invalid_credentials",
    });
    throw new AuthInvalidCredentialsError();
  }

  await authAttemptsRepo.recordAuthAttempt({
    email: user.email,
    ipHash,
    success: true,
  });

  const sessionToken = generateSessionToken();
  const expires = new Date(
    now.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  await sessionsRepo.createSession({
    userId: user.id,
    sessionToken,
    expires,
  });

  // Only return safe fields
  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    },
    sessionToken,
    expires,
  };
}

// logout
export async function logout(sessionToken: string | null | undefined) {
  if (!sessionToken) return;
  await sessionsRepo.deleteSessionByToken(sessionToken);
}

// used by /me and requireSessionUser()
export async function getUserFromSessionToken(sessionToken: string) {
  const session = await sessionsRepo.findSessionByToken(sessionToken);
  if (!session) return null;

  // If expired: kill it (keeps DB clean)
  if (session.expires <= new Date()) {
    await sessionsRepo.deleteSessionByToken(sessionToken);
    return null;
  }

  return usersRepo.findUserByIdSafe(session.userId);
}
