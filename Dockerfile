FROM oven/bun:latest

COPY package.json .

RUN bun install

COPY . .

RUN bunx db:generate

CMD ["bun", "start"]