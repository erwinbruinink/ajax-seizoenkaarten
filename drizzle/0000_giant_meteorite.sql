CREATE TYPE "public"."match_status" AS ENUM('SCHEDULED', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."seat_status" AS ENUM('PENDING', 'CONFIRMED', 'RESALE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'CHILD', 'FRIEND');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"opponent" varchar(100) NOT NULL,
	"competition" varchar(100) DEFAULT 'Eredivisie' NOT NULL,
	"date_time" timestamp with time zone NOT NULL,
	"is_home" boolean DEFAULT true NOT NULL,
	"status" "match_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seat_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"seat_number" integer NOT NULL,
	"user_id" integer,
	"guest_name" varchar(100),
	"status" "seat_status" DEFAULT 'PENDING' NOT NULL,
	"ticket_transferred" boolean DEFAULT false NOT NULL,
	"resale_price" numeric(8, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" "user_role" NOT NULL,
	"pin_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seat_allocations" ADD CONSTRAINT "seat_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
