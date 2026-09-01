// Talks to the local proxy server (server/index.js), never to Canvas
// directly — the token lives server-side only. Requires `npm run server`
// running alongside `npm run dev` (see CANVAS-SETUP.md).
export async function fetchCanvasCourses() {
  const res = await fetch('/api/canvas/courses')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  const { courses } = await res.json()
  return courses
}

// Flattens the nested { courses: [{ assignments: [...] }] } shape into a
// single list the calendar can bucket by due date, carrying the parent
// course's name/code along for display.
export function flattenAssignments(courses) {
  return courses.flatMap((course) =>
    course.assignments.map((a) => ({
      ...a,
      // Assignment ids aren't guaranteed unique across courses; scope by
      // course for a safe React key.
      id: `${course.id}-${a.id}`,
      courseName: course.name,
      courseCode: course.code,
    })),
  )
}
