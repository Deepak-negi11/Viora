-- Preserve the existing hard-coded office layout for every room created before templates.
ALTER TABLE "Space"
ADD COLUMN "mapTemplate" TEXT NOT NULL DEFAULT 'classic-office';
