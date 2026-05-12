import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";
import { hashPassword } from "../auth/password";

function localUnionId(email: string) {
  return `local:${email.trim().toLowerCase()}`;
}

export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email.trim().toLowerCase()))
    .limit(1);
  return rows.at(0);
}

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function createLocalUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const email = data.email.trim().toLowerCase();
  const passwordHash = await hashPassword(data.password);
  const role = email === env.adminEmail ? "admin" : "user";

  const [{ id }] = await getDb()
    .insert(schema.users)
    .values({
      unionId: localUnionId(email),
      name: data.name.trim(),
      email,
      passwordHash,
      role,
      lastSignInAt: new Date(),
    })
    .$returningId();

  return findUserById(id);
}

export async function touchLastSignIn(userId: number) {
  await getDb()
    .update(schema.users)
    .set({ lastSignInAt: new Date() })
    .where(eq(schema.users.id, userId));
  return findUserById(userId);
}
