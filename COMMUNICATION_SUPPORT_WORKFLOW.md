# Communication And Support Workflow

## People And Responsibilities

### Miss Hoda Ismail

Miss Hoda Ismail is the main teacher.
She conducts the sessions and is the central academic authority for the class.

### Assistant Teachers

Each grade can have assigned assistant teachers.

Assistant teachers help Miss Hoda with:

- Grades
- Student questions during sessions
- Student questions after sessions
- Reviewing handwritten answers
- Supporting students and parents

### Manager

Miss Hoda's manager is responsible for communication access control.

The manager handles:

- Letting people into communication groups/channels
- Removing people from groups/channels
- Managing parent/student communication access
- Supervising support routing

## Current Communication Problem

Communication currently depends on WhatsApp groups.

This creates manual work:

- Parents and students ask repeated questions.
- Technical support, assistants, Miss Hoda, and the manager may receive the same questions many times.
- Someone must manually add or remove people from WhatsApp groups.
- It is hard to keep communication organized by grade, student, or issue type.
- It is hard to know who should answer each question.

## Product Goal

AMS should eventually provide a built-in communication channel instead of relying only on WhatsApp groups.

The system should allow parents or students to communicate with:

- Technical support
- Assistant teachers
- Miss Hoda Ismail
- Miss Hoda's manager

## Communication Channels

The product should support internal channels such as:

- Parent support channel
- Student support channel
- Grade-specific channels
- Session-specific channels
- Technical support channel
- Academic questions channel
- Management/admin channel

## AI Support

AMS should include AI support for repeated questions.

The AI should:

- Detect repeated or common questions.
- Suggest a ready answer.
- Answer directly when the question is safe and already covered by academy rules.
- Route unclear questions to the correct person.
- Avoid answering sensitive cases without human review.

Examples of repeated questions:

- Session time
- Zoom link
- Homework location
- Payment deadline
- Student code
- Attendance question
- Grade question
- Technical login problem

## Routing Rules

Questions should be routed by type:

- Technical issues go to technical support.
- Grade questions go to the assistant teacher or Miss Hoda.
- Session questions go to the assigned assistant teacher.
- Group/access questions go to the manager.
- Sensitive parent complaints go to the manager or Miss Hoda.

## First Build Slice

Build a simple internal support inbox:

- Parent/student message list.
- Message category.
- Assigned person.
- Status: New, In progress, Answered.
- AI suggested reply for repeated questions.
- Human approve/send button.

Later, add:

- Parent/student portals for sending messages.
- Grade-specific channels.
- Role-based access.
- Automation rules for routing and AI reply suggestions.
- WhatsApp integration only as an optional external channel, not the main source of truth.
