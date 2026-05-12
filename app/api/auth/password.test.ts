import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the original password and rejects mismatches", async () => {
    const hash = await hashPassword("correct horse battery staple");

    expect(hash).toMatch(/^scrypt:/);
    expect(hash).not.toContain("correct horse");
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });

  it("rejects empty or unsupported hashes", async () => {
    await expect(verifyPassword("password", null)).resolves.toBe(false);
    await expect(verifyPassword("password", "bcrypt:legacy")).resolves.toBe(false);
  });
});
