-- Preserve existing addresses by moving the removed label to OTHER.
UPDATE "Address"
SET "addressLabel" = 'OTHER'
WHERE "addressLabel" = 'WORK';

ALTER TABLE "Address" ALTER COLUMN "addressLabel" DROP DEFAULT;
ALTER TYPE "AddressLabel" RENAME TO "AddressLabel_old";
CREATE TYPE "AddressLabel" AS ENUM ('HOME', 'OFFICE', 'OTHER');
ALTER TABLE "Address"
  ALTER COLUMN "addressLabel" TYPE "AddressLabel"
  USING ("addressLabel"::text::"AddressLabel");
ALTER TABLE "Address" ALTER COLUMN "addressLabel" SET DEFAULT 'HOME';
DROP TYPE "AddressLabel_old";
