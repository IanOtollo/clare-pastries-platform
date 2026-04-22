import { db, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const email = "clare@admin.co";
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) {
    console.log("Admin user already exists:", email);
    return;
  }
  const passwordHash = await bcrypt.hash("123456", 10);
  await db.insert(users).values({
    email,
    name: "Clare",
    passwordHash,
    role: "ADMIN",
  });
  console.log("Admin user created:", email, "/ 123456");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
