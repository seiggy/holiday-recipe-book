import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import Lights from '../Lights'

export default function Login() {
  const { login } = useAuth()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <Lights />
      <main id="main" className="login-card">
        <p className="eyebrow">Fall &amp; winter gatherings</p>
        <h1>The Gathering Table</h1>
        <p className="lede">A shared book of the dishes that bring us together, from harvest suppers to midwinter feasts. Paste your access token to open it.</p>
        <form onSubmit={submit}>
          <label htmlFor="token">Your access token</label>
          <input id="token" type="password" autoComplete="off" spellCheck={false} required
            value={value} onChange={(e) => setValue(e.target.value)}
            aria-describedby={error ? 'token-error' : undefined} aria-invalid={!!error} />
          {error && <p id="token-error" role="alert" className="error">{error}</p>}
          <button className="btn" disabled={busy || !value.trim()}>{busy ? 'Checking…' : 'Open the book'}</button>
        </form>
        <p className="fine">Your token stays in this browser only.</p>
      </main>
    </div>
  )
}
