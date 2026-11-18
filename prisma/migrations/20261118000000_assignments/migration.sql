CREATE TABLE "Assignment" (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "testId" TEXT,
  "questions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submittedAt" TIMESTAMP(3),
  "answer" TEXT,
  "photo" BYTEA,
  "photoType" TEXT,
  "score" INTEGER,
  "total" INTEGER,
  "pauses" INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX "Assignment_studentId_createdAt_idx" ON "Assignment"("studentId", "createdAt");
CREATE INDEX "Assignment_ownerId_createdAt_idx" ON "Assignment"("ownerId", "createdAt");
