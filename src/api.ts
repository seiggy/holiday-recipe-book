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
export interface Step { id?: number; name?: string; instruction: string; ingredients: Ingredient[] }
export interface Recipe extends RecipeSummary { steps: Step[] }

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

const TOKEN_KEY = 'tandoor_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the recipe server. Check your connection.')
  }
  if (res.status === 401 || res.status === 403) throw new ApiError(res.status, 'That token was not accepted.')
  if (!res.ok) throw new ApiError(res.status, `The recipe server answered with an error (${res.status}).`)
  return res.json() as Promise<T>
}

export const validateToken = (token: string) => request<unknown>('/api/recipe/?page_size=1', token)

export const listRecipes = (token: string, query = '') =>
  request<{ count: number; results: RecipeSummary[] }>(
    `/api/recipe/?page_size=100&query=${encodeURIComponent(query)}`, token)

export const getRecipe = (token: string, id: string) => request<Recipe>(`/api/recipe/${id}/`, token)

export interface NewRecipe {
  name: string
  description: string
  servings: number
  working_time: number
  waiting_time: number
  keywords: string[]
  ingredients: { amount: string; unit: string; food: string }[]
  instructions: string
}

export function createRecipe(token: string, r: NewRecipe) {
  const ingredients = r.ingredients
    .filter((i) => i.food.trim())
    .map((i) => ({
      amount: parseFloat(i.amount) || 0,
      unit: i.unit.trim() ? { name: i.unit.trim() } : null,
      food: { name: i.food.trim() },
      note: '',
      no_amount: !parseFloat(i.amount),
    }))
  return request<Recipe>('/api/recipe/', token, {
    method: 'POST',
    body: JSON.stringify({
      name: r.name,
      description: r.description,
      servings: r.servings,
      working_time: r.working_time,
      waiting_time: r.waiting_time,
      keywords: r.keywords.map((name) => ({ name })),
      steps: [{ instruction: r.instructions, ingredients, show_ingredients_table: true }],
    }),
  })
}
