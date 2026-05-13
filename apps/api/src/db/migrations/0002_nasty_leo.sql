ALTER TABLE "profiles" ALTER COLUMN "role" SET DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "plan" SET DEFAULT 'pro';--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "daily_quota" SET DEFAULT 100;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "credit_balance" SET DEFAULT 5000;