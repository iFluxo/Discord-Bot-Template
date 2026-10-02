FROM oven/bun:latest

COPY package.json .
RUN bun install
COPY . .

RUN bunx tsc --noEmit

CMD ["bun", "run", "start"]