import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRecipe } from '../api'
import { useAuth } from '../auth'

const blank = { amount: '', unit: '', food: '' }

export default function Submit() {
  const { token } = useAuth()
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(4)
  const [prep, setPrep] = useState(0)
  const [wait, setWait] = useState(0)
  const [tags, setTags] = useState('')
  const [ings, setIngs] = useState([{ ...blank }])
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const setIng = (i: number, k: keyof typeof blank, v: string) =>
    setIngs(ings.map((g, j) => (j === i ? { ...g, [k]: v } : g)))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await createRecipe(token!, {
        name, description, servings, working_time: prep, waiting_time: wait,
        keywords: tags.split(',').map((t) => t.trim()).filter(Boolean),
        ingredients: ings, instructions,
      })
      nav(`/recipe/${r.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <form className="submit" onSubmit={submit}>
      <p className="eyebrow">Add to the table</p>
      <h1>Share a recipe</h1>
      <label htmlFor="name">Recipe name</label>
      <input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Grandma’s spiced pumpkin soup" />
      <label htmlFor="desc">A few words about it</label>
      <textarea id="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who makes it, and when does it appear on your table?" />
      <div className="row3">
        <div><label htmlFor="serv">Servings</label><input id="serv" type="number" min={1} value={servings} onChange={(e) => setServings(+e.target.value)} /></div>
        <div><label htmlFor="prep">Prep (min)</label><input id="prep" type="number" min={0} value={prep} onChange={(e) => setPrep(+e.target.value)} /></div>
        <div><label htmlFor="wait">Waiting (min)</label><input id="wait" type="number" min={0} value={wait} onChange={(e) => setWait(+e.target.value)} /></div>
      </div>
      <label htmlFor="tags">Keywords (comma separated)</label>
      <input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="soup, vegetarian, harvest" />
      <fieldset>
        <legend>Ingredients</legend>
        {ings.map((g, i) => (
          <div className="ing" key={i}>
            <input aria-label={`Ingredient ${i + 1} amount`} placeholder="2" value={g.amount} onChange={(e) => setIng(i, 'amount', e.target.value)} />
            <input aria-label={`Ingredient ${i + 1} unit`} placeholder="cups" value={g.unit} onChange={(e) => setIng(i, 'unit', e.target.value)} />
            <input aria-label={`Ingredient ${i + 1} name`} placeholder="red lentils" value={g.food} onChange={(e) => setIng(i, 'food', e.target.value)} />
            {ings.length > 1 && <button type="button" className="link" onClick={() => setIngs(ings.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        ))}
        <button type="button" className="link" onClick={() => setIngs([...ings, { ...blank }])}>+ Add ingredient</button>
      </fieldset>
      <label htmlFor="inst">Method</label>
      <textarea id="inst" rows={7} required value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      {error && <p role="alert" className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Add to the book'}</button>
    </form>
  )
}
