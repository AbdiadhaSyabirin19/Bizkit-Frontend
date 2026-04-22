import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const { token } = useAuth()
  const [settings, setSettings] = useState({
    logo: null,
    store_name: 'BizKit',
    loading: true
  })

  const fetchSettings = async () => {
    if (!token) {
      setSettings(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      const res = await api.get('/settings')
      const d = res.data.data
      setSettings({
        logo: d?.Logo || d?.logo || null,
        store_name: d?.StoreName || d?.store_name || 'BizKit',
        loading: false
      })
    } catch (err) {
      console.error('Failed to fetch settings', err)
      setSettings(prev => ({ ...prev, loading: false }))
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [token])

  return (
    <SettingsContext.Provider value={{ ...settings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
