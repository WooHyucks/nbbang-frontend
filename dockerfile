FROM node:20-bullseye-slim as build-stage

COPY package.json .
COPY package-lock.json .

RUN npm ci --omit=dev

COPY . .

RUN npm run build

#=======================================

FROM node:20-bullseye-slim

RUN npm install -g serve

COPY --from=build-stage /build .

ENTRYPOINT ["serve", "-s", ".","-l","3000"]
CMD []

