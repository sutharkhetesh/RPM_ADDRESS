-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('SHIPPING', 'BILLING', 'BOTH');

-- CreateEnum
CREATE TYPE "AddressLabel" AS ENUM ('HOME', 'OFFICE', 'OTHER');

-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "companyName" VARCHAR(160),
    "email" VARCHAR(254),
    "phone" VARCHAR(24) NOT NULL,
    "alternatePhone" VARCHAR(24),
    "addressLine1" VARCHAR(250) NOT NULL,
    "addressLine2" VARCHAR(250),
    "landmark" VARCHAR(160),
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL DEFAULT 'India',
    "postalCode" VARCHAR(20) NOT NULL,
    "addressType" "AddressType" NOT NULL DEFAULT 'SHIPPING',
    "addressLabel" "AddressLabel" NOT NULL DEFAULT 'HOME',
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Address_userId_addressType_idx" ON "Address"("userId", "addressType");

-- CreateIndex
CREATE INDEX "Address_userId_addressLabel_idx" ON "Address"("userId", "addressLabel");

-- CreateIndex
CREATE INDEX "Address_userId_city_idx" ON "Address"("userId", "city");


-- Defense in depth: defaults remain unique even outside the application.
CREATE UNIQUE INDEX "Address_one_default_shipping" ON "Address" ("userId") WHERE "isDefaultShipping" = true;
CREATE UNIQUE INDEX "Address_one_default_billing" ON "Address" ("userId") WHERE "isDefaultBilling" = true;
ALTER TABLE "Address" ADD CONSTRAINT "Address_shipping_type" CHECK (NOT "isDefaultShipping" OR "addressType" IN ('SHIPPING', 'BOTH'));
ALTER TABLE "Address" ADD CONSTRAINT "Address_billing_type" CHECK (NOT "isDefaultBilling" OR "addressType" IN ('BILLING', 'BOTH'));
-- Supabase owns the identity lifecycle; no duplicate application user table.
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON "Address" FOR ALL TO authenticated USING ((SELECT auth.uid()) = "userId") WITH CHECK ((SELECT auth.uid()) = "userId");
REVOKE ALL ON "Address" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON "Address" TO authenticated;
