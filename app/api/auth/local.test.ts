import { beforeEach, describe, expect, it, vi } from "vitest";
import { Session } from "@contracts/constants";
import { authenticateRequest, buildExpiredSessionCookie, buildSessionCookie } from "./local";
import { buildSessionToken } from "./session";
import { findUserById } from "../queries/users";

vi.mock("../queries/users", () => ({
  findUserById: vi.fn(),
}));

const user = {
  id: 42,
  unionId: "local:test@example.com",
  name: "Test User",
  email: "test@example.com",
  passwordHash: "redacted",
  avatar: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignInAt: new Date(),
};

describe("local auth sessions", () => {
  beforeEach(() => {
    vi.mocked(findUserById).mockReset();
  });

  it("authenticates bearer tokens for mobile clients", async () => {
    vi.mocked(findUserById).mockResolvedValue(user);
    const token = await buildSessionToken({ userId: user.id });
    const headers = new Headers({ authorization: `Bearer ${token}` });

    await expect(authenticateRequest(headers)).resolves.toEqual(user);
    expect(findUserById).toHaveBeenCalledWith(user.id);
  });

  it("authenticates httpOnly session cookies for web clients", async () => {
    vi.mocked(findUserById).mockResolvedValue(user);
    const cookie = await buildSessionCookie(new Headers({ host: "localhost:3000" }), user.id);
    const headers = new Headers({ cookie });

    await expect(authenticateRequest(headers)).resolves.toEqual(user);
    expect(cookie).toContain(`${Session.cookieName}=`);
    expect(cookie).toContain("HttpOnly");
  });

  it("builds an expired cookie for logout", () => {
    const cookie = buildExpiredSessionCookie(new Headers({ host: "localhost:3000" }));

    expect(cookie).toContain(`${Session.cookieName}=`);
    expect(cookie).toContain("Max-Age=0");
  });
});
