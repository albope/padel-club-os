CREATE TABLE "RefundOperation" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "stripePaymentIntentId" TEXT NOT NULL,
  "stripeRefundId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "reason" VARCHAR(300) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lastError" VARCHAR(1000),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RefundOperation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RefundOperation_valid_status"
    CHECK ("status" IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED'))
);

CREATE UNIQUE INDEX "RefundOperation_paymentId_key" ON "RefundOperation"("paymentId");
CREATE UNIQUE INDEX "RefundOperation_stripeRefundId_key" ON "RefundOperation"("stripeRefundId");
CREATE UNIQUE INDEX "RefundOperation_idempotencyKey_key" ON "RefundOperation"("idempotencyKey");
CREATE INDEX "RefundOperation_status_nextAttemptAt_idx" ON "RefundOperation"("status", "nextAttemptAt");
CREATE INDEX "RefundOperation_clubId_createdAt_idx" ON "RefundOperation"("clubId", "createdAt");
CREATE INDEX "RefundOperation_bookingId_idx" ON "RefundOperation"("bookingId");

ALTER TABLE "RefundOperation"
  ADD CONSTRAINT "RefundOperation_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundOperation"
  ADD CONSTRAINT "RefundOperation_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RefundOperation"
  ADD CONSTRAINT "RefundOperation_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StripeWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "lastError" VARCHAR(1000),
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StripeWebhookEvent_valid_status"
    CHECK ("status" IN ('PROCESSING', 'SUCCEEDED', 'FAILED'))
);

CREATE UNIQUE INDEX "StripeWebhookEvent_eventId_key" ON "StripeWebhookEvent"("eventId");
CREATE INDEX "StripeWebhookEvent_status_updatedAt_idx" ON "StripeWebhookEvent"("status", "updatedAt");
