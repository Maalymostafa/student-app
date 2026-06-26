# Academy Management System

A web application for managing academy students, parents, sessions, payments, and notifications.

See `PRODUCT_ROADMAP.md` for the full product direction and module plan.
See `REGISTRATION_WORKFLOW.md` for the Google Form and Google Sheet workflow that AMS is replacing.
See `ATTENDANCE_GRADING_WORKFLOW.md` for the Zoom chat attendance and Q1/Q2 grading workflow.
See `COMMUNICATION_SUPPORT_WORKFLOW.md` for the internal support channel, Miss Hoda, assistant teachers, manager, and AI reply workflow.

## Run locally

```bash
npm start
```

Open `http://localhost:3000` in your browser.

Key pages:

- Dashboard: `http://localhost:3000/dashboard`
- Pending registrations: `http://localhost:3000/registrations`
- Students: `http://localhost:3000/students`
- Zoom attendance: `http://localhost:3000/attendance`
- Assistant grading: `http://localhost:3000/grading`
- Student results: `http://localhost:3000/my-results`
- Parent portal: `http://localhost:3000/parent-portal`
- Support inbox: `http://localhost:3000/support-inbox`

Student codes are generated from the school grade plus a hexadecimal sequence:
`g4`, `g5`, `g6`, `p1`, or `p2` + four hex digits + `h`.
Example: `p20064h`.

## Demo login

All demo accounts use the password `password123`.

- Administrator: `admin@academy.test`
- Teacher: `teacher@academy.test`
- Parent: `parent@academy.test`
- Student: `student@academy.test`
