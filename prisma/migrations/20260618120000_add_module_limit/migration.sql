-- Additive: module-limited access (downsell: book + first N modules).
-- null = full course (existing rows unaffected).
ALTER TABLE "UserCourseAccess" ADD COLUMN "moduleLimit" INTEGER;
ALTER TABLE "InviteToken" ADD COLUMN "moduleLimit" INTEGER;
