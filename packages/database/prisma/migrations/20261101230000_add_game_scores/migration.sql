CREATE TABLE "game_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "crystals" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "game_scores_score_played_at_idx" ON "game_scores"("score", "played_at");
CREATE INDEX "game_scores_user_id_score_idx" ON "game_scores"("user_id", "score");

ALTER TABLE "game_scores"
ADD CONSTRAINT "game_scores_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
