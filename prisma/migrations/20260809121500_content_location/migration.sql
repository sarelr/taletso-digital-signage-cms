ALTER TABLE "Content" ADD COLUMN "locationId" TEXT;

CREATE INDEX "Content_locationId_status_idx" ON "Content"("locationId", "status");

ALTER TABLE "Content"
ADD CONSTRAINT "Content_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
