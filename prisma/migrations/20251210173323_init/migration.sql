-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationCode" TEXT,
    "verificationCodeExpiresAt" DATETIME,
    "disabilityType" TEXT NOT NULL DEFAULT 'other',
    "disabilitySeverity" INTEGER NOT NULL DEFAULT 5,
    "triggerWords" TEXT NOT NULL DEFAULT '[]',
    "disabilityDescription" TEXT,
    "voiceId" TEXT NOT NULL DEFAULT '21m00Tcm4TlvDq8ikWAM',
    "speed" REAL NOT NULL DEFAULT 1.0,
    "fontMode" TEXT NOT NULL DEFAULT 'default',
    "textSize" TEXT NOT NULL DEFAULT 'normal',
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
