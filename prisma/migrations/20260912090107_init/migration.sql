-- CreateEnum
CREATE TYPE "RoastStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastSession" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "imageUrls" JSONB NOT NULL DEFAULT '[]',
    "roastLevel" TEXT NOT NULL,
    "categories" JSONB NOT NULL DEFAULT '[]',
    "status" "RoastStatus" NOT NULL DEFAULT 'PENDING',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "failureCode" TEXT,
    "ipHash" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoastSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoastResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "roast" TEXT NOT NULL,
    "redFlags" JSONB NOT NULL DEFAULT '[]',
    "greenFlags" JSONB NOT NULL DEFAULT '[]',
    "mainCharacterEnergy" TEXT NOT NULL,
    "shareableQuote" TEXT NOT NULL,
    "lockedSections" JSONB NOT NULL DEFAULT '[]',
    "premiumRedFlags" JSONB NOT NULL DEFAULT '[]',
    "premiumGreenFlags" JSONB NOT NULL DEFAULT '[]',
    "brutalSummary" TEXT,
    "careerRoast" TEXT,
    "moneyRoast" TEXT,
    "socialRoast" TEXT,
    "datingRoast" TEXT,
    "mainCharacterArc" TEXT,
    "selfSabotage" TEXT,
    "friendsWouldRoast" JSONB NOT NULL DEFAULT '[]',
    "finalVerdict" TEXT,
    "premiumGeneratedAt" TIMESTAMP(3),
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoastResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "providerEventId" TEXT,
    "product" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCapture" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT,
    "props" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RoastSession_sessionToken_idx" ON "RoastSession"("sessionToken");

-- CreateIndex
CREATE INDEX "RoastSession_createdAt_idx" ON "RoastSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoastResult_sessionId_key" ON "RoastResult"("sessionId");

-- CreateIndex
CREATE INDEX "Payment_sessionId_idx" ON "Payment"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_provider_providerOrderId_key" ON "Payment"("provider", "providerOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Share_shareToken_key" ON "Share"("shareToken");

-- CreateIndex
CREATE INDEX "Share_sessionId_idx" ON "Share"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCapture_email_sessionId_key" ON "EmailCapture"("email", "sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_name_idx" ON "AnalyticsEvent"("name");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "RateLimitHit_bucket_key_createdAt_idx" ON "RateLimitHit"("bucket", "key", "createdAt");

-- CreateIndex
CREATE INDEX "UploadedImage_createdAt_idx" ON "UploadedImage"("createdAt");

-- AddForeignKey
ALTER TABLE "RoastSession" ADD CONSTRAINT "RoastSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoastResult" ADD CONSTRAINT "RoastResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RoastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RoastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Share" ADD CONSTRAINT "Share_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RoastSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RoastSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
