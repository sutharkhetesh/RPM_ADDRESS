BEGIN;
-- Keep every address and its existing user ownership when retiring branches.
LOCK TABLE "Address" IN SHARE ROW EXCLUSIVE MODE;
DROP INDEX "Address_one_default_shipping";
DROP INDEX "Address_one_default_billing";
-- Multiple former branches can have defaults. Keep the oldest default of each
-- purpose per user; unset only the extra flags, never delete address records.
WITH ranked AS (SELECT "id",row_number() OVER(PARTITION BY "userId" ORDER BY "createdAt","id") AS n FROM "Address" WHERE "isDefaultShipping"=true)
UPDATE "Address" SET "isDefaultShipping"=false WHERE "id" IN(SELECT "id" FROM ranked WHERE n>1);
WITH ranked AS (SELECT "id",row_number() OVER(PARTITION BY "userId" ORDER BY "createdAt","id") AS n FROM "Address" WHERE "isDefaultBilling"=true)
UPDATE "Address" SET "isDefaultBilling"=false WHERE "id" IN(SELECT "id" FROM ranked WHERE n>1);
ALTER TABLE "Address" DROP CONSTRAINT "Address_branchId_userId_fkey";
DROP INDEX "Address_userId_branchId_createdAt_idx";
ALTER TABLE "Address" DROP COLUMN "branchId";
DROP TABLE "Branch";
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId","createdAt");
CREATE UNIQUE INDEX "Address_one_default_shipping" ON "Address"("userId") WHERE "isDefaultShipping"=true;
CREATE UNIQUE INDEX "Address_one_default_billing" ON "Address"("userId") WHERE "isDefaultBilling"=true;
ALTER TABLE "User" ADD COLUMN "fullName" VARCHAR(120);
UPDATE "User" u SET "fullName"=COALESCE((SELECT a."fullName" FROM "Address" a WHERE a."userId"=u.id ORDER BY a."createdAt",a.id LIMIT 1),left(split_part(u.email,'@',1),120));
ALTER TABLE "User" ALTER COLUMN "fullName" SET NOT NULL;
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMPTZ(3);
-- Existing accounts with both purposes keep direct dashboard access.
UPDATE "User" u SET "onboardingCompletedAt"=CURRENT_TIMESTAMP WHERE EXISTS(SELECT 1 FROM "Address" a WHERE a."userId"=u.id AND a."addressType" IN('SHIPPING','BOTH')) AND EXISTS(SELECT 1 FROM "Address" a WHERE a."userId"=u.id AND a."addressType" IN('BILLING','BOTH'));
COMMIT;
