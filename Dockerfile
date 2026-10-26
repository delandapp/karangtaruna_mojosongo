# ══════════════════════════════════════════════════════════════════════════════
# Dockerfile — Karang Taruna Mojosongo
# ──────────────────────────────────────────────────────────────────────────────
# Build image (jalankan dari root project):
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://ktimojosongo.my.id/api \
#     -t delandapp/karang_taruna:latest .
#
# Push ke Docker Hub:
#   docker push delandapp/karang_taruna:latest
# ══════════════════════════════════════════════════════════════════════════════


# ── Stage 1: Production-only deps — untuk runner (jauh lebih kecil) ───────────
# Tidak ada TypeScript, ESLint, Vitest, @tailwindcss/oxide, dll.
# Ukuran node_modules turun drastis → image final lebih kecil & export lebih cepat.
FROM node:22-alpine AS prod-deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# Hanya install production dependencies (termasuk tsx untuk runtime seeder)
RUN npm ci --omit=dev


# ── Stage 2: Build Next.js application ────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./

# Install dependency langsung di builder.
# Menghindari "COPY --from=deps node_modules" lintas stage yang menduplikasi
# ratusan ribu file (2GB) dan menyebabkan 'input/output error' pada Docker BuildKit.
RUN npm ci --include=dev

# Salin seluruh source code
COPY . .

# ── NEXT_PUBLIC_* WAJIB ada saat BUILD TIME ───────────────────────────────────
# Variabel ini "di-bake" ke dalam JavaScript bundle oleh Next.js.
# Default value = nilai production dari .env.production
ARG NEXT_PUBLIC_API_URL=https://ktimojosongo.my.id/api

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client ke dalam node_modules/.prisma/client/
# File ini yang akan di-overlay ke runner di atas prod-deps node_modules
RUN node_modules/.bin/prisma generate

# Build Next.js production bundle (tanpa dotenv-cli wrapper)
RUN node_modules/.bin/next build


# ── Stage 3: Production runner ─────────────────────────────────────────────────
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

# ── Lib (dibutuhkan seed.ts: redis, dll.) ─────────────────────────────────────
COPY --chown=nextjs:nodejs --from=builder /app/lib              ./lib

# ── Pastikan folder storage uploads dibuat dengan kepemilikan user nextjs ──────
RUN mkdir -p ./public/uploads && chown -R nextjs:nodejs ./public/uploads

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
