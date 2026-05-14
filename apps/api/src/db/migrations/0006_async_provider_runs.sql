ALTER TABLE "scan_jobs" DROP CONSTRAINT IF EXISTS "status_check";--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "status_check" CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'auth_required', 'captcha_required', 'blocked'));--> statement-breakpoint
ALTER TABLE "scan_runs" DROP CONSTRAINT IF EXISTS "scan_run_status_check";--> statement-breakpoint
ALTER TABLE "scan_runs" ADD CONSTRAINT "scan_run_status_check" CHECK ("status" IN ('pending','processing','completed','failed','ready_partial'));
