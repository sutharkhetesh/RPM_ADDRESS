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

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "onboardingCompletedAt" TIMESTAMPTZ(3),
    "passwordHash" VARCHAR(256),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "tokenHash" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "key" VARCHAR(80) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Address_userId_addressType_idx" ON "Address"("userId", "addressType");

-- CreateIndex
CREATE INDEX "Address_userId_addressLabel_idx" ON "Address"("userId", "addressLabel");

-- CreateIndex
CREATE INDEX "Address_userId_city_idx" ON "Address"("userId", "city");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Preserve defaults and type checks that Prisma's schema cannot express.
CREATE UNIQUE INDEX "Address_one_default_shipping" ON "Address" ("userId") WHERE "isDefaultShipping" = true;
CREATE UNIQUE INDEX "Address_one_default_billing" ON "Address" ("userId") WHERE "isDefaultBilling" = true;
ALTER TABLE "Address" ADD CONSTRAINT "Address_shipping_type" CHECK (NOT "isDefaultShipping" OR "addressType" IN ('SHIPPING', 'BOTH'));
ALTER TABLE "Address" ADD CONSTRAINT "Address_billing_type" CHECK (NOT "isDefaultBilling" OR "addressType" IN ('BILLING', 'BOTH'));

-- Only the owning application role accesses private account and address data.
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Address", "User", "Session", "AuthRateLimit" FROM PUBLIC;
