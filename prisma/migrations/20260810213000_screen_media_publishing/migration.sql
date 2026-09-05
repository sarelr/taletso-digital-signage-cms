CREATE TYPE "PublicationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED', 'ROLLED_BACK');

ALTER TABLE "Screen" ADD COLUMN "currentContentId" TEXT;
ALTER TABLE "Content" ADD COLUMN "originalFilename" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "fileSize" INTEGER;

CREATE TABLE "Publication" (
    "id" TEXT NOT NULL,
    "screenId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "status" "PublicationStatus" NOT NULL DEFAULT 'PENDING',
    "configurationVersion" TEXT NOT NULL,
    "backupPath" TEXT,
    "errorMessage" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Publication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Publication_configurationVersion_key" ON "Publication"("configurationVersion");
CREATE INDEX "Publication_screenId_createdAt_idx" ON "Publication"("screenId", "createdAt");
CREATE INDEX "Publication_contentId_idx" ON "Publication"("contentId");
CREATE INDEX "Publication_actorId_idx" ON "Publication"("actorId");
CREATE INDEX "Screen_currentContentId_idx" ON "Screen"("currentContentId");

ALTER TABLE "Screen" ADD CONSTRAINT "Screen_currentContentId_fkey" FOREIGN KEY ("currentContentId") REFERENCES "Content"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Publication" ADD CONSTRAINT "Publication_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
