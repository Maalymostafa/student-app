# Attendance And Grading Workflow

## Current Google Sheet

Reference sheet:

https://docs.google.com/spreadsheets/d/15RDG22wiRDfq4ARmoJ3F7VNkE-mCC0Z0HwgwI0WsXUo/edit?gid=587568747#gid=587568747

Observed structure:

- Students are listed in rows.
- Sessions are arranged as grouped columns, such as Session1, Session2, Session3, and Session4.
- Each session group includes Q1, Q2, and attendance/performance values.
- Student names can be Arabic.

## Current Attendance Process

Zoom attendance is recorded automatically through the Zoom meeting chat.

Current process:

1. Student joins the Zoom meeting.
2. Student writes their student code in the Zoom chat.
3. The Zoom chat is exported as a text file.
4. The administrator uploads the chat text file.
5. The system reads the chat text.
6. The system matches student codes to students.
7. The system marks attendance automatically.

## Current Grading Process

Each session has two questions.

Current process:

1. Assigned teachers receive the two questions as pictures of handwriting.
2. Teachers correct the answers.
3. Teachers enter the degree for each question.
4. Each question can only have one of three scores:
   - `0` means wrong answer.
   - `1` means right idea but incomplete answer.
   - `2` means correct answer.

## Product Goal

AMS should replace manual spreadsheet updating with an attendance and grading module.

The system should eventually:

- Import Zoom chat text files.
- Extract student codes from chat messages.
- Match codes to student records.
- Mark session attendance automatically.
- Show unmatched codes for manual review.
- Let assigned teachers grade Q1 and Q2.
- Restrict question scores to `0`, `1`, or `2`.
- Calculate session performance automatically.
- Store grades per student per session.
- Generate parent/student grade notifications later.

## Kid-Friendly Grade Display

AMS should include a fun grade page for students.

The page should:

- Show grades in a cheerful, child-friendly way.
- Encourage students who got perfect or high scores.
- Motivate students who need improvement without making them feel bad.
- Make progress feel like a game or achievement.
- Support positive messages from Miss Hoda and assistant teachers.
- Avoid harsh wording for low scores.

Examples:

- Perfect score: strong celebration and encouragement.
- Medium score: praise the effort and show what to improve.
- Low score: gentle motivation and a clear next step.

## First Build Slice

Build a session grading page with:

- Session list.
- Student rows.
- Q1 and Q2 score controls with only `0`, `1`, and `2`.
- Attendance status.
- Performance calculation.
- Assistant teacher correction interface for webinar photo submissions.
- Separate photo review areas for Q1 and Q2.

Then build Zoom chat import:

- Upload or paste Zoom chat text.
- Parse student codes.
- Mark attendance.
- Show matched and unmatched codes.
