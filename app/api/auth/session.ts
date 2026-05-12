import * as jose from "jose";
import { env } from "../lib/env";

const JWT_ALG = "HS256";

export type SessionPayload = {
  userId: number;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.appSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30 days")
    .sign(secret);
}

export const buildSessionToken = signSessionToken;

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(env.appSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });

    const userId = Number(payload.userId);
    if (!Number.isInteger(userId)) return null;
    return { userId };
  } catch {
    return null;
  }
}
