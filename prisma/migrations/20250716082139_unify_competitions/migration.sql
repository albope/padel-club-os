/*
  Warnings:

  - You are about to drop the column `jornada` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `leagueId` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `summaryAI` on the `Match` table. All the data in the column will be lost.
  - You are about to drop the column `leagueId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the `League` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[competitionId,player1Id,player2Id]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `competitionId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roundNumber` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `competitionId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CompetitionFormat" AS ENUM ('LEAGUE', 'KNOCKOUT', 'GROUP_AND_KNOCKOUT');

-- DropForeignKey
ALTER TABLE "League" DROP CONSTRAINT "League_clubId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_leagueId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_leagueId_fkey";

-- DropIndex
DROP INDEX "Team_leagueId_player1Id_player2Id_key";

-- AlterTable
ALTER TABLE "Match" DROP COLUMN "jornada",
DROP COLUMN "leagueId",
DROP COLUMN "round",
DROP COLUMN "summaryAI",
ADD COLUMN     "competitionId" TEXT NOT NULL,
ADD COLUMN     "roundName" TEXT,
ADD COLUMN     "roundNumber" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "leagueId",
ADD COLUMN     "competitionId" TEXT NOT NULL,
ADD COLUMN     "group" TEXT;

-- DropTable
DROP TABLE "League";

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "format" "CompetitionFormat" NOT NULL DEFAULT 'LEAGUE',
    "groupSize" INTEGER,
    "teamsPerGroupToAdvance" INTEGER,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_competitionId_player1Id_player2Id_key" ON "Team"("competitionId", "player1Id", "player2Id");

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
