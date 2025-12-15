-- CreateTable
CREATE TABLE "TherapySession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetText" TEXT NOT NULL,
    "transcribedText" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "accuracy" REAL NOT NULL,
    "clarityScore" REAL NOT NULL,
    "overallScore" REAL NOT NULL,
    "wordAnalysis" TEXT NOT NULL DEFAULT '[]',
    "phonemeIssues" TEXT NOT NULL DEFAULT '[]',
    "recommendations" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'easy',
    "category" TEXT NOT NULL DEFAULT 'General',
    "emotion" TEXT NOT NULL DEFAULT 'neutral',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TherapySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
