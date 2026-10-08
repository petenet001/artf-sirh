# Étape 1 : build
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

COPY . ./

ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build

# Étape 2 : exécution
FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/.output/ ./

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]