ALTER TABLE "Content"
ADD COLUMN "sourceSystem" TEXT,
ADD COLUMN "sourceType" TEXT,
ADD COLUMN "sourceId" TEXT,
ADD COLUMN "sourceUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Content_sourceSystem_sourceType_sourceId_key"
ON "Content"("sourceSystem", "sourceType", "sourceId");
