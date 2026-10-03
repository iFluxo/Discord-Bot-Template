FROM oven/bun:latest

RUN mkdir -p /home/discord
WORKDIR /home/discord

COPY package.json .

RUN bun install

COPY . .

CMD ["bun", "start"]