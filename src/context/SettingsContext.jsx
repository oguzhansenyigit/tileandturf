import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const SettingsContext = createContext()

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [catalogMode, setCatalogMode] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('15167741808')
  const [phoneNumber, setPhoneNumber] = useState('15167741808')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings.php')
      const settings = response.data || {}
      setCatalogMode(settings.catalog_mode === 'active' || settings.catalog_mode === '1')
      const fetchedWhatsApp = settings.whatsapp_number || '15167741808'
      const fetchedPhone = settings.phone_number || '15167741808'
      setWhatsappNumber(fetchedWhatsApp)
      setPhoneNumber(fetchedPhone)
    } catch (error) {
      // Error fetching settings - using defaults
      setCatalogMode(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsContext.Provider
      value={{
        catalogMode,
        whatsappNumber,
        phoneNumber,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
