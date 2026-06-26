# Current Registration Workflow To Replace

## Current Manual Process

Students or parents currently fill out a Google Form:

https://docs.google.com/forms/u/0/d/1FLdaTwvYbk7r9dtIn-E6u2oPAoLlYzPxxKkpOJyNEBo/edit?pli=1&authuser=0

The submitted data is collected in a Google Sheet:

https://docs.google.com/spreadsheets/d/1pDbYx462jlMbQFwk78bRwLjuIxPJAw9uxlHSlmRYw4g/edit?resourcekey=&gid=514033737#gid=514033737

The administrator then manually:

1. Opens each submitted registration.
2. Checks the attached payment photo.
3. Confirms that the reservation/payment is valid.
4. Sends the parent or student a confirmation message.
5. Sends the generated student code.

## Payment Photo Confirmation Criteria

The uploaded transaction photo should be confirmed only when these criteria are visible:

- The receiver/recipient is `Hoda Bahr @ Instapay`.
- The transaction date is close to the current registration period, within about 7 days.
- The transaction time is visible in the photo.

If all criteria are present, the payment can be marked as confirmed.
If one or more criteria are missing, the registration should stay in payment review.

## Payment Confirmation Notification

After confirmation, AMS should send a message like:

`Hello [parent name], payment received and reservation confirmed for [student name]. Your student code is [student code]. Please keep it with you. We will inform you with any updates.`

## Product Goal

AMS should replace this manual process with a registration intake and approval workflow.

The system should eventually:

- Let parents or students submit registration information.
- Store each submission as a pending registration.
- Show payment proof/photo inside the admin dashboard.
- Show a payment-photo criteria checklist.
- Let the administrator approve or reject the registration.
- Generate or assign a student code when approved.
- Convert the approved registration into a student record.
- Send a reservation confirmation message automatically or with one click.
- Include the student code in that message.

## First Build Slice

Before connecting to Google Forms or Google Sheets directly, build the AMS-native version:

- Pending registrations page for administrators.
- Example registration submissions.
- Payment proof status.
- Payment photo criteria checklist.
- Confirm reservation action.
- Generated student code.
- Confirmation message preview.

Later, add Google Sheets import or direct replacement of the Google Form.
