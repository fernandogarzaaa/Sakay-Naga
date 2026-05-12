import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createLocalUser, findUserByEmail, touchLastSignIn } from "./queries/users";
import { buildExpiredSessionCookie, buildSessionCookie } from "./auth/local";
import { verifyPassword } from "./auth/password";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { sanitizeForClient } from "./lib/sanitize";

const authInput = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const registerInput = authInput.extend({
  name: z.string().min(1).max(120).transform((value) => value.trim()),
});

export const authRouter = createRouter({
  register: publicQuery
    .input(registerInput)
    .mutation(async ({ ctx, input }) => {
      const existing = await findUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account already exists for this email.",
        });
      }

      const user = await createLocalUser(input);
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create account.",
        });
      }

      ctx.resHeaders.append(
        "set-cookie",
        await buildSessionCookie(ctx.req.headers, user.id),
      );
      return sanitizeForClient(user);
    }),
  login: publicQuery
    .input(authInput)
    .mutation(async ({ ctx, input }) => {
      const user = await findUserByEmail(input.email);
      const valid = await verifyPassword(input.password, user?.passwordHash ?? null);
      if (!user || !valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const updatedUser = await touchLastSignIn(user.id);
      ctx.resHeaders.append(
        "set-cookie",
        await buildSessionCookie(ctx.req.headers, user.id),
      );
      return sanitizeForClient(updatedUser ?? user);
    }),
  me: authedQuery.query((opts) => sanitizeForClient(opts.ctx.user)),
  logout: authedQuery.mutation(async ({ ctx }) => {
    ctx.resHeaders.append(
      "set-cookie",
      buildExpiredSessionCookie(ctx.req.headers),
    );
    return { success: true };
  }),
});
