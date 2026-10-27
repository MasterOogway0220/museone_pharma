import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { db, schema } from "@/db";

const STAFF_LOGIN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]\.[a-z0-9_]{3,30}$/;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "mysql", schema }),
  // Accounts are created only by the super admin (src/lib/users.ts), never by public signup.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60 },
  rateLimit: { enabled: true, window: 60, max: 20 },
  user: {
    additionalFields: {
      tenantId: { type: "string", required: false, input: false },
      role: { type: "string", required: true, defaultValue: "cashier", input: false },
      permProducts: { type: "boolean", required: true, defaultValue: false, input: false },
      permCategories: { type: "boolean", required: true, defaultValue: false, input: false },
      permTransactions: { type: "boolean", required: true, defaultValue: false, input: false },
      permUsers: { type: "boolean", required: true, defaultValue: false, input: false },
      permSettings: { type: "boolean", required: true, defaultValue: false, input: false },
    },
  },
  plugins: [
    // Stored logins are "<slug>.<username>" (see staffUsername); slugs may contain hyphens.
    username({ maxUsernameLength: 80, usernameValidator: (u) => STAFF_LOGIN.test(u) }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
