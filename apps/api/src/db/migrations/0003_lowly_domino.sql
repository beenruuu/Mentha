ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "plan" SET DEFAULT 'pro';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "credit_balance" SET DEFAULT 5000;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "daily_quota" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "credit_transactions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "tenant_id" SET DATA TYPE text;