ALTER TABLE "profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "role" text DEFAULT 'user';--> statement-breakpoint
CREATE INDEX "idx_profiles_email" ON "profiles" USING btree ("email");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "role_check" CHECK (role IN ('user', 'admin'));