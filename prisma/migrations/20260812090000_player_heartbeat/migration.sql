ALTER TABLE "Screen"
ADD COLUMN "lastHeartbeatAt" TIMESTAMP(3),
ADD COLUMN "playerVersion" TEXT,
ADD COLUMN "deviceId" TEXT,
ADD COLUMN "reportedMedia" TEXT;

CREATE UNIQUE INDEX "Screen_deviceId_key" ON "Screen"("deviceId");
CREATE INDEX "Screen_lastHeartbeatAt_idx" ON "Screen"("lastHeartbeatAt");
