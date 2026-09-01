// Thin wrapper around the Canvas REST API. Runs server-side only — the
// personal access token never reaches the browser bundle (see claude.md:
// "AI calls go through Cloud Functions so keys never reach the client",
// same rule applies here).

function baseUrl() {
  const domain = process.env.CANVAS_DOMAIN
  if (!domain) throw new Error('CANVAS_DOMAIN is not set (see .env.example)')
  return `https://${domain}/api/v1`
}

function authHeaders() {
  const token = process.env.CANVAS_TOKEN
  if (!token) throw new Error('CANVAS_TOKEN is not set (see .env.example)')
  return { Authorization: `Bearer ${token}` }
}

async function canvasGet(path) {
  const res = await fetch(`${baseUrl()}${path}`, { headers: authHeaders() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Canvas API ${res.status} on ${path}: ${body}`)
  }
  return res.json()
}

export async function fetchActiveCourses() {
  const courses = await canvasGet(
    '/courses?enrollment_state=active&per_page=50',
  )
  return courses.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.course_code,
  }))
}

export async function fetchUpcomingAssignments(courseId) {
  const assignments = await canvasGet(
    `/courses/${courseId}/assignments?bucket=upcoming&order_by=due_at&per_page=25`,
  )
  return assignments
    .filter((a) => a.due_at)
    .map((a) => ({
      id: a.id,
      name: a.name,
      dueAt: a.due_at,
      htmlUrl: a.html_url,
      pointsPossible: a.points_possible,
      submitted: a.has_submitted_submissions ?? false,
    }))
}

export async function fetchCoursesWithAssignments() {
  const courses = await fetchActiveCourses()
  const withAssignments = await Promise.all(
    courses.map(async (course) => ({
      ...course,
      assignments: await fetchUpcomingAssignments(course.id),
    })),
  )
  return withAssignments
}
