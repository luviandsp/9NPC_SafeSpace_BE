ALTER TABLE "admin" RENAME COLUMN "profilePicture" TO "profilePicturePath";--> statement-breakpoint
ALTER TABLE "user" RENAME COLUMN "profilePicture" TO "profilePicturePath";--> statement-breakpoint
ALTER TABLE "admin" ALTER COLUMN "id" DROP DEFAULT;