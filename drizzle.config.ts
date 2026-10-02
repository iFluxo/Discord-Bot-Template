import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./app/database/drizzle.schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: process.env.TursoUrl!,
        authToken: process.env.TursoAuthToken!,
    },
});