ALTER TABLE "user" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "phoneNumber" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "nim" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "department" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "faculty" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "enrollmentYear" DROP NOT NULL;