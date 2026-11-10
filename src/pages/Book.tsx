import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRecipes, type RecipeSummary } from '../api'
import { useAuth } from '../auth'

const total = (r: RecipeSummary) => r.working_time + r.waiting_time

export default function Book() {
  const { token, logout } = useAuth()
  const [q, setQ] = useState('')
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      listRecipes(token!, q)
        .then((d) => { setRecipes(d.results); setError('') })
        .catch((e) => {
          if (e.status === 401 || e.status === 403) logout()
          else setError(e.message)
        })
    }, 250)
    return () => clearTimeout(t)
  }, [q, token, logout])

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Our collection</p>
          <h1>Recipe book</h1>
        </div>
        <div className="search">
          <label htmlFor="q">Search recipes</label>
          <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try “lentil”, “dumplings”…" />
        </div>
      </div>
      {error && <p role="alert" className="error">{error}</p>}
      {!recipes && !error && <p className="muted" role="status">Opening the book…</p>}
      {recipes?.length === 0 && (
        <p className="muted">No recipes here yet. <Link to="/submit">Share the first one.</Link></p>
      )}
      <ul className="book">
        {recipes?.map((r, i) => (
          <li key={r.id} className={i % 2 ? 'page right' : 'page left'}>
            <Link to={`/recipe/${r.id}`}>
              {r.image
                ? <img src={r.image} alt="" loading="lazy" />
                : <div className="ph" aria-hidden="true">✦</div>}
              <h2>{r.name}</h2>
              {r.description && <p className="desc">{r.description}</p>}
              <p className="meta">
                {r.servings > 0 && <span>Serves {r.servings}</span>}
                {total(r) > 0 && <span>{total(r)} min</span>}
              </p>
              {r.keywords.length > 0 && (
                <p className="tags">{r.keywords.slice(0, 3).map((k) => <span key={k.id ?? k.label}>{k.label ?? k.name}</span>)}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
