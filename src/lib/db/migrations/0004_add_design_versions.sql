CREATE TABLE IF NOT EXISTS "design_versions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer,
  "name" varchar(255) NOT NULL,
  "settings" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "chart_type" varchar(50),
  "is_built_in" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
