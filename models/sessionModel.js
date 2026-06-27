const db = require("../database/client");

async function getNextSessionForStudent(studentCode) {
  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);

  if (!registration) {
    return null;
  }

  const sessions = await db.all(
    "SELECT * FROM sessions WHERE schoolGrade = ? AND status = 'Scheduled' ORDER BY startsAt",
    [registration.schoolGrade]
  );
  const now = new Date();
  const nextSession = sessions.find((session) => new Date(session.startsAt) >= now) || sessions[0];

  if (!nextSession) {
    return null;
  }

  return mapSession(nextSession);
}

async function createSession(data) {
  const session = {
    id: await getNextSessionId(),
    title: data.title,
    schoolGrade: data.schoolGrade,
    startsAt: data.startsAt,
    zoomLink: data.zoomLink,
    zoomRevealAt: data.zoomRevealAt,
    status: data.status || "Scheduled",
    notes: data.notes || "",
  };

  await db.run(`
    INSERT INTO sessions (id, title, schoolGrade, startsAt, zoomLink, zoomRevealAt, status, notes)
    VALUES (@id, @title, @schoolGrade, @startsAt, @zoomLink, @zoomRevealAt, @status, @notes)
  `, session);

  return mapSession(session);
}

async function createSessionArchive(data) {
  const archive = {
    id: await getNextId("ARC", "session_archives", 0),
    title: data.title,
    schoolGrade: data.schoolGrade,
    sessionDate: data.sessionDate,
    youtubeUrl: data.youtubeUrl,
    description: data.description || "",
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO session_archives (id, title, schoolGrade, sessionDate, youtubeUrl, description, createdAt)
    VALUES (@id, @title, @schoolGrade, @sessionDate, @youtubeUrl, @description, @createdAt)
  `, archive);

  return archive;
}

async function createLibraryMaterial(data) {
  const material = {
    id: await getNextId("MAT", "library_materials", 0),
    title: data.title,
    schoolGrade: data.schoolGrade,
    category: data.category || "Note",
    materialUrl: data.materialUrl,
    description: data.description || "",
    createdAt: new Date().toISOString(),
  };

  await db.run(`
    INSERT INTO library_materials (id, title, schoolGrade, category, materialUrl, description, createdAt)
    VALUES (@id, @title, @schoolGrade, @category, @materialUrl, @description, @createdAt)
  `, material);

  return material;
}

async function getStudentArchiveAndLibrary(studentCode) {
  const registration = await db.get("SELECT * FROM registrations WHERE studentCode = ?", [studentCode]);

  if (!registration) {
    return { archives: [], materials: [] };
  }

  const archives = await db.all(
    "SELECT * FROM session_archives WHERE schoolGrade = ? ORDER BY sessionDate DESC, rowid DESC",
    [registration.schoolGrade]
  );
  const materials = await db.all(
    "SELECT * FROM library_materials WHERE schoolGrade = ? ORDER BY createdAt DESC, rowid DESC",
    [registration.schoolGrade]
  );

  return { archives, materials };
}

function mapSession(session) {
  const now = new Date();
  const revealAt = new Date(session.zoomRevealAt);

  return {
    ...session,
    zoomVisible: now >= revealAt,
    displayZoomLink: now >= revealAt ? session.zoomLink : "",
    zoomHiddenMessage: now >= revealAt
      ? "Zoom link is available now."
      : `Zoom link will appear ${revealAt.toLocaleString()}.`,
  };
}

async function getNextSessionId() {
  return getNextId("SES", "sessions", 0);
}

async function getNextId(prefix, tableName, startNumber) {
  const rows = await db.all(`SELECT id FROM ${tableName} WHERE id LIKE ?`, [`${prefix}-%`]);
  const highestNumber = rows.reduce((highest, row) => {
    const number = Number(String(row.id).replace(`${prefix}-`, ""));
    return Number.isNaN(number) ? highest : Math.max(highest, number);
  }, startNumber);

  return `${prefix}-${String(highestNumber + 1).padStart(4, "0")}`;
}

module.exports = {
  createLibraryMaterial,
  createSession,
  createSessionArchive,
  getNextSessionForStudent,
  getStudentArchiveAndLibrary,
};
