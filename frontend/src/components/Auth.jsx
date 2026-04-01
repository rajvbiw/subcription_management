import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../App'

function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register'
      const { data } = await axios.post(url, { email, password })
      if (isLogin) {
        login(data.user, data.token)
      } else {
        alert('Registered successfully! Please login.')
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-[calc(100vh-200px)]">
      <div className="card glass w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary glass flex items-center justify-center font-bold text-white mx-auto mb-4 text-xl">S</div>
          <h2 className="text-3xl font-extrabold text-gradient">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
          <p className="text-text-muted mt-2">{isLogin ? 'Enter your details to continue' : 'Sign up for a new account'}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all text-white"
            />
          </div>
          <button type="submit" className="primary w-full py-4 mt-2" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm">
          <span className="text-text-muted">{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button 
            className="secondary border-none text-primary hover:underline ml-2 p-0 h-auto inline font-bold" 
            style={{ background: 'none', boxShadow: 'none' }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register now' : 'Log in here'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Auth
