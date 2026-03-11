import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'


const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async (tkn) => {
    try {
      const res = await api.get('/me', {
        headers: { Authorization: `Bearer ${tkn}` }
      })
      const freshUser = res.data.user || res.data.data || res.data
      localStorage.setItem('user', JSON.stringify(freshUser))
      setUser(freshUser)
    } catch (err) {
      console.error('Failed to refresh user', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      // Selalu refresh dari server agar permissions up-to-date
      refreshUser(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token, userData) => {
    const cleanUser = userData?.user || userData
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(cleanUser))
    setToken(token)
    setUser(cleanUser)
    refreshUser(token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)