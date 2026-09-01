import { signInWithGoogle } from '../lib/auth'

function SignIn() {
  return (
    <main className="app">
      <h1>Reroute Planner</h1>
      <p>Sign in to see your habits, projects, and courses.</p>
      <button type="button" onClick={() => signInWithGoogle()}>
        Sign in with Google
      </button>
    </main>
  )
}

export default SignIn
