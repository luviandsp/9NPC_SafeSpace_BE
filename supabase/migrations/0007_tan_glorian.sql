CREATE TABLE "report_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reportId" uuid NOT NULL,
	"oldStatus" "report_status_enum",
	"newStatus" "report_status_enum" NOT NULL,
	"changedBy" uuid,
	"changedByRole" varchar(10) NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_reportId_report_id_fk" FOREIGN KEY ("reportId") REFERENCES "public"."report"("id") ON DELETE cascade ON UPDATE no action;