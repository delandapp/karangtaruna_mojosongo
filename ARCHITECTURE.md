# Microservice Architecture Documentation

## Overview

This microservice follows the **CDC (Change Data Capture)** pattern with a clean separation of concerns. All cache operations (set and invalidate) are routed through Kafka for consistency across all service instances.

## Architecture Flow

### Write Operations (Create/Update/Delete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              WRITE PATH                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   API Request                                                            │
│       │                                                                  │
│       ▼                                                                  │
│   Controller ──► Validation (Zod)                                       │
│       │                                                                  │
│       ▼                                                                  │
│   Service                                                                │
│       │                                                                  │
│       ▼                                                                  │
│   Repository ──► PostgreSQL                                              │
│                       │                                                  │
│                       ▼                                                  │
│              ┌───────────────┐                                           │
│              │   PostgreSQL   │                                          │
│              │      WAL       │                                          │
│              └───────┬───────┘                                           │
│                      │                                                   │
│                      ▼                                                   │
│              ┌───────────────┐                                           │
│              │    Debezium    │  ◄── CDC Connector                       │
│              └───────┬───────┘                                           │
│                      │                                                   │
│                      ▼                                                   │
│              ┌───────────────┐                                           │
│              │     Kafka      │  (CDC Topics)                            │
│              └───────┬───────┘                                           │
│                      │                                                   │
└──────────────────────│──────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CDC CONSUMER                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Kafka Consumer (CDC topics)                                            │
│       │                                                                  │
│       ├──► Sync to Elasticsearch (Full-text Search Index)               │
│       │                                                                  │
│       ├──► Publish "cache set" message to Kafka ──► CACHE_SET topic     │
│       │                                                                  │
│       └──► Publish "cache invalidate" message to Kafka                  │
│                ──► CACHE_INVALIDATE topic                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        CACHE CONSUMER                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Kafka Consumer (cache topics)                                          │
│       │                                                                  │
│       ├──► CACHE_SET topic  ──► redis.set(key, value, ttl)              │
│       │                                                                  │
│       └──► CACHE_INVALIDATE topic  ──► redis.del(pattern)               │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Read Operations

#### Single Item Read (Cache-First, ES Fallback)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           READ SINGLE ITEM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   API Request                                                            │
│       │                                                                  │
│       ▼                                                                  │
│   Service ──► Check Redis Cache                                         │
│                       │                                                 │
│               ┌───────┴───────┐                                         │
│               │               │                                         │
│          Cache Hit      Cache Miss                                       │
│               │               │                                          │
│               ▼               ▼                                          │
│         Return Data    Query Elasticsearch (get by ID)                  │
│                              │                                           │
│                              ▼                                           │
│                         Return Data                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Search/Listing (Elasticsearch Strategy)
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SEARCH/LIST                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   API Request (with optional search/filter/pagination)                  │
│       │                                                                  │
│       ▼                                                                  │
│   Service ──► Check Redis Cache (non-search only)                       │
│                       │                                                 │
│               ┌───────┴───────┐                                         │
│               │               │                                         │
│          Cache Hit      Cache Miss / Search Query                        │
│               │               │                                          │
│               ▼               ▼                                          │
│         Return Data    Query Elasticsearch                               │
│                       (multi_match / match_all + filters)                │
│                              │                                           │
│                              ▼                                           │
│                         Return Paginated Results                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Summary

| Operation | Primary Storage | Cache (Redis) | Search (ES) |
|-----------|----------------|---------------|-------------|
| Create    | PostgreSQL     | CDC → Kafka → Consumer → Redis | CDC Sync |
| Update    | PostgreSQL     | CDC → Kafka → Consumer → Redis | CDC Sync |
| Delete    | PostgreSQL     | CDC → Kafka → Consumer → Redis | CDC Sync |
| Read One  | -              | Cache-First → ES Fallback | - |
| Read All  | -              | Cache (optional) → ES | Elasticsearch |
| Search    | -              | -             | Elasticsearch |

## Key Principles

1. **Single Source of Truth**: PostgreSQL is the primary database
2. **CDC Pipeline**: All data synchronization happens through Debezium → Kafka
3. **Cache via Kafka**: All Redis operations (set/invalidate) go through Kafka topics
4. **Cache Consumer**: Dedicated consumer reads Kafka cache messages and applies to Redis
5. **Search Strategy**: Elasticsearch for all read operations (populated by CDC)
6. **No Direct Writes to Cache/Search**: Services only write to PostgreSQL; CDC handles all sync
7. **No Direct Cache in API**: API routes never call `setCache()` or `invalidateCachePrefix()` directly

## Kafka Topics

### CDC Topics (Debezium)
Format: `{server}.{schema}.{table}` → `localserver.public.{table}`

### Cache Operation Topics
| Topic | Purpose |
|-------|---------|
| `karangtaruna.cache.set` | Set/update a Redis cache key |
| `karangtaruna.cache.invalidate` | Invalidate Redis keys by prefix pattern |

> **All topic names and Elasticsearch indices are centralized in [`lib/constants.ts`](lib/constants.ts)**
> Use `KAFKA_TOPICS.*` and `ELASTIC_INDICES.*` constants instead of hardcoding strings.

## Elasticsearch Indices

All indices follow the format `karangtaruna_{table}_index`. See [`lib/constants.ts`](lib/constants.ts) for the full list.

| Category | Tables |
|----------|--------|
| User & Access | `m_user`, `m_level`, `m_jabatan`, `m_hak_akses`, `m_hak_akses_rule` |
| Organisasi | `m_organisasi` |
| Event | `event`, `anggota_panitia`, `rundown_acara`, `tugas_event`, `rapat` |
| Keuangan | `anggaran`, `item_anggaran`, `transaksi_keuangan` |
| Wilayah | `m_provinsi`, `m_kota`, `m_kecamatan`, `m_kelurahan` |
| Sponsorship | `m_kategori_brand`, `m_bidang_brand`, `m_brand`, `m_skala_perusahaan`, `m_sektor_industri`, `m_perusahaan`, `m_kategori_sponsor`, `m_sponsor`, `event_sponsor`, `proposal_sponsor` |
| Logistik | `m_vendor`, `m_venue`, `m_inventaris`, `event_vendor`, `event_venue` |
| Pendaftaran | `kategori_pendaftaran`, `pendaftaran`, `hasil_lomba` |
| Promosi | `m_kategori_berita`, `berita`, `kalender_konten` |
| Sistem | `notifikasi`, `log_audit` |
| Feedback | `survei_kepuasan`, `respon_survei`, `saran_masukan` |
| Tiket | `jenis_tiket`, `tiket_order`, `tiket_terbit` |
| Dokumen | `m_jenis_surat`, `surat`, `dokumen`, `laporan` |
| Dokumentasi | `media_galeri` |
| Sekolah | `m_sekolah`, `m_sekolah_detail`, `m_sekolah_foto` |
| Jenjang | `m_jenjang` |
| E-Proposal | `m_eproposal`, `c_eproposal_pengaturan`, `c_eproposal_daftar_isi` |

## Seeder Behavior

When the seeder runs (`prisma/seed.ts`):
1. Seeds all data to PostgreSQL
2. **Deletes all Elasticsearch documents** from every index (fresh start)
3. **Publishes cache invalidation** for all Redis keys via Kafka
4. CDC consumer (must be running) will re-index all data from WAL into Elasticsearch

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://:password@host:6379

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=karangtaruna-app
KAFKA_GROUP_ID=karangtaruna-cdc-consumer
KAFKA_CACHE_GROUP_ID=karangtaruna-cache-consumer

# Elasticsearch
ELASTIC_NODE=http://localhost:9200
ELASTIC_USERNAME=
ELASTIC_PASSWORD=

# App
PORT=4010
```

## Prerequisites

1. **PostgreSQL** with WAL enabled
2. **Debezium Connector** configured for PostgreSQL
3. **Kafka** with CDC topics + cache topics (`karangtaruna.cache.set`, `karangtaruna.cache.invalidate`)
4. **Redis** for caching
5. **Elasticsearch** for full-text search
