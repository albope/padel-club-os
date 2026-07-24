-- Las reservas nuevas se cobran exclusivamente en el club. Los campos de
-- Stripe Connect se conservan para poder consultar y reconciliar historicos.
UPDATE "Club"
SET "bookingPaymentMode" = 'presential'
WHERE "bookingPaymentMode" IS DISTINCT FROM 'presential';

ALTER TABLE "Club"
  ADD CONSTRAINT "Club_presential_booking_payment_only"
  CHECK ("bookingPaymentMode" IS NULL OR "bookingPaymentMode" = 'presential');

-- Contadores atomicos y compartidos para proteger autenticacion y APIs en
-- entornos serverless sin depender obligatoriamente de Redis.
CREATE TABLE "RateLimitBucket" (
  "key" VARCHAR(191) NOT NULL,
  "count" INTEGER NOT NULL,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitBucket_resetAt_idx" ON "RateLimitBucket"("resetAt");
