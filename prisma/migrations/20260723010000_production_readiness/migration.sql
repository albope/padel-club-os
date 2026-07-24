-- Nuevos tipos de configuracion y soporte.
CREATE TYPE "ClubRegistrationMode" AS ENUM ('OPEN', 'APPROVAL', 'INVITE_ONLY', 'CLOSED');
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'REVOKED');
CREATE TYPE "BugReportStatus" AS ENUM ('NEW', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "BugReportCategory" AS ENUM ('BUG', 'UX', 'PERFORMANCE', 'DATA', 'SUGGESTION', 'OTHER');

ALTER TABLE "Club"
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
  ADD COLUMN "registrationMode" "ClubRegistrationMode" NOT NULL DEFAULT 'APPROVAL',
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid';

ALTER TABLE "User"
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- Conservar el comportamiento publico de los clubes que ya existian.
UPDATE "Club"
SET
  "isPublished" = true,
  "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", CURRENT_TIMESTAMP)
WHERE "esDemo" = false
  AND "subscriptionStatus" IN ('active', 'trialing');

CREATE TABLE "ClubMembership" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImpersonationSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "actorId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "reason" VARCHAR(300) NOT NULL,
  "readOnly" BOOLEAN NOT NULL DEFAULT true,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BugReport" (
  "id" TEXT NOT NULL,
  "category" "BugReportCategory" NOT NULL DEFAULT 'BUG',
  "status" "BugReportStatus" NOT NULL DEFAULT 'NEW',
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT NOT NULL,
  "pageUrl" VARCHAR(1000),
  "userAgent" VARCHAR(1000),
  "viewport" VARCHAR(50),
  "metadata" JSONB,
  "attachmentUrl" TEXT,
  "userId" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClubMembership_clubId_status_role_idx"
  ON "ClubMembership"("clubId", "status", "role");
CREATE INDEX "ClubMembership_userId_status_idx"
  ON "ClubMembership"("userId", "status");
CREATE UNIQUE INDEX "ClubMembership_userId_clubId_key"
  ON "ClubMembership"("userId", "clubId");

CREATE UNIQUE INDEX "ImpersonationSession_tokenHash_key"
  ON "ImpersonationSession"("tokenHash");
CREATE INDEX "ImpersonationSession_actorId_createdAt_idx"
  ON "ImpersonationSession"("actorId", "createdAt");
CREATE INDEX "ImpersonationSession_subjectId_createdAt_idx"
  ON "ImpersonationSession"("subjectId", "createdAt");
CREATE INDEX "ImpersonationSession_clubId_createdAt_idx"
  ON "ImpersonationSession"("clubId", "createdAt");
CREATE INDEX "ImpersonationSession_expiresAt_endedAt_idx"
  ON "ImpersonationSession"("expiresAt", "endedAt");

CREATE INDEX "BugReport_clubId_status_createdAt_idx"
  ON "BugReport"("clubId", "status", "createdAt");
CREATE INDEX "BugReport_status_createdAt_idx"
  ON "BugReport"("status", "createdAt");
CREATE INDEX "BugReport_userId_createdAt_idx"
  ON "BugReport"("userId", "createdAt");

ALTER TABLE "ClubMembership"
  ADD CONSTRAINT "ClubMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMembership"
  ADD CONSTRAINT "ClubMembership_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpersonationSession"
  ADD CONSTRAINT "ImpersonationSession_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpersonationSession"
  ADD CONSTRAINT "ImpersonationSession_subjectId_fkey"
  FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImpersonationSession"
  ADD CONSTRAINT "ImpersonationSession_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BugReport"
  ADD CONSTRAINT "BugReport_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BugReport"
  ADD CONSTRAINT "BugReport_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convertir las pertenencias heredadas en membresias explicitas.
INSERT INTO "ClubMembership" (
  "id", "userId", "clubId", "role", "status", "joinedAt",
  "approvedAt", "createdAt", "updatedAt"
)
SELECT
  'cm_' || md5("User"."id" || ':' || "User"."clubId"),
  "User"."id",
  "User"."clubId",
  "User"."role",
  CASE
    WHEN "User"."isActive" THEN 'ACTIVE'::"MembershipStatus"
    ELSE 'SUSPENDED'::"MembershipStatus"
  END,
  CURRENT_TIMESTAMP,
  CASE WHEN "User"."isActive" THEN CURRENT_TIMESTAMP ELSE NULL END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
WHERE "User"."clubId" IS NOT NULL
ON CONFLICT ("userId", "clubId") DO NOTHING;

-- Invariantes de dominio que deben sobrevivir a carreras entre instancias.
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_valid_time_range" CHECK ("endTime" > "startTime"),
  ADD CONSTRAINT "Booking_non_negative_price" CHECK ("totalPrice" >= 0),
  ADD CONSTRAINT "Booking_valid_players" CHECK ("numPlayers" IS NULL OR "numPlayers" BETWEEN 2 AND 4),
  ADD CONSTRAINT "Booking_valid_status" CHECK ("status" IN ('confirmed', 'cancelled')),
  ADD CONSTRAINT "Booking_valid_payment_status" CHECK (
    "paymentStatus" IS NULL OR "paymentStatus" IN ('pending', 'paid', 'exempt', 'refund_pending', 'refunded', 'refund_failed')
  ),
  ADD CONSTRAINT "Booking_valid_payment_method" CHECK (
    "paymentMethod" IS NULL OR "paymentMethod" IN ('online', 'presential', 'exempt')
  );

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_non_negative_amount" CHECK ("amount" >= 0),
  ADD CONSTRAINT "Payment_valid_status" CHECK (
    "status" IN ('succeeded', 'pending', 'failed', 'refund_pending', 'refunded', 'refund_failed')
  ),
  ADD CONSTRAINT "Payment_valid_type" CHECK ("type" IN ('booking', 'subscription'));

ALTER TABLE "BookingPayment"
  ADD CONSTRAINT "BookingPayment_non_negative_amount" CHECK ("amount" >= 0),
  ADD CONSTRAINT "BookingPayment_valid_status" CHECK ("status" IN ('pending', 'paid', 'refunded'));

ALTER TABLE "CourtPricing"
  ADD CONSTRAINT "CourtPricing_valid_day" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "CourtPricing_valid_hours" CHECK (
    "startHour" BETWEEN 0 AND 23 AND "endHour" BETWEEN 1 AND 24 AND "endHour" > "startHour"
  ),
  ADD CONSTRAINT "CourtPricing_non_negative_price" CHECK ("price" >= 0);

ALTER TABLE "RecurringBooking"
  ADD CONSTRAINT "RecurringBooking_valid_day" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "RecurringBooking_valid_minutes" CHECK (
    "startMinute" BETWEEN 0 AND 59 AND "endMinute" BETWEEN 0 AND 59
  ),
  ADD CONSTRAINT "RecurringBooking_valid_dates" CHECK ("endsAt" > "startsAt");

ALTER TABLE "PlayerRating"
  ADD CONSTRAINT "PlayerRating_valid_stars" CHECK ("stars" BETWEEN 1 AND 5);

ALTER TABLE "BookingWaitlist"
  ADD CONSTRAINT "BookingWaitlist_valid_time_range" CHECK ("endTime" > "startTime"),
  ADD CONSTRAINT "BookingWaitlist_valid_status" CHECK (
    "status" IN ('active', 'notified', 'fulfilled', 'expired')
  );

ALTER TABLE "Club"
  ADD CONSTRAINT "Club_valid_booking_duration" CHECK (
    "bookingDuration" IS NULL OR "bookingDuration" BETWEEN 30 AND 240
  ),
  ADD CONSTRAINT "Club_valid_booking_payment_mode" CHECK (
    "bookingPaymentMode" IS NULL OR "bookingPaymentMode" IN ('online', 'presential', 'both')
  );

-- Evitar solapamientos incluso si dos instancias intentan reservar a la vez.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_active_overlap"
  EXCLUDE USING gist (
    "courtId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" <> 'cancelled');
