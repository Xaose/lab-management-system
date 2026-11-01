ALTER TABLE "users" ADD COLUMN "password_changed" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "password_resets" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "used_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "password_resets_user_id_expires_at_idx" ON "password_resets"("user_id", "expires_at");
