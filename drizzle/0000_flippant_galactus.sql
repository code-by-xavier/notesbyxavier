CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"slug" varchar(255) NOT NULL,
	"category" varchar(50) DEFAULT 'Essays' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"excerpt" text DEFAULT '' NOT NULL,
	"tags" text[],
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"reading_time" varchar(50) DEFAULT '1 min read' NOT NULL,
	"cover_image" text,
	"cover_image_alt" text,
	"author_id" uuid NOT NULL,
	"published_at" timestamp,
	"has_unpublished_changes" boolean DEFAULT false NOT NULL,
	"published_title" varchar(255),
	"published_subtitle" text,
	"published_content" text,
	"published_category" varchar(50),
	"published_cover_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"is_setup_completed" boolean DEFAULT false NOT NULL,
	"site_title" varchar(255) DEFAULT 'Notesby' NOT NULL,
	"author_name" varchar(255) DEFAULT 'Jane Doe' NOT NULL,
	"author_bio" text,
	"author_avatar" text,
	"site_logo" text,
	"favicon" text,
	"apple_touch_icon" text,
	"og_image" text,
	"copyright_text" text,
	"post_bottom_copy" text,
	"about_text" text,
	"legal_entity_name" varchar(255),
	"privacy_policy_text" text,
	"terms_of_service_text" text,
	"ai_policy_text" text,
	"domain" varchar(255) DEFAULT 'https://example.com',
	"description" text,
	"twitter_url" varchar(255),
	"linkedin_url" varchar(255),
	"github_url" varchar(255),
	"contact_email" varchar(255),
	"subscription_enabled" boolean DEFAULT true,
	"subscription_section_headline" varchar(255),
	"subscription_section_subtext" text,
	"subscription_section_cta_label" varchar(100),
	"subscription_popup_enabled" boolean DEFAULT true,
	"subscription_popup_headline" varchar(255),
	"subscription_popup_subtext" text,
	"subscription_confirmed_headline" varchar(255),
	"subscription_confirmed_subtext" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"source" varchar(20) DEFAULT 'section' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;