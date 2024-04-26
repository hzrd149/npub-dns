# syntax=docker/dockerfile:1
FROM node:20.11 as builder

WORKDIR /app
ENV NODE_ENV=development
COPY ./package*.json .
COPY ./yarn.lock .
COPY . .
RUN yarn install
RUN yarn build

FROM node:20.11

WORKDIR /app
ENV NODE_ENV=production
COPY ./package*.json .
COPY ./yarn.lock .
RUN yarn install
COPY --from=builder ./app/dist ./dist

EXPOSE 10053

ENV HOST="0.0.0.0"
ENV PORT="10053"

ENTRYPOINT [ "node", "." ]
