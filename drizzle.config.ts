import type { Config } from "drizzle-kit";

export default {
    schema: "./app/database/drizzle.schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: Bun.env.TursoUrl!,
        authToken: Bun.env.TursoAuthToken!,
    },
} satisfies Config;