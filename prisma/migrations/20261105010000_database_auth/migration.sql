CREATE TABLE "User" (
 "id" UUID PRIMARY KEY,
 "email" VARCHAR(254) NOT NULL UNIQUE,
 "passwordHash" VARCHAR(256),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Preserve ownership of pre-existing addresses. Legacy Supabase passwords are
-- never copied or treated as local credentials.
INSERT INTO "User" ("id","email")
SELECT u.id, COALESCE(lower(u.email),u.id::text || '@legacy.invalid') FROM auth.users u
WHERE EXISTS (SELECT 1 FROM "Address" a WHERE a."userId"=u.id);
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
DROP POLICY "Users manage own addresses" ON "Address";
REVOKE ALL ON "Address" FROM authenticated;
CREATE TABLE "Session" (
 "tokenHash" VARCHAR(64) PRIMARY KEY,
 "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "expiresAt" TIMESTAMPTZ(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE TABLE "AuthRateLimit" (
 "key" VARCHAR(80) PRIMARY KEY,
 "attempts" INTEGER NOT NULL DEFAULT 1,
 "expiresAt" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
-- Local application sessions are intentionally not Supabase Auth JWTs.
-- The Data API has no access; authenticated server queries enforce ownership.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "User", "Session", "AuthRateLimit" FROM anon, authenticated;
