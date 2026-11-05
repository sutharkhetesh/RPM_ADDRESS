CREATE TABLE "Branch" (
 "id" UUID NOT NULL PRIMARY KEY,
 "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "name" VARCHAR(120) NOT NULL,
 "city" VARCHAR(100) NOT NULL,
 "state" VARCHAR(100) NOT NULL,
 "sourceKey" VARCHAR(32),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "Branch_id_userId_key" ON "Branch"("id","userId");
CREATE UNIQUE INDEX "Branch_userId_sourceKey_key" ON "Branch"("userId","sourceKey");
CREATE INDEX "Branch_userId_createdAt_idx" ON "Branch"("userId","createdAt");
ALTER TABLE "Address" ADD COLUMN "branchId" UUID;
-- Preserve all saved addresses and defaults in a separate legacy branch.
INSERT INTO "Branch" ("id","userId","name","city","state","sourceKey","updatedAt")
SELECT gen_random_uuid(),"userId",'Imported addresses','Not specified','Not specified','legacy',CURRENT_TIMESTAMP FROM "Address" GROUP BY "userId";
UPDATE "Address" a SET "branchId"=b."id" FROM "Branch" b WHERE b."userId"=a."userId" AND b."sourceKey"='legacy';
ALTER TABLE "Address" ALTER COLUMN "branchId" SET NOT NULL;
ALTER TABLE "Address" ADD CONSTRAINT "Address_branchId_userId_fkey" FOREIGN KEY ("branchId","userId") REFERENCES "Branch"("id","userId") ON DELETE CASCADE;
DROP INDEX "Address_one_default_shipping";
DROP INDEX "Address_one_default_billing";
CREATE UNIQUE INDEX "Address_one_default_shipping" ON "Address"("branchId") WHERE "isDefaultShipping"=true;
CREATE UNIQUE INDEX "Address_one_default_billing" ON "Address"("branchId") WHERE "isDefaultBilling"=true;
DROP INDEX "Address_userId_createdAt_idx";
CREATE INDEX "Address_userId_branchId_createdAt_idx" ON "Address"("userId","branchId","createdAt");
ALTER TABLE "Branch" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Branch" FROM anon,authenticated;
