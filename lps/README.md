# Lesson Plan Approval System

A full-stack app for managing the teacher → department head → director
lesson plan approval workflow.

```
lesson-plan-system/
├── backend/   Node.js + Express + MySQL API (JWT auth, file uploads)
└── frontend/  React (Vite) single-page app
```

## 1. Database

Install MySQL locally (or point at a remote instance), then from `backend/`:

```bash
cp .env.example .env        # edit DB_USER / DB_PASSWORD / JWT_SECRET
npm install
npm run migrate              # creates the database + tables
npm run seed                 # optional: adds one demo user per role
```

To enable the AI lesson plan assistant (teachers generate a draft from a
short brief on the Create Lesson page), also set `ANTHROPIC_API_KEY` in
`backend/.env` (get a key at https://console.anthropic.com/settings/keys).
Without it, every other feature works as before — the `/ai/generate-lesson-plan`
endpoint just returns a 503 explaining it isn't configured.

Seeded demo accounts (if you ran `npm run seed`), all sharing the password `Password123!`:

| Role             | Email                  |
|------------------|------------------------|
| Teacher          | teacher@example.com    |
| Department Head  | depthead@example.com   |
| Director         | director@example.com   |

Both demo teacher and department head accounts are in the "Mathematics"
department, so the department head will see that teacher's submissions.

## 2. Backend API

```bash
cd backend
npm install
npm run dev      # http://localhost:5000
```

Key endpoints (all under `/api`, JWT required except auth):

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /lesson-plans` (scoped by role), `GET /lesson-plans/:id`
- `POST /lesson-plans` (multipart, `file` field for PDF/DOCX), `PUT /lesson-plans/:id`, `DELETE /lesson-plans/:id`
- `POST /lesson-plans/:id/submit`
- `POST /lesson-plans/:id/department-review` `{ action: "approved"|"rejected", comment }`
- `POST /lesson-plans/:id/director-review` same shape
- `GET /notifications`, `PATCH /notifications/:id/read`
- `GET /reports/summary`
- `POST /ai/generate-lesson-plan` (teacher only) `{ subject, gradeLevel?, topic, duration?, notes? }` →
  `{ draft: { title, objective, content } }`. Drafts text only — it does not save
  a lesson plan. The frontend drops the result into the Create Lesson form for
  the teacher to review/edit before saving via the existing endpoints above.

## 3. Frontend

```bash
cd frontend
cp .env.example .env    # points at the backend URL
npm install
npm run dev      # http://localhost:5173
```

## Notes on design decisions

- **`status` vs `current_stage`**: `lesson_plans.status` records the most
  recent outcome (`draft`, `pending`, `dept_approved`, etc.), while
  `current_stage` records who currently owns the plan
  (`with_teacher`, `with_department_head`, `with_director`, `completed`).
  This keeps "what's in my queue" queries simple without overloading
  one field with two meanings.
- **Rejection loop**: a rejected plan goes back to `current_stage =
  'with_teacher'` with its original status preserved (`dept_rejected` /
  `director_rejected`). The teacher edits the same record and resubmits
  it (`POST /:id/submit`), which re-enters the department head's queue.
  The `version` / `parent_plan_id` columns are in the schema if you'd
  rather snapshot each revision as its own row instead of editing in place.
- **Department scoping**: `users.department` and `lesson_plans.department`
  were added (not in the original spec) so a Department Head's queue can
  be filtered to their own department's teachers, per the requirement
  that they "view lesson plans submitted by teachers in their department."
- File uploads are stored on local disk under `backend/uploads/` and
  served statically at `/uploads/<filename>`. Swap `middleware/upload.js`
  for an S3-backed storage driver if you need this to survive redeploys.
- **AI lesson plan assistant**: `POST /ai/generate-lesson-plan` is a thin,
  stateless wrapper around the Anthropic API (`backend/src/services/aiService.js`).
  It takes a short brief (subject/topic/grade/duration/notes), asks the model
  for a `{ title, objective, content }` JSON object, and returns that straight
  to the frontend — nothing is written to the database by this endpoint. The
  teacher still goes through the normal `POST /lesson-plans` (save as draft)
  and `POST /:id/submit` flow once they're happy with the (editable) draft.
  Uses Node's built-in `fetch`, so no new dependency was needed.

## Known limitation in this environment

This sandbox has no network access and no running MySQL server, so
`npm install` and a live end-to-end run could not be executed here.
Every backend file passed `node --check` and every frontend file passed
an `esbuild` syntax/JSX parse, but you should run `npm install` and test
against a real MySQL instance before deploying.
