-- Keep publication metadata consistent with the lab work status.
CREATE OR REPLACE FUNCTION set_lab_work_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND (
    TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'PUBLISHED'
  ) THEN
    NEW.published_at = COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
  ELSIF NEW.status <> 'PUBLISHED' THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_work_published_at_trigger
BEFORE INSERT OR UPDATE OF status ON lab_works
FOR EACH ROW
EXECUTE FUNCTION set_lab_work_published_at();

-- Notify students in assigned groups when a lab work becomes available.
CREATE OR REPLACE FUNCTION notify_lab_work_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND (
    TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'PUBLISHED'
  ) THEN
    INSERT INTO notifications (
      id, user_id, type, text, related_type, related_id, is_read, created_at
    )
    SELECT
      md5(NEW.id || s.id || clock_timestamp()::text),
      u.id,
      'LAB_PUBLISHED',
      'Опубликована новая лабораторная работа: «' || NEW.title || '».',
      'LabWork',
      NEW.id,
      false,
      CURRENT_TIMESTAMP
    FROM discipline_groups dg
    JOIN students s ON s.group_id = dg.group_id
    JOIN users u ON u.id = s.user_id
    WHERE dg.discipline_id = NEW.discipline_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lab_work_published_notification_trigger
AFTER INSERT OR UPDATE OF status ON lab_works
FOR EACH ROW
EXECUTE FUNCTION notify_lab_work_published();

-- Notify all teachers responsible for a discipline about a new submission.
CREATE OR REPLACE FUNCTION notify_submission_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SUBMITTED' AND (
    TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'SUBMITTED'
  ) THEN
    INSERT INTO notifications (
      id, user_id, type, text, related_type, related_id, is_read, created_at
    )
    SELECT DISTINCT
      md5(NEW.id || t.user_id || clock_timestamp()::text),
      t.user_id,
      'SUBMISSION_RECEIVED',
      'Студент отправил работу «' || lw.title || '» на проверку.',
      'Submission',
      NEW.id,
      false,
      CURRENT_TIMESTAMP
    FROM lab_works lw
    JOIN disciplines d ON d.id = lw.discipline_id
    JOIN teachers t ON t.id = d.created_by_id OR EXISTS (
      SELECT 1
      FROM discipline_teachers dt
      WHERE dt.discipline_id = d.id AND dt.teacher_id = t.id
    )
    WHERE lw.id = NEW.lab_work_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_received_notification_trigger
AFTER INSERT OR UPDATE OF status ON submissions
FOR EACH ROW
EXECUTE FUNCTION notify_submission_received();

-- Notify a student whenever a teacher creates or changes a review.
CREATE OR REPLACE FUNCTION notify_review_result()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR OLD.result IS DISTINCT FROM NEW.result OR OLD.score IS DISTINCT FROM NEW.score THEN
    INSERT INTO notifications (
      id, user_id, type, text, related_type, related_id, is_read, created_at
    )
    SELECT
      md5(NEW.id || s.student_id || clock_timestamp()::text),
      u.id,
      CASE WHEN NEW.result = 'REVISION' THEN 'REVISION_REQUIRED' ELSE 'REVIEW_COMPLETED' END,
      CASE
        WHEN NEW.result = 'REVISION'
          THEN 'Работа возвращена на доработку.'
        ELSE 'Работа проверена преподавателем.'
      END,
      'Submission',
      s.id,
      false,
      CURRENT_TIMESTAMP
    FROM submissions s
    JOIN students st ON st.id = s.student_id
    JOIN users u ON u.id = st.user_id
    WHERE s.id = NEW.submission_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER review_result_notification_trigger
AFTER INSERT OR UPDATE OF result, score ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_review_result();
