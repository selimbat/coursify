CREATE TYPE "public"."last_modified_by_user" AS ENUM('user_a', 'user_b');--> statement-breakpoint
CREATE TYPE "public"."list_status" AS ENUM('ongoing', 'pending', 'done');--> statement-breakpoint
CREATE TABLE "lists" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"status" "list_status" DEFAULT 'ongoing' NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"is_template" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL,
	"last_modified_by" "last_modified_by_user"
);
