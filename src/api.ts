export interface Keyword { id?: number; name?: string; label?: string }
export interface RecipeSummary {
  id: number
  name: string
  description: string | null
  image: string | null
  keywords: Keyword[]
  working_time: number
  waiting_time: number
  servings: number
}
export interface Ingredient {
  amount: number
  unit: { name: string } | null
  food: { name: string } | null
  note: string
  no_amount?: boolean
}
export interface StepFile { id: number; name: string; file_download?: string }
export interface Step {
  id?: number
  name?: string
  instruction: string
  ingredients: Ingredient[]
  file?: StepFile | null
}
export interface Recipe extends RecipeSummary { steps: Step[] }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const TOKEN_KEY = 'tandoor_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

// Tandoor returns absolute media URLs; keep them same-origin so the proxy serves them.
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url, window.location.origin)
    return u.pathname.startsWith('/media/') ? u.pathname : url
  } catch {
    return url
  }
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  const headers: Record<string, string> = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
  if (typeof init.body === 'string') headers['Content-Type'] = 'application/json'
  try {
    res = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError(0, 'Could not reach the recipe server. Check your connection.')
  }
  if (res.status === 401) throw new ApiError(401, 'That token was not accepted.')
  if (res.status === 403) throw new ApiError(403, 'You don’t have permission to do that. If this keeps happening, log out and sign in again.')
  if (res.status === 404) throw new ApiError(404, 'That recipe could not be found. It may have been removed.')
  if (!res.ok) throw new ApiError(res.status, `The recipe server answered with an error (${res.status}).`)
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>)
}

export const validateToken = (token: string) =>
  request<unknown>('/api/recipe/?page_size=1', token).catch((e) => {
    if (e instanceof ApiError && e.status === 403) throw new ApiError(403, 'That token was not accepted.')
    throw e
  })

export const listRecipes = (token: string, query = '') =>
  request<{ count: number; results: RecipeSummary[] }>(
    `/api/recipe/?page_size=100&query=${encodeURIComponent(query)}`, token)

export const getRecipe = (token: string, id: string) => request<Recipe>(`/api/recipe/${id}/`, token)

export const deleteRecipe = (token: string, id: number) =>
  request<void>(`/api/recipe/${id}/`, token, { method: 'DELETE' })

export interface NewRecipe {
  name: string
  description: string
  servings: number
  working_time: number
  waiting_time: number
  keywords: string[]
  ingredients: { amount: string; unit: string; food: string; note?: string }[]
  instructions: string
  file?: StepFile | null
}

function body(r: NewRecipe, existing?: Recipe) {
  const ingredients = r.ingredients
    .filter((i) => i.food.trim())
    .map((i) => ({
      amount: parseFloat(i.amount) || 0,
      unit: i.unit.trim() ? { name: i.unit.trim() } : null,
      food: { name: i.food.trim() },
      note: i.note ?? '',
      no_amount: !parseFloat(i.amount),
    }))
  const first = { ...(existing?.steps[0] ?? {}), instruction: r.instructions, ingredients, file: r.file ?? null, show_ingredients_table: true }
  return JSON.stringify({
    name: r.name,
    description: r.description,
    servings: r.servings,
    working_time: r.working_time,
    waiting_time: r.waiting_time,
    keywords: r.keywords.map((name) => ({ name })),
    steps: [first, ...(existing?.steps.slice(1) ?? [])],
  })
}

export const createRecipe = (token: string, r: NewRecipe) =>
  request<Recipe>('/api/recipe/', token, { method: 'POST', body: body(r) })

export const updateRecipe = (token: string, existing: Recipe, r: NewRecipe) =>
  request<Recipe>(`/api/recipe/${existing.id}/`, token, { method: 'PATCH', body: body(r, existing) })

// file === null removes the current image
export function setRecipeImage(token: string, id: number, file: File | null) {
  const form = new FormData()
  form.append('image', file ?? '')
  return request<{ image: string | null }>(`/api/recipe/${id}/image/`, token, { method: 'PUT', body: form })
}

export function uploadUserFile(token: string, file: File) {
  const form = new FormData()
  form.append('name', file.name.slice(0, 128))
  form.append('file', file)
  return request<StepFile>('/api/user-file/', token, { method: 'POST', body: form })
}
