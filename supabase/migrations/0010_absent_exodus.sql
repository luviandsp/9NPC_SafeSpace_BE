ALTER TABLE "preference" RENAME COLUMN "emailReportStatus" TO "emailStatusUpdate";--> statement-breakpoint
ALTER TABLE "preference" RENAME COLUMN "emailMonthlySummary" TO "emailSecurityAlert";--> statement-breakpoint
ALTER TABLE "preference" RENAME COLUMN "emailNewArticle" TO "emailNewArticles";--> statement-breakpoint
ALTER TABLE "preference" RENAME COLUMN "browserReportStatus" TO "pushStatusUpdate";--> statement-breakpoint
ALTER TABLE "preference" RENAME COLUMN "browserSecurity" TO "pushSecurityAlert";