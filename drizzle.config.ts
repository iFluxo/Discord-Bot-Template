import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./app/database/drizzle.schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: Bun.env.TursoUrl,
        authToken: Bun.env.TursoAuthToken,
    },
});
