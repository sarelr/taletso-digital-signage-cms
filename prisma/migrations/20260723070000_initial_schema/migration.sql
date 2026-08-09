CREATE TYPE "ScreenStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN');
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ContentType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'WEBPAGE');
CREATE TYPE "ApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "ReadinessStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY', 'BLOCKED');
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Organisation" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Screen" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "externalId" TEXT,
  "status" "ScreenStatus" NOT NULL DEFAULT 'UNKNOWN',
  "lastSeenAt" TIMESTAMP(3),
  "locationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Screen_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScreenGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "ScreenGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScreenGroupMembership" (
  "screenId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  CONSTRAINT "ScreenGroupMembership_pkey" PRIMARY KEY ("screenId", "groupId")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "passwordHash" TEXT,
  "organisationId" TEXT NOT NULL,
  "locationId" TEXT,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

CREATE TABLE "Content" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "ContentType" NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "url" TEXT,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Playlist" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlaylistItem" (
  "playlistId" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "durationSeconds" INTEGER NOT NULL DEFAULT 10,
  CONSTRAINT "PlaylistItem_pkey" PRIMARY KEY ("playlistId", "contentId")
);

CREATE TABLE "Schedule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "playlistId" TEXT NOT NULL,
  "screenGroupId" TEXT NOT NULL,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Approval" (
  "id" TEXT NOT NULL,
  "decision" "ApprovalDecision" NOT NULL DEFAULT 'PENDING',
  "comment" TEXT,
  "contentId" TEXT NOT NULL,
  "approverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Audit" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Audit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SiteReadiness" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "power" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "network" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "mounting" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "player" "ReadinessStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "notes" TEXT,
  "targetDate" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteReadiness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");
CREATE UNIQUE INDEX "Screen_externalId_key" ON "Screen"("externalId");
CREATE UNIQUE INDEX "ScreenGroup_name_key" ON "ScreenGroup"("name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE UNIQUE INDEX "SiteReadiness_locationId_key" ON "SiteReadiness"("locationId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

ALTER TABLE "Location" ADD CONSTRAINT "Location_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Screen" ADD CONSTRAINT "Screen_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScreenGroupMembership" ADD CONSTRAINT "ScreenGroupMembership_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScreenGroupMembership" ADD CONSTRAINT "ScreenGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ScreenGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlaylistItem" ADD CONSTRAINT "PlaylistItem_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_screenGroupId_fkey" FOREIGN KEY ("screenGroupId") REFERENCES "ScreenGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Audit" ADD CONSTRAINT "Audit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SiteReadiness" ADD CONSTRAINT "SiteReadiness_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
