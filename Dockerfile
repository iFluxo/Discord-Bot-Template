FROM oven/bun:latest

COPY package.json .

RUN bun install

COPY . .

RUN bun db:generate

CMD ["bun", "start"]