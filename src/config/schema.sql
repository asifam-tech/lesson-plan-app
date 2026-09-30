-- Lesson Plan Approval System — Schema
-- Run via `npm run migrate`, or execute this file directly against MySQL.

CREATE DATABASE IF NOT EXISTS lesson_plan_system
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE lesson_plan_system;

-- ---------------------------------------------------------------------
-- users
-- `department` ties teachers to a Department Head's review queue.
-- Department Heads and Directors also have a department value so a
-- head only sees plans from their own department's teachers.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'department_head', 'director') NOT NULL,
  department VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- lesson_plans
-- `status` captures the outcome of the most recent review action.
-- `current_stage` captures where the plan currently sits in the
-- workflow, which keeps queue queries simple (e.g. "give me everything
-- waiting on the department head") without overloading status.
-- `version` + `parent_plan_id` support the "rejected -> back to
-- teacher -> edited -> resubmitted" loop as a new revision rather than
-- mutating history away.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  teacher_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  objective TEXT,
  content TEXT,
  file_url VARCHAR(500) DEFAULT NULL,
  department VARCHAR(100) DEFAULT NULL,
  status ENUM(
    'draft',
    'pending',
    'dept_approved',
    'dept_rejected',
    'director_approved',
    'director_rejected'
  ) NOT NULL DEFAULT 'draft',
  current_stage ENUM(
    'with_teacher',
    'with_department_head',
    'with_director',
    'completed'
  ) NOT NULL DEFAULT 'with_teacher',
  version INT NOT NULL DEFAULT 1,
  parent_plan_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL DEFAULT NULL,
  CONSTRAINT fk_lesson_plans_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lesson_plans_parent
    FOREIGN KEY (parent_plan_id) REFERENCES lesson_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- reviews
-- One row per review action. A plan can have multiple rows over its
-- life (e.g. dept reject, teacher resubmits, dept approve, director
-- approve) which together form the approval history / audit trail.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_plan_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  role ENUM('department_head', 'director') NOT NULL,
  action ENUM('approved', 'rejected') NOT NULL,
  comment TEXT,
  review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_plan
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- notifications
-- Powers the Teacher's "Notifications" menu item (status changes,
-- comments) without polling reviews/lesson_plans directly.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_plan_id INT DEFAULT NULL,
  message VARCHAR(500) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_plan
    FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS curriculum_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  grade_level VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  file_url VARCHAR(500),
  extracted_text LONGTEXT,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE INDEX idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_stage ON lesson_plans(current_stage);
CREATE INDEX idx_lesson_plans_department ON lesson_plans(department);
CREATE INDEX idx_reviews_plan ON reviews(lesson_plan_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_curriculum_dept_subject ON curriculum_documents(department, subject);