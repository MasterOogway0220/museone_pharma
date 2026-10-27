// Creates the first super admin from SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD. Safe to re-run.
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSuperAdmin } from "@/lib/users";

const email = process.env.SUPERADMIN_EMAIL?.toLowerCase();
const password = process.env.SUPERADMIN_PASSWORD;
if (!email || !password || password.length < 12) {
  console.error("Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD (12+ chars) in .env");
  process.exit(1);
}

const existing = await db.select().from(schema.user).where(eq(schema.user.email, email));
if (existing.length) {
  console.log(`Super admin ${email} already exists.`);
} else {
  await createSuperAdmin(email, password);
  console.log(`Created super admin ${email}.`);
}
process.exit(0);
