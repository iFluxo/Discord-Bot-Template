FROM oven/bun:latest

COPY package.json .

RUN bun install

COPY . .

CMD ["bun", "start"]