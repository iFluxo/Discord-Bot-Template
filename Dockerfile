FROM oven/bun:latest

COPY package.json .

RUN bun install

COPY . .

RUN bunx drizzle-kit generate
RUN bunx drizzle-kit migrate

CMD ["bun", "start"]