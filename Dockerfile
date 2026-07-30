# --- Dependencies (full, für den Next.js-Build) ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Production-only Dependencies (für die Laufzeit, inkl. vollständiger Prisma-CLI) ---
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# --- Build ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# Vollständige, konsistent generierte node_modules (inkl. kompletter Prisma-CLI
# mit allen WASM-Dateien) überschreiben die von Next.js "standalone" getracte,
# minimale node_modules-Kopie - das vermeidet fehlende Dateien beim CLI-Aufruf.
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
