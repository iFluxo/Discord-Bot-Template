FROM oven/bun:latest

RUN mkdir -p /Aoka
WORKDIR /Aoka

COPY package.json .
RUN bun install
COPY . .

CMD ["bun", "run", "start"]