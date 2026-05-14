CREATE TABLE "user_api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text DEFAULT 'openrouter' NOT NULL,
	"key_encrypted" text NOT NULL,
	"key_preview" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "provider_check" CHECK (provider IN ('openrouter'))
);
--> statement-breakpoint
CREATE INDEX "idx_user_api_keys_user_provider" ON "user_api_keys" USING btree ("user_id","provider");