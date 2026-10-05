import { defineConfig } from "drizzle-kit";

// `process.env` is used instead of `Bun.env` so this config also works when
// drizzle-kit is executed by Node.js instead of Bun.
const env = process.env;

export default defineConfig({
    schema: "./app/database/drizzle.schema.ts",
    out: "./drizzle",
    dialect: "turso",
    dbCredentials: {
        url: env.TursoUrl,
        authToken: env.TursoAuthToken,
    },
});
