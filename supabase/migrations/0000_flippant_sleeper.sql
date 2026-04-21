CREATE TYPE "public"."report_status_enum" AS ENUM('RECEIVED', 'PROCESS', 'REVIEW', 'ASSISTANCE', 'REJECTED', 'DONE');--> statement-breakpoint
CREATE TABLE "admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"profilePicture" text,
	"email" varchar(255) NOT NULL,
	"unit" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "evidence_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reportId" uuid NOT NULL,
	"evidencePath" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"adminId" uuid,
	"emailReportStatus" boolean DEFAULT true NOT NULL,
	"emailWeeklySummary" boolean DEFAULT false NOT NULL,
	"emailMonthlySummary" boolean DEFAULT true NOT NULL,
	"emailNewArticle" boolean DEFAULT false NOT NULL,
	"browserReportStatus" boolean DEFAULT true NOT NULL,
	"browserSecurity" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"adminId" uuid,
	"reportCode" varchar(255) NOT NULL,
	"incident" varchar(255) NOT NULL,
	"date" timestamp NOT NULL,
	"location" varchar(255) NOT NULL,
	"incidentDesc" text NOT NULL,
	"perpreatorDesc" text NOT NULL,
	"status" "report_status_enum" DEFAULT 'RECEIVED' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "report_reportCode_unique" UNIQUE("reportCode")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"profilePicture" text,
	"email" varchar(255) NOT NULL,
	"phoneNumber" varchar(50) NOT NULL,
	"nim" varchar(50) NOT NULL,
	"department" varchar(255) NOT NULL,
	"faculty" varchar(255) NOT NULL,
	"enrollmentYear" smallint NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_nim_unique" UNIQUE("nim")
);
--> statement-breakpoint
ALTER TABLE "evidence_asset" ADD CONSTRAINT "evidence_asset_reportId_report_id_fk" FOREIGN KEY ("reportId") REFERENCES "public"."report"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preference" ADD CONSTRAINT "preference_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preference" ADD CONSTRAINT "preference_adminId_admin_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_adminId_admin_id_fk" FOREIGN KEY ("adminId") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;