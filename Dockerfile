# ══════════════════════════════════════════════════════════════════════════════
# Dockerfile — Karang Taruna Mojosongo
# ──────────────────────────────────────────────────────────────────────────────
# Build image (jalankan dari root project):
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://ktimojosongo.my.id/api \
#     --build-arg NEXT_PUBLIC_S3_API_URL=https://s3-api.mediatamaedu.com/api/v1 \
#     --build-arg NEXT_PUBLIC_S3_API_KEY=55f95e7379805f3e2ccbea368cb683382f6275076557100b0532631eab7a6d59 \
#     -t delandapp/karang_taruna:latest .
#
# Push ke Docker Hub:
#   docker push delandapp/karang_taruna:latest
# ══════════════════════════════════════════════════════════════════════════════


# ── Stage 1: Full deps (dev + prod) — hanya untuk build ───────────────────────
# Stage ini TIDAK masuk ke image final. Hanya dipakai oleh builder.
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# Install semua dependency (termasuk devDeps: TypeScript, ESLint, Vitest, dll.)
# Diperlukan agar next build & prisma generate bisa berjalan.
RUN npm ci --include=dev


# ── Stage 2: Production-only deps — untuk runner (jauh lebih kecil) ───────────
# Tidak ada TypeScript, ESLint, Vitest, @tailwindcss/oxide, dll.
# Ukuran node_modules turun drastis → image final lebih kecil & export lebih cepat.
FROM node:22-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# Hanya install production dependencies
RUN npm ci --omit=dev

# tsx tidak ada di package.json tapi dibutuhkan entrypoint untuk menjalankan
# prisma/seed.ts saat container startup. Install secara eksplisit tanpa menyentuh lockfile.
RUN npm install --no-save tsx


# ── Stage 3: Build Next.js application ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Gunakan full deps dari stage 1
COPY --from=deps /app/node_modules ./node_modules

# Salin seluruh source code
COPY . .

# ── NEXT_PUBLIC_* WAJIB ada saat BUILD TIME ───────────────────────────────────
# Variabel ini "di-bake" ke dalam JavaScript bundle oleh Next.js.
# Default value = nilai production dari .env.production
ARG NEXT_PUBLIC_API_URL=https://ktimojosongo.my.id/api
ARG NEXT_PUBLIC_S3_API_URL=https://s3-api.mediatamaedu.com/api/v1
ARG NEXT_PUBLIC_S3_API_KEY=55f95e7379805f3e2ccbea368cb683382f6275076557100b0532631eab7a6d59

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_S3_API_URL=$NEXT_PUBLIC_S3_API_URL
ENV NEXT_PUBLIC_S3_API_KEY=$NEXT_PUBLIC_S3_API_KEY

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client ke dalam node_modules/.prisma/client/
# File ini yang akan di-overlay ke runner di atas prod-deps node_modules
RUN node_modules/.bin/prisma generate

# Build Next.js production bundle (tanpa dotenv-cli wrapper)
RUN node_modules/.bin/next build


# ── Stage 4: Production runner ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Buat user non-root SEBELUM COPY agar bisa pakai --chown langsung.
# Menghindari "chown -R" yang sangat lambat pada ribuan file node_modules.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Default PORT sesuai .env.production
ENV PORT=4070
# Tambahkan node_modules/.bin ke PATH agar prisma, tsx, next
# bisa dipanggil langsung tanpa npx
ENV PATH="/app/node_modules/.bin:$PATH"

# ── Next.js runtime files ──────────────────────────────────────────────────────
COPY --chown=nextjs:nodejs --from=builder /app/public           ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next            ./.next
COPY --chown=nextjs:nodejs --from=builder /app/next.config.ts   ./next.config.ts
COPY --chown=nextjs:nodejs --from=builder /app/tsconfig.json    ./tsconfig.json
COPY --chown=nextjs:nodejs --from=builder /app/package.json     ./package.json

# ── Prisma: schema, migrations, config, seed ───────────────────────────────────
COPY --chown=nextjs:nodejs --from=builder /app/prisma           ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/prisma.config.ts ./prisma.config.ts

# ── Lib (dibutuhkan seed.ts: elasticsearch, redis, dll.) ───────────────────────
COPY --chown=nextjs:nodejs --from=builder /app/lib              ./lib

# ── Data JSON untuk seed (kategori sponsor, perusahaan, dll.) ──────────────────
COPY --chown=nextjs:nodejs --from=builder /app/documentation/data_json ./documentation/data_json

# ── node_modules: production-only (jauh lebih kecil dari full deps) ───────────
# prod-deps: ~300-500MB vs full deps: ~2GB
COPY --chown=nextjs:nodejs --from=prod-deps /app/node_modules   ./node_modules

# Overlay hanya .prisma/client dari builder (hasil "prisma generate").
# prod-deps tidak punya .prisma/client karena generate tidak dijalankan di sana.
COPY --chown=nextjs:nodejs --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ── Entrypoint script ──────────────────────────────────────────────────────────
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
# Hapus Windows-style CRLF (\r\n) agar sh di Alpine tidak error
RUN sed -i 's/\r$//' ./docker-entrypoint.sh \
 && chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 4070

ENTRYPOINT ["./docker-entrypoint.sh"]
