import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRecipe, type Recipe } from '../api'
import { useAuth } from '../auth'

export default function Detail() {
  const { id } = useParams()
  const { token } = useAuth()
  const [r, setR] = useState<Recipe | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getRecipe(token!, id!).then(setR).catch((e) => setError(e.message))
  }, [id, token])

  if (error) return <p role="alert" className="error">{error}</p>
  if (!r) return <p className="muted" role="status">Turning the page…</p>

  return (
    <article className="detail">
      <Link to="/" className="back">← Back to the book</Link>
      <h1>{r.name}</h1>
      {r.description && <p className="lede">{r.description}</p>}
      <p className="meta">
        {r.servings > 0 && <span>Serves {r.servings}</span>}
        {r.working_time > 0 && <span>{r.working_time} min prep</span>}
        {r.waiting_time > 0 && <span>{r.waiting_time} min waiting</span>}
      </p>
      {r.image && <img className="hero" src={r.image} alt="" />}
      {r.steps.map((s, i) => (
        <section key={s.id ?? i}>
          {r.steps.length > 1 && <h2>{s.name || `Step ${i + 1}`}</h2>}
          {s.ingredients.length > 0 && (
            <>
              <h3>Ingredients</h3>
              <ul className="ingredients">
                {s.ingredients.map((g, j) => (
                  <li key={j}>
                    {!g.no_amount && g.amount > 0 && <strong>{g.amount} </strong>}
                    {g.unit?.name} {g.food?.name} {g.note && <em>({g.note})</em>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>Method</h3>
          <p className="method">{s.instruction}</p>
        </section>
      ))}
    </article>
  )
}
