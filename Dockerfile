FROM node:16 AS builder

COPY . .

RUN yarn
RUN yarn run build


EXPOSE 3000
CMD yarn db-push --accept-data-loss && yarn db-gen && yarn run start:prod
