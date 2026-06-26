const attendanceForm = document.querySelector("#attendance-form");
const attendanceMessage = document.querySelector("#attendance-message");
const attendanceResults = document.querySelector("#attendance-results");
const gradeSelect = document.querySelector("#schoolGrade");

async function fetchAttendanceSetup() {
  const response = await fetch("/api/attendance");

  if (!response.ok) {
    attendanceResults.innerHTML = `<p class="empty-state">You do not have access to attendance.</p>`;
    return;
  }

  const { grades, runs } = await response.json();
  gradeSelect.innerHTML = grades.map((grade) => `<option>${grade}</option>`).join("");

  if (runs.length) {
    renderAttendanceResult(runs[0]);
  }
}

function renderAttendanceResult(result) {
  attendanceResults.innerHTML = `
    <div class="attendance-summary">
      <div>
        <span>Session</span>
        <strong>${result.sessionTitle}</strong>
      </div>
      <div>
        <span>Grade</span>
        <strong>${result.schoolGrade}</strong>
      </div>
      <div>
        <span>Present</span>
        <strong>${result.presentCount}</strong>
      </div>
      <div>
        <span>Absent</span>
        <strong>${result.absentCount}</strong>
      </div>
    </div>

    <div class="student-list">
      ${result.students.map(renderStudentAttendance).join("")}
    </div>

    <div class="attendance-warning-panel">
      <h3>Codes ignored from other grades</h3>
      ${
        result.otherGradeCodes.length
          ? result.otherGradeCodes.map(renderIgnoredCode).join("")
          : `<p>No other-grade codes found in this chat.</p>`
      }
    </div>

    <div class="attendance-warning-panel">
      <h3>Unknown or mistyped codes</h3>
      ${
        result.unknownCodes.length
          ? result.unknownCodes.map((code) => `<p>${code}</p>`).join("")
          : `<p>No unknown codes found.</p>`
      }
    </div>
  `;
}

function renderStudentAttendance(student) {
  return `
    <article class="student-card">
      <div class="student-main">
        <div>
          <span class="record-id">${student.studentCode} - ${student.schoolGrade}</span>
          <h3>${student.studentName}</h3>
        </div>
        <span class="status-badge ${student.attendance.toLowerCase()}">${student.attendance}</span>
      </div>
    </article>
  `;
}

function renderIgnoredCode(student) {
  return `
    <p>
      <strong>${student.studentCode}</strong> belongs to ${student.studentName} in ${student.schoolGrade}.
      It was not counted here.
    </p>
  `;
}

attendanceForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(attendanceForm);
  const response = await fetch("/api/attendance/upload-chat", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    attendanceMessage.textContent = "Could not upload this chat file.";
    return;
  }

  const { result } = await response.json();
  attendanceMessage.textContent = "Attendance marked from Zoom chat.";
  renderAttendanceResult(result);
});

fetchAttendanceSetup();
