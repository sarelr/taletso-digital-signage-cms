ALTER TABLE "Playlist" ADD COLUMN "locationId" TEXT;

CREATE INDEX "Playlist_locationId_idx" ON "Playlist"("locationId");

ALTER TABLE "Playlist"
ADD CONSTRAINT "Playlist_locationId_fkey"
FOREIGN KEY ("locationId") REFERENCES "Location"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
