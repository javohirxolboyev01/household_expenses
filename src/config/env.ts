import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN majburiy"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL majburiy"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment o'zgaruvchilari noto'g'ri:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
