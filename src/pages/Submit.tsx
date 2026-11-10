import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createRecipe, getRecipe, mediaUrl, setRecipeImage, updateRecipe, uploadUserFile, type Recipe, type StepFile } from '../api'
import { useAuth } from '../auth'

const blank = { amount: '', unit: '', food: '', note: '' }

export default function Submit() {
  const { id } = useParams()
  const editing = !!id
  const { token } = useAuth()
  const nav = useNavigate()
  const [existing, setExisting] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(editing)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [servings, setServings] = useState(4)
  const [prep, setPrep] = useState(0)
  const [wait, setWait] = useState(0)
  const [tags, setTags] = useState('')
  const [ings, setIngs] = useState([{ ...blank }])
  const [instructions, setInstructions] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [attachFile, setAttachFile] = useState<File | null>(null)
  const [stepFile, setStepFile] = useState<StepFile | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    getRecipe(token!, id).then((r) => {
      setExisting(r)
      setName(r.name)
      setDescription(r.description ?? '')
      setServings(r.servings)
      setPrep(r.working_time)
      setWait(r.waiting_time)
      setTags(r.keywords.map((k) => k.label ?? k.name).join(', '))
      const s = r.steps[0]
      setInstructions(s?.instruction ?? '')
      setStepFile(s?.file ?? null)
      setImagePreview(mediaUrl(r.image))
      const list = (s?.ingredients ?? []).map((g) => ({
        amount: g.no_amount || !g.amount ? '' : String(g.amount),
        unit: g.unit?.name ?? '',
        food: g.food?.name ?? '',
        note: g.note ?? '',
      }))
      setIngs(list.length ? list : [{ ...blank }])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id, token])

  useEffect(() => () => { if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview) }, [imagePreview])

  const setIng = (i: number, k: keyof typeof blank, v: string) =>
    setIngs(ings.map((g, j) => (j === i ? { ...g, [k]: v } : g)))

  function pickImage(f: File | undefined) {
    if (!f) return
    setImageFile(f)
    setRemoveImage(false)
    setImagePreview(URL.createObjectURL(f))
  }

  function dropImage() {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (imageInput.current) imageInput.current.value = ''
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    let saved: Recipe
    try {
      let file = stepFile
      if (attachFile) file = await uploadUserFile(token!, attachFile)
      const data = {
        name, description, servings, working_time: prep, waiting_time: wait,
        keywords: tags.split(',').map((t) => t.trim()).filter(Boolean),
        ingredients: ings, instructions, file,
      }
      saved = existing ? await updateRecipe(token!, existing, data) : await createRecipe(token!, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setBusy(false)
      return
    }
    let warning = ''
    try {
      if (imageFile) await setRecipeImage(token!, saved.id, imageFile)
      else if (removeImage && existing?.image) await setRecipeImage(token!, saved.id, null)
    } catch (err) {
      warning = `Your recipe was saved, but the photo wasn’t: ${err instanceof Error ? err.message : 'upload failed.'}`
    }
    nav(`/recipe/${saved.id}`, { state: warning ? { warning } : undefined })
  }

  if (loading) return <p className="muted" role="status">Opening the recipe…</p>
  if (editing && !existing) return <p role="alert" className="error">{error || 'Recipe not found.'}</p>

  return (
    <form className="submit" onSubmit={submit}>
      <p className="eyebrow">{editing ? 'Update the book' : 'Add to the table'}</p>
      <h1>{editing ? 'Edit recipe' : 'Share a recipe'}</h1>

      <fieldset className="photo">
        <legend>Photo</legend>
        {imagePreview
          ? <img src={imagePreview} alt="Preview of the recipe photo" />
          : <div className="ph" aria-hidden="true">✦</div>}
        <div className="photo-actions">
          <label className="btn small" htmlFor="photo">{imagePreview ? 'Change photo' : 'Add a photo'}</label>
          <input id="photo" ref={imageInput} className="visually-hidden" type="file" accept="image/*" onChange={(e) => pickImage(e.target.files?.[0])} />
          {imagePreview && <button type="button" className="link" onClick={dropImage}>Remove photo</button>}
        </div>
      </fieldset>

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

      <fieldset>
        <legend>Attachment (optional)</legend>
        <p className="fine">Attach a document such as a scanned family recipe card (PDF or image).</p>
        {(attachFile || stepFile) && <p>{attachFile?.name ?? stepFile?.name}</p>}
        <input aria-label="Attach a file" type="file" onChange={(e) => { setAttachFile(e.target.files?.[0] ?? null) }} />
        {(attachFile || stepFile) && (
          <button type="button" className="link" onClick={() => { setAttachFile(null); setStepFile(null) }}>Remove attachment</button>
        )}
      </fieldset>

      {error && <p role="alert" className="error">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add to the book'}</button>
    </form>
  )
}
