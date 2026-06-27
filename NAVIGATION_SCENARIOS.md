# AMS Navigation Scenario Sheet

This sheet tracks user paths that must stay reachable, reversible, and role-safe.

## Roles Tested

- Administrator
- Teacher
- Parent
- Student

## Core Scenarios

| Scenario | Start | Expected path | Status |
| --- | --- | --- | --- |
| Admin daily work | Login as admin | Dashboard -> payments, registrations, grading, attendance, reports, notifications | Passing |
| Teacher session work | Login as teacher | Dashboard -> attendance, quizzes, grading, support inbox, notifications | Passing |
| Parent follow-up | Login as parent | Parent portal -> child results, payments, notifications, support archive | Passing |
| Student study flow | Login as student | Dashboard -> my results, take quiz, upload answers, payments, notifications | Passing |
| Public registration | Login page | New registration -> back to login | Passing |
| Style choice | Dashboard | Style preview -> back to dashboard | Passing |
| Old language demo | Direct /i18n-demo | Redirects to dashboard instead of 404 | Fixed |

## Role Safety Checks

| Page | Admin | Teacher | Parent | Student |
| --- | --- | --- | --- | --- |
| /dashboard | Allowed | Allowed | Allowed | Allowed |
| /notifications | Allowed | Allowed | Allowed | Allowed |
| /payments | Allowed | Allowed | Allowed | Allowed |
| /my-results | Allowed | Allowed | Allowed | Allowed |
| /session-work | Allowed | Allowed | Allowed | Allowed |
| /take-quiz | Allowed | Allowed | Allowed | Allowed |
| /support-inbox | Allowed | Allowed | Redirects to dashboard | Redirects to dashboard |
| /attendance | Allowed | Allowed | Redirects to dashboard | Redirects to dashboard |
| /quizzes | Allowed | Allowed | Redirects to dashboard | Redirects to dashboard |
| /grading | Allowed | Allowed | Redirects to dashboard | Redirects to dashboard |
| /registrations | Allowed | Allowed | Redirects to dashboard | Redirects to dashboard |
| /students | Allowed | Redirects to dashboard | Redirects to dashboard | Redirects to dashboard |
| /staff | Allowed | Redirects to dashboard | Redirects to dashboard | Redirects to dashboard |
| /reports | Allowed | Redirects to dashboard | Redirects to dashboard | Redirects to dashboard |

## Remaining UX Risks

- Parent support is reachable from the parent portal, but students do not yet have a dedicated support page.
- Some pages are role-safe but not tailored enough after redirect; a student who opens a staff-only URL is simply sent to the dashboard.
- Notifications are in-app only; WhatsApp/SMS/Email delivery still needs external provider integration.
- The public registration page is intentionally reachable while logged in, but later we may show a warning when staff opens it.
