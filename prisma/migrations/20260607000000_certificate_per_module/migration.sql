-- Switch Certificate from being tied to a Quiz to being tied to a Module.
-- Certificates are now issued per module (after all module quizzes are passed
-- with a perfect score) instead of per individual quiz.

-- Drop old quiz-based constraints/index/column
ALTER TABLE "Certificate" DROP CONSTRAINT IF EXISTS "Certificate_quizId_fkey";
DROP INDEX IF EXISTS "Certificate_userId_quizId_key";
ALTER TABLE "Certificate" DROP COLUMN IF EXISTS "quizId";

-- Add new module-based column
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;

-- Backfill is not possible automatically; existing rows (if any) must be cleared.
DELETE FROM "Certificate" WHERE "moduleId" IS NULL;

ALTER TABLE "Certificate" ALTER COLUMN "moduleId" SET NOT NULL;

-- New unique constraint + FK
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_userId_moduleId_key" ON "Certificate"("userId", "moduleId");
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
