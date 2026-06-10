-- Satellite Disaster Intelligence Pipeline — Phase 2
-- Additive migration: 4 new tables + 1 new enum
-- Target: Mandakini River Basin, Kedarnath, Uttarakhand
-- Safe to run: All CREATE TABLE/TYPE use IF NOT EXISTS

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "FloodRiskLevel" AS ENUM ('green', 'yellow', 'orange', 'red');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: flood_snapshots
-- One record per pipeline cycle (every 10 minutes)
CREATE TABLE IF NOT EXISTS "flood_snapshots" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "risk_level" "FloodRiskLevel" NOT NULL,
    "rainfall_mm_hr" DOUBLE PRECISION NOT NULL,
    "forecast_24h_mm" DOUBLE PRECISION NOT NULL,
    "soil_moisture_m3" DOUBLE PRECISION NOT NULL,
    "valley_slope" DOUBLE PRECISION NOT NULL,
    "soil_source" TEXT NOT NULL,
    "terrain_source" TEXT NOT NULL,
    "rain_source" TEXT NOT NULL,
    "overflow_detected" BOOLEAN NOT NULL DEFAULT false,
    "factors_json" JSONB NOT NULL,
    "recommendation" TEXT NOT NULL,
    "snapshot_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flood_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: flood_zone_risks
-- Per-street-segment flood depth and risk level (populated when overflow detected)
CREATE TABLE IF NOT EXISTS "flood_zone_risks" (
    "id" TEXT NOT NULL,
    "osm_segment_id" TEXT NOT NULL,
    "snapshot_id" TEXT,
    "segment_name" TEXT,
    "highway" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geometry" JSONB NOT NULL,
    "water_depth_m" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flow_direction" TEXT,
    "risk_level" "FloodRiskLevel" NOT NULL DEFAULT 'green',
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "length_km" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flood_zone_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: camera_feeds
-- RTSP camera registry polled every 60s
CREATE TABLE IF NOT EXISTS "camera_feeds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rtsp_url" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location_label" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "latency_ms" INTEGER,
    "last_polled_at" TIMESTAMP(3),
    "last_water_detected" BOOLEAN NOT NULL DEFAULT false,
    "last_detection_confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_detection_method" TEXT NOT NULL DEFAULT 'stub_cv',
    "connection_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "camera_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable: satellite_data_raw
-- Raw API response cache
CREATE TABLE IF NOT EXISTS "satellite_data_raw" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_stale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellite_data_raw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "flood_zone_risks_osm_segment_id_key" ON "flood_zone_risks"("osm_segment_id");
CREATE INDEX IF NOT EXISTS "flood_snapshots_risk_level_idx" ON "flood_snapshots"("risk_level");
CREATE INDEX IF NOT EXISTS "flood_snapshots_snapshot_at_idx" ON "flood_snapshots"("snapshot_at");
CREATE INDEX IF NOT EXISTS "flood_zone_risks_risk_level_idx" ON "flood_zone_risks"("risk_level");
CREATE INDEX IF NOT EXISTS "flood_zone_risks_snapshot_id_idx" ON "flood_zone_risks"("snapshot_id");
CREATE INDEX IF NOT EXISTS "satellite_data_raw_source_fetched_at_idx" ON "satellite_data_raw"("source", "fetched_at");

-- AddForeignKey (skip if exists)
DO $$ BEGIN
  ALTER TABLE "flood_zone_risks" ADD CONSTRAINT "flood_zone_risks_snapshot_id_fkey"
    FOREIGN KEY ("snapshot_id") REFERENCES "flood_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
