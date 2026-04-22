import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const email = "clare@admin.co";
const password = "123456";

const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (existing.length) {
  console.log(`Admin user already exists: ${email}`);
} else {
  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    name: "Clare",
    passwordHash,
    role: "ADMIN",
  });
  console.log(`Admin user created: ${email} / ${password}`);
}
process.exit(0);
