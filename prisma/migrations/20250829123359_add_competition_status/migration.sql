-- CreateEnum
CREATE TYPE "CompetitionStatus" AS ENUM ('ACTIVE', 'FINISHED');

-- AlterTable
ALTER TABLE "Competition" ADD COLUMN     "status" "CompetitionStatus" NOT NULL DEFAULT 'ACTIVE';
