import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { deleteRecipe, getRecipe, mediaUrl, type Recipe } from '../api'
import { useAuth } from '../auth'

export default function Detail() {
  const { id } = useParams()
  const { token } = useAuth()
  const nav = useNavigate()
  const warning = (useLocation().state as { warning?: string } | null)?.warning
  const [r, setR] = useState<Recipe | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    getRecipe(token!, id!).then(setR).catch((e) => setError(e.message))
  }, [id, token])

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteRecipe(token!, r!.id)
      nav('/')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete the recipe.')
      setDeleting(false)
    }
  }

  if (error) return <p role="alert" className="error">{error}</p>
  if (!r) return <p className="muted" role="status">Turning the page…</p>

  const image = mediaUrl(r.image)
  const files = r.steps.map((s) => s.file).filter((f) => !!f)

  return (
    <article className="detail">
      <div className="detail-bar">
        <Link to="/" className="back">← Back to the book</Link>
        <div className="actions">
          <Link to={`/recipe/${r.id}/edit`} className="btn small ghost">Edit</Link>
          <button type="button" className="btn small danger" onClick={() => { setDeleteError(''); dialog.current?.showModal() }}>Delete</button>
        </div>
      </div>
      {warning && <p role="alert" className="error">{warning}</p>}
      <h1>{r.name}</h1>
      {r.description && <p className="lede">{r.description}</p>}
      <p className="meta">
        {r.servings > 0 && <span>Serves {r.servings}</span>}
        {r.working_time > 0 && <span>{r.working_time} min prep</span>}
        {r.waiting_time > 0 && <span>{r.waiting_time} min waiting</span>}
      </p>
      {image && <img className="hero" src={image} alt={`${r.name}`} />}
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
      {files.length > 0 && (
        <section>
          <h3>Attachments</h3>
          <ul className="ingredients">
            {files.map((f) => (
              <li key={f!.id}><a href={mediaUrl(f!.file_download) ?? '#'} target="_blank" rel="noreferrer">{f!.name}</a></li>
            ))}
          </ul>
        </section>
      )}

      <dialog ref={dialog} className="confirm" aria-labelledby="del-title">
        <h2 id="del-title">Delete this recipe?</h2>
        <p>“{r.name}” will be removed from the book for everyone. This can’t be undone.</p>
        {deleteError && <p role="alert" className="error">{deleteError}</p>}
        <div className="actions">
          <button type="button" className="btn small ghost" onClick={() => dialog.current?.close()}>Keep it</button>
          <button type="button" className="btn small danger" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting…' : 'Delete recipe'}</button>
        </div>
      </dialog>
    </article>
  )
}
