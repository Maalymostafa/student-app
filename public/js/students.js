const studentList = document.querySelector("#student-list");
const studentForm = document.querySelector("#student-form");
const searchInput = document.querySelector("#student-search");
const formMessage = document.querySelector("#student-form-message");

async function fetchStudents(search = "") {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  const response = await fetch(`/api/students?${params.toString()}`);

  if (!response.ok) {
    studentList.innerHTML = `<p class="empty-state">You do not have access to student records.</p>`;
    return;
  }

  const { students } = await response.json();
  renderStudents(students);
}

function renderStudents(students) {
  if (students.length === 0) {
    studentList.innerHTML = `<p class="empty-state">No students found.</p>`;
    return;
  }

  studentList.innerHTML = students
    .map(
      (student) => `
        <article class="student-card">
          <div class="student-main">
            <div>
              <span class="record-id">${student.id}</span>
              <h3>${student.fullName}</h3>
              <p>${student.schoolGrade} - Parent: ${student.parentName}</p>
            </div>
            <span class="status-badge ${student.status.toLowerCase()}">${student.status}</span>
          </div>
          <dl class="record-details">
            <div>
              <dt>Phone</dt>
              <dd>${student.phone}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>${student.whatsapp}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>${student.email}</dd>
            </div>
            <div>
              <dt>Registered</dt>
              <dd>${student.registrationDate}</dd>
            </div>
          </dl>
          <p class="student-note">${student.notes || "No notes yet."}</p>
          <button
            class="archive-button"
            type="button"
            data-student-id="${student.id}"
            ${student.status === "Archived" ? "disabled" : ""}
          >
            Archive
          </button>
        </article>
      `
    )
    .join("");
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "Saving student...";

  const formData = new FormData(studentForm);
  const student = Object.fromEntries(formData.entries());

  const response = await fetch("/api/students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(student),
  });

  if (!response.ok) {
    formMessage.textContent = "Please complete all required fields.";
    return;
  }

  studentForm.reset();
  formMessage.textContent = "Student added.";
  await fetchStudents(searchInput.value);
});

searchInput.addEventListener("input", () => {
  fetchStudents(searchInput.value);
});

studentList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-student-id]");

  if (!button) {
    return;
  }

  await fetch(`/api/students/${button.dataset.studentId}/archive`, {
    method: "PATCH",
  });
  await fetchStudents(searchInput.value);
});

fetchStudents();
