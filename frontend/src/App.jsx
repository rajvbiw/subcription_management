import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import Admin from './components/Admin'

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.PROD ? '' : 'http://localhost:5000'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    navigate('/')
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    navigate('/login')
  }

  if (loading) return <div className="text-center mt-4">Loading App...</div>

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="min-h-screen">
        {user && (
          <nav>
            <div className="nav-container">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary glass flex items-center justify-center font-bold text-white">S</div>
                <Link to="/" className="text-xl font-extrabold text-white tracking-tight">SubAnalytics</Link>
              </div>
              
              <div className="nav-links">
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Administration</Link>
                )}
                
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                  <span className="text-xs font-semibold text-text-muted hidden md:inline">{user.email}</span>
                  <button onClick={logout} className="secondary text-xs" style={{ padding: '0.4rem 0.8rem' }}>Logout</button>
                </div>
              </div>
            </div>
          </nav>
        )}
        
        <main className="container">
          <Routes>
            <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  )
}

export default App
