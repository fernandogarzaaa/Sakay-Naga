import * as cookie from "cookie";
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { getSessionCookieOptions } from "../lib/cookies";
import { findUserById } from "../queries/users";
import { signSessionToken, verifySessionToken } from "./session";

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const authHeader = headers.get("authorization") || "";
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  const token = bearerToken || cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const user = await findUserById(claim.userId);
  if (!user) {
    throw Errors.forbidden("User not found. Please sign in again.");
  }
  return user;
}

export async function setSessionCookie(c: Context, userId: number) {
  const token = await signSessionToken({ userId });
  const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
  setCookie(c, Session.cookieName, token, {
    ...cookieOpts,
    maxAge: Session.maxAgeMs / 1000,
  });
}

export async function buildSessionCookie(headers: Headers, userId: number) {
  const token = await signSessionToken({ userId });
  const opts = getSessionCookieOptions(headers);
  return cookie.serialize(Session.cookieName, token, {
    httpOnly: opts.httpOnly,
    path: opts.path,
    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
    secure: opts.secure,
    maxAge: Session.maxAgeMs / 1000,
  });
}

export function buildExpiredSessionCookie(headers: Headers) {
  const opts = getSessionCookieOptions(headers);
  return cookie.serialize(Session.cookieName, "", {
    httpOnly: opts.httpOnly,
    path: opts.path,
    sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
    secure: opts.secure,
    maxAge: 0,
  });
}
