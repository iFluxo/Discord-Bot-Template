FROM oven/bun:latest

RUN mkdir -p /home/bot
WORKDIR /home/bot

COPY package.json .

RUN bun install

COPY . .

RUN bun db:generate

CMD ["bun", "start"]