import "server-only";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().startsWith("mongodb"),
  MONGODB_DB: z.string().min(1).default("sakr"),
  AUTH_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Validated server-side environment. Throws a readable error if anything is missing. */
export function env(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}\nSee .env.example`);
  }
  cached = parsed.data;
  return cached;
}
