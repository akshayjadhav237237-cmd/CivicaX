-- CreateTable
CREATE TABLE "flood_predictions" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "alert_level" TEXT NOT NULL,
    "prediction_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flood_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flood_predictions_zone_id_idx" ON "flood_predictions"("zone_id");

-- CreateIndex
CREATE INDEX "flood_predictions_created_at_idx" ON "flood_predictions"("created_at");
