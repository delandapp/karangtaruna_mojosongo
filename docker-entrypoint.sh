#!/bin/sh
set -e

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Karang Taruna Mojosongo — Production Container"
echo "════════════════════════════════════════════════════════"
echo ""

# ── [0/3] Wait for Database ────────────────────────────────────────────────────
echo "🔌 [0/3] Menunggu database tersedia..."

RETRIES=20
DELAY=5

until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DIRECT_URL });
client.connect()
  .then(() => client.end().then(() => process.exit(0)))
  .catch(() => process.exit(1));
" 2>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "❌ Database tidak dapat dihubungi setelah beberapa percobaan. Membatalkan."
    exit 1
  fi
  echo "   ⏳ Database belum siap, mencoba lagi dalam ${DELAY}s... (sisa ${RETRIES} percobaan)"
  sleep "$DELAY"
done

echo "✅ Database terhubung."
echo ""

# ── [1/3] Prisma Migrate Deploy ────────────────────────────────────────────────
echo "📦 [1/3] Menjalankan Prisma migrations (migrate deploy)..."

MIGRATE_RETRIES=5
MIGRATE_DELAY=5

until prisma migrate deploy; do
  MIGRATE_RETRIES=$((MIGRATE_RETRIES - 1))
  if [ "$MIGRATE_RETRIES" -le 0 ]; then
    echo "❌ Prisma migrate deploy gagal setelah beberapa percobaan. Membatalkan."
    exit 1
  fi
  echo "   ⏳ Migrate gagal, mencoba lagi dalam ${MIGRATE_DELAY}s... (sisa ${MIGRATE_RETRIES} percobaan)"
  sleep "$MIGRATE_DELAY"
done

echo "✅ Migrations berhasil diterapkan."
echo ""

# ── [2/3] Database Seeder ──────────────────────────────────────────────────────
echo "🌱 [2/3] Menjalankan database seeder..."
echo "   ℹ️  Seeder akan:"
echo "      • Mengosongkan semua Elasticsearch indices"
echo "      • Mengisi ulang data master ke database"
echo "      • Bulk reindex semua data ke Elasticsearch"
echo "      • Invalidasi semua Redis cache"
echo ""

if tsx prisma/seed.ts; then
  echo "✅ Seeder selesai."
else
  echo "⚠️  Seeder mengalami error — container tetap dilanjutkan."
  echo "   Periksa log di atas untuk detail error."
fi

echo ""

# ── [3/3] Start Next.js ────────────────────────────────────────────────────────
APP_PORT="${PORT:-4070}"
echo "🚀 [3/3] Menjalankan Next.js pada port ${APP_PORT}..."
echo ""
echo "════════════════════════════════════════════════════════"
echo "  App berjalan di http://0.0.0.0:${APP_PORT}"
echo "════════════════════════════════════════════════════════"
echo ""

exec next start -p "$APP_PORT"
