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
  /** Merged: head_tracking_snippets || legacy google_ads_head_tag */
  const [headTrackingSnippets, setHeadTrackingSnippets] = useState('')
  const [googleAdsPageRules, setGoogleAdsPageRules] = useState('[]')
  const [googleAdsClickRules, setGoogleAdsClickRules] = useState('[]')
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
      const head =
        (settings.head_tracking_snippets || '').trim() ||
        (settings.google_ads_head_tag || '').trim()
      const fetchedGoogleAdsPageRules = settings.google_ads_page_rules || '[]'
      const fetchedGoogleAdsClickRules = settings.google_ads_click_rules || '[]'
      setWhatsappNumber(fetchedWhatsApp)
      setPhoneNumber(fetchedPhone)
      setHeadTrackingSnippets(head)
      setGoogleAdsPageRules(fetchedGoogleAdsPageRules)
      setGoogleAdsClickRules(fetchedGoogleAdsClickRules)
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
        headTrackingSnippets,
        googleAdsPageRules,
        googleAdsClickRules,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}
