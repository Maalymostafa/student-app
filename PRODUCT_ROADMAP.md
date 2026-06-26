# Academy Management System Product Roadmap

## Product Direction

The Academy Management System is a web application for small and medium English learning centers.
It is not a generic learning management system. It is designed around the daily workflow of an English academy.

The main success metric is reducing repetitive manual administration.

## Main Goals

The system should automate and simplify:

- Student registration
- Parent communication
- Class scheduling
- Attendance
- Payments
- Grades
- Homework
- Reports
- Notifications
- Teacher management

Automation should be preferred while still allowing manual control.

## User Roles

### Administrator

Full access to manage students, parents, teachers, courses, sessions, payments, notifications, reports, and automation settings.

### Teacher

Can view assigned classes, take attendance, enter grades, upload homework, and add notes.
Teachers cannot modify financial information.

### Parent

Can view child information, attendance, grades, homework, payment balance, and receive notifications.

### Student

Can view lessons, homework, grades, attendance, and download study materials.

## Core Modules

1. Dashboard
2. Authentication and roles
3. Students
4. Parents
5. Teachers
6. Courses
7. Sessions
8. Attendance
9. Grades
10. Homework
11. Payments
12. Notifications
13. Automation rules
14. Reports
15. Global search

## Dashboard

The dashboard should show:

- Today's sessions
- Today's attendance
- Today's payments
- Students absent today
- Upcoming reminders
- Recent registrations
- Quick actions

## Student Records

Student data should include:

- Student ID
- Full name
- Date of birth
- Gender
- School grade
- Parent
- Phone
- WhatsApp number
- Email
- Address
- Registration date
- Current status
- Medical notes
- Emergency contact
- Student notes

## Registration Intake

The first real workflow to replace is the current Google Form and Google Sheet registration process.

Current process:

- Parents or students submit a Google Form.
- The responses collect in a Google Sheet.
- The administrator manually checks each payment photo.
- The administrator manually sends a reservation confirmation.
- The administrator manually sends the student code.

AMS should replace this with:

- A pending registration queue.
- Payment proof review.
- One-click reservation confirmation.
- Student code generation.
- Automatic or semi-automatic confirmation messages.
- Conversion from approved registration to student record.

## Parent Records

Parent data should include:

- Parent name
- Phone
- WhatsApp
- Email
- Occupation
- Address
- Relationship
- Children
- Balance summary

## Notifications

Notifications are the heart of the application.

Every notification should eventually support:

- Automatic sending
- Manual sending
- Scheduled sending
- Bulk sending
- Individual sending

Channels:

- WhatsApp
- Email
- SMS later

Examples:

- Registration confirmation
- Session reminder
- Homework reminder
- Grade notification
- Payment reminder
- Course completion
- Holiday announcements

## Automation Rules

Examples:

- If a student registers, send a confirmation message.
- If a session starts tomorrow, send a reminder.
- If payment is overdue, send a payment reminder.
- If a teacher enters a grade, notify the parent.
- If homework is uploaded, notify students.

Automation should be configurable.

## Technical Direction

Current foundation:

- Node.js
- Express
- HTML
- CSS
- JavaScript
- Git

Planned direction:

- React frontend
- PostgreSQL database
- JWT authentication
- GitHub workflow
- Local storage during development, cloud later

## UI Requirements

The product should feel:

- Modern
- Responsive
- Fast
- Simple
- Professional
- Mobile friendly

Future UI requirements:

- Dark mode
- Arabic and English support

## Development Rules

- Build one module at a time.
- Never break existing functionality.
- Commit after each completed feature.
- Keep frontend and backend concerns separated.
- Use consistent naming conventions.
- Document important APIs and workflows.
- Add tests where practical.
- Keep the codebase scalable.

## Long-Term Vision

The system should eventually support multiple academies.
Each academy should have its own data, teachers, students, and branding while sharing the same application platform.
