CREATE TABLE "scan_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"status" text DEFAULT 'pending',
	"total_jobs" integer DEFAULT 0,
	"completed_jobs" integer DEFAULT 0,
	"visible_count" integer DEFAULT 0,
	"overall_sentiment" real,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "scan_run_status_check" CHECK (status IN ('pending','processing','completed','failed'))
);
--> statement-breakpoint
ALTER TABLE "scan_jobs" DROP CONSTRAINT "engine_check";--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD COLUMN "run_id" uuid;--> statement-breakpoint
CREATE INDEX "idx_scan_runs_project_id" ON "scan_runs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_scan_jobs_run_id" ON "scan_jobs" USING btree ("run_id");--> statement-breakpoint
ALTER TABLE "scan_jobs" ADD CONSTRAINT "engine_check" CHECK (engine IN ('perplexity', 'openai', 'gemini', 'claude', 'openrouter'));