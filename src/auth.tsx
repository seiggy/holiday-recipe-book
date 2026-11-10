import { createContext, useContext, useState, type ReactNode } from 'react'
import { clearToken, getToken, setToken, validateToken } from './api'

interface Auth {
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
}
const Ctx = createContext<Auth>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken())
  const login = async (t: string) => {
    const clean = t.trim()
    await validateToken(clean)
    setToken(clean)
    setTok(clean)
  }
  const logout = () => { clearToken(); setTok(null) }
  return <Ctx.Provider value={{ token, login, logout }}>{children}</Ctx.Provider>
}
