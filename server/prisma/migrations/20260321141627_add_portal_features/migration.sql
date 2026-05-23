-- CreateEnum
CREATE TYPE "SatelliteSource" AS ENUM ('EONET', 'FIRMS', 'LANCE', 'OPEN_METEO');

-- CreateEnum
CREATE TYPE "SatelliteSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "DispatchServiceType" AS ENUM ('ambulance', 'police', 'fire', 'rescue', 'medical', 'flood_rescue');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('dispatched', 'en_route', 'on_scene', 'completed');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'assigned', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "GrievancePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "GrievanceFeedbackRating" AS ENUM ('one', 'two', 'three', 'four', 'five');

-- CreateEnum
CREATE TYPE "ApiHealthStatus" AS ENUM ('healthy', 'degraded', 'down', 'unconfigured');

-- CreateEnum
CREATE TYPE "FeatureHealthStatus" AS ENUM ('passing', 'failing', 'warning');

-- CreateTable
CREATE TABLE "satellite_events" (
    "id" TEXT NOT NULL,
    "source" "SatelliteSource" NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "severity" "SatelliteSeverity" NOT NULL DEFAULT 'low',
    "raw_data" JSONB NOT NULL,
    "situational_desc" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_event_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satellite_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_dispatches" (
    "id" TEXT NOT NULL,
    "satellite_event_id" TEXT,
    "emergency_alert_id" TEXT,
    "dispatched_by_id" TEXT NOT NULL,
    "service_type" "DispatchServiceType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "destination_lat" DOUBLE PRECISION NOT NULL,
    "destination_lng" DOUBLE PRECISION NOT NULL,
    "destination_label" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'standard',
    "notes" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'dispatched',
    "dispatched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "civic_grievances" (
    "id" TEXT NOT NULL,
    "submitted_by_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "GrievanceStatus" NOT NULL DEFAULT 'submitted',
    "reviewed_by_id" TEXT,
    "approved_budget" DOUBLE PRECISION,
    "assigned_department_id" TEXT,
    "priority" "GrievancePriority" NOT NULL DEFAULT 'medium',
    "estimated_resolution_days" INTEGER,
    "internal_notes" TEXT,
    "rejection_reason" TEXT,
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "civic_grievances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_updates" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "updated_by_id" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grievance_feedback" (
    "id" TEXT NOT NULL,
    "grievance_id" TEXT NOT NULL,
    "rating" "GrievanceFeedbackRating" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grievance_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whitelisted_officials" (
    "id" TEXT NOT NULL,
    "official_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "added_by_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whitelisted_officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_health_logs" (
    "id" TEXT NOT NULL,
    "api_name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "status" "ApiHealthStatus" NOT NULL,
    "response_time_ms" INTEGER,
    "error_message" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_health_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_health_reports" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "status" "FeatureHealthStatus" NOT NULL,
    "response_ms" INTEGER,
    "error_message" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "satellite_events_source_event_id_key" ON "satellite_events"("source_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "grievance_feedback_grievance_id_key" ON "grievance_feedback"("grievance_id");

-- CreateIndex
CREATE UNIQUE INDEX "whitelisted_officials_official_id_key" ON "whitelisted_officials"("official_id");

-- AddForeignKey
ALTER TABLE "emergency_dispatches" ADD CONSTRAINT "emergency_dispatches_satellite_event_id_fkey" FOREIGN KEY ("satellite_event_id") REFERENCES "satellite_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_dispatches" ADD CONSTRAINT "emergency_dispatches_dispatched_by_id_fkey" FOREIGN KEY ("dispatched_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_grievances" ADD CONSTRAINT "civic_grievances_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_grievances" ADD CONSTRAINT "civic_grievances_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_grievances" ADD CONSTRAINT "civic_grievances_assigned_department_id_fkey" FOREIGN KEY ("assigned_department_id") REFERENCES "civic_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_updates" ADD CONSTRAINT "grievance_updates_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "civic_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_updates" ADD CONSTRAINT "grievance_updates_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grievance_feedback" ADD CONSTRAINT "grievance_feedback_grievance_id_fkey" FOREIGN KEY ("grievance_id") REFERENCES "civic_grievances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whitelisted_officials" ADD CONSTRAINT "whitelisted_officials_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
