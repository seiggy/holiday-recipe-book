import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Lights from './Lights'
import Login from './pages/Login'
import Book from './pages/Book'
import Detail from './pages/Detail'
import Submit from './pages/Submit'

function Shell() {
  const { logout } = useAuth()
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Lights />
      <header className="top">
        <Link to="/" className="brand" aria-label="OG&E Team recipe book home"><img src="/assets/oge_logo.png" alt="Americas Enterprise, US Oil, Gas & Energy" /></Link>
        <nav aria-label="Main">
          <NavLink to="/" end>Recipe book</NavLink>
          <NavLink to="/submit">Share a recipe</NavLink>
          <button className="link" onClick={logout}>Log out</button>
        </nav>
      </header>
      <main id="main">
        <Routes>
          <Route path="/" element={<Book />} />
          <Route path="/recipe/:id" element={<Detail />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  const { token } = useAuth()
  return token ? <Shell /> : <Login />
}
