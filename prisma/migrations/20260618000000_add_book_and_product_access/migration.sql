-- Additive only. Existing access (UserCourseAccess) is untouched.

-- InviteToken: support book invites alongside course invites
ALTER TABLE "InviteToken" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'course';
ALTER TABLE "InviteToken" ALTER COLUMN "courseId" DROP NOT NULL;

-- Book
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "coverUrl" TEXT,
    "pdfUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- BookChapter
CREATE TABLE "BookChapter" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BookChapter_pkey" PRIMARY KEY ("id")
);

-- ProductAccess (per-user entitlements: 'book' | 'ai')
CREATE TABLE "ProductAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAccess_userId_product_key" ON "ProductAccess"("userId", "product");

ALTER TABLE "BookChapter" ADD CONSTRAINT "BookChapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAccess" ADD CONSTRAINT "ProductAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
