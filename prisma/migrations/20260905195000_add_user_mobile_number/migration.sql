ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_mobileNumber_key"
  ON public."User" ("mobileNumber")
  WHERE "mobileNumber" IS NOT NULL;
