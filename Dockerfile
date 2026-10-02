FROM oven/bun:latest

COPY package.json .

RUN bun install

COPY . .

RUN bunx drizzle-kit generate

CMD ["bun", "start"]