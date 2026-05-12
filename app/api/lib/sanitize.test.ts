import { describe, expect, it } from "vitest";
import { sanitizeForClient } from "./sanitize";

describe("sanitizeForClient", () => {
  it("removes passwordHash recursively without damaging dates", () => {
    const now = new Date();
    const output = sanitizeForClient({
      id: 1,
      passwordHash: "secret",
      createdAt: now,
      reports: [
        {
          user: {
            email: "user@example.com",
            passwordHash: "nested-secret",
          },
        },
      ],
    });

    expect(output).toEqual({
      id: 1,
      createdAt: now,
      reports: [
        {
          user: {
            email: "user@example.com",
          },
        },
      ],
    });
  });
});
