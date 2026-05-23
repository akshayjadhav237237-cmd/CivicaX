-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('citizen', 'department_op', 'government', 'admin');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('yellow', 'orange', 'red', 'green');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('submitted', 'assigned', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "CivicCategory" AS ENUM ('pothole', 'broken_streetlight', 'waste_management', 'drainage', 'other');

-- CreateEnum
CREATE TYPE "SafeZoneStatus" AS ENUM ('available', 'activated', 'at_capacity');

-- CreateEnum
CREATE TYPE "SafeZoneType" AS ENUM ('school', 'stadium', 'community_hall', 'government_building', 'other');

-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('civil_unrest', 'suspicious_activity', 'violence', 'road_accident', 'other');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('immediate', 'non_urgent');

-- CreateEnum
CREATE TYPE "SafetyReportStatus" AS ENUM ('pending', 'dispatched', 'resolved');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'citizen',
    "city" TEXT,
    "phone" TEXT,
    "sms_alerts_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL DEFAULT 'green',
    "geojson" JSONB NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_alerts" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "level" "AlertLevel" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evacuation_order" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SafeZoneType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "SafeZoneStatus" NOT NULL DEFAULT 'available',
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safe_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "civic_departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categories" TEXT[],
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "civic_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "civic_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "CivicCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ReportStatus" NOT NULL DEFAULT 'submitted',
    "department_id" TEXT,
    "assigned_officer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "civic_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "civic_report_timeline" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL,
    "note" TEXT,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "civic_report_timeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "incident_type" "IncidentType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "description" TEXT NOT NULL,
    "urgency" "Urgency" NOT NULL DEFAULT 'non_urgent',
    "credibility_score" INTEGER NOT NULL DEFAULT 1,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "SafetyReportStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elevation_data" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "elevation_m" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "elevation_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "population_density" (
    "id" TEXT NOT NULL,
    "region_name" TEXT NOT NULL,
    "density_per_sqkm" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "population_density_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "emergency_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_reports" ADD CONSTRAINT "civic_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_reports" ADD CONSTRAINT "civic_reports_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "civic_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_report_timeline" ADD CONSTRAINT "civic_report_timeline_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "civic_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "civic_report_timeline" ADD CONSTRAINT "civic_report_timeline_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_reports" ADD CONSTRAINT "safety_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
