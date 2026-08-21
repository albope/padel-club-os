-- Mantener las extensiones fuera del esquema de aplicación expuesto.
CREATE SCHEMA IF NOT EXISTS "extensions";
ALTER EXTENSION "btree_gist" SET SCHEMA "extensions";

-- PostgreSQL no crea índices automáticamente en el lado que referencia una FK.
-- Estos índices aceleran joins y eliminaciones en cascada cuando crezca la base.
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "AdminInvitation_invitedById_idx" ON "AdminInvitation"("invitedById");
CREATE INDEX "Booking_recurringBookingId_idx" ON "Booking"("recurringBookingId");
CREATE INDEX "Team_player1Id_idx" ON "Team"("player1Id");
CREATE INDEX "Team_player2Id_idx" ON "Team"("player2Id");
CREATE INDEX "Match_competitionId_idx" ON "Match"("competitionId");
CREATE INDEX "Match_team1Id_idx" ON "Match"("team1Id");
CREATE INDEX "Match_team2Id_idx" ON "Match"("team2Id");
CREATE INDEX "OpenMatch_courtId_idx" ON "OpenMatch"("courtId");
CREATE INDEX "OpenMatchPlayer_userId_idx" ON "OpenMatchPlayer"("userId");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX "RecurringBooking_courtId_idx" ON "RecurringBooking"("courtId");
CREATE INDEX "RecurringBooking_userId_idx" ON "RecurringBooking"("userId");
CREATE INDEX "Broadcast_sentById_idx" ON "Broadcast"("sentById");
CREATE INDEX "BookingPayment_userId_idx" ON "BookingPayment"("userId");
CREATE INDEX "BookingPayment_collectedById_idx" ON "BookingPayment"("collectedById");
CREATE INDEX "ChatMessage_authorId_idx" ON "ChatMessage"("authorId");
CREATE INDEX "BookingWaitlist_userId_idx" ON "BookingWaitlist"("userId");
CREATE INDEX "CourtBlock_createdById_idx" ON "CourtBlock"("createdById");
