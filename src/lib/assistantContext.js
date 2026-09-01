// Builds the compact snapshot sent to the assistant on every message.
// Deliberately excludes ids/timestamps beyond what's needed for the model
// to reason about dates — this is sent to a third-party API (Gemini), so
// keep it to what's actually useful context, not a raw data dump.
export function buildAssistantContext(habits, projects, assignments, today = new Date()) {
  return {
    today: today.toISOString().slice(0, 10),
    habits: habits
      .filter((h) => !h.archivedAt)
      .map((h) => ({
        title: h.title,
        category: h.category,
        targetEveryDays: h.targetEveryDays,
        currentCadenceDays: h.currentCadenceDays,
        lastCompletedAt: h.lastCompletedAt ? h.lastCompletedAt.toISOString().slice(0, 10) : null,
      })),
    projects: projects
      .filter((p) => !p.completedAt)
      .map((p) => ({
        title: p.title,
        category: p.category,
        completionPercent: p.completionPercent,
        notes: p.notes,
        lastTouchedAt: p.lastTouchedAt ? p.lastTouchedAt.toISOString().slice(0, 10) : null,
      })),
    upcomingAssignments: assignments.map((a) => ({
      name: a.name,
      course: a.courseName,
      dueAt: a.dueAt,
    })),
  }
}
