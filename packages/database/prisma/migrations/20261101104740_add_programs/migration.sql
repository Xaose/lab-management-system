CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

ALTER TABLE "groups" ADD COLUMN "program_id" TEXT;
ALTER TABLE "students" ADD COLUMN "program_id" TEXT;
ALTER TABLE "teachers" ALTER COLUMN "position" DROP NOT NULL;

ALTER TABLE "groups" ADD CONSTRAINT "groups_program_id_fkey"
  FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_program_id_fkey"
  FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
