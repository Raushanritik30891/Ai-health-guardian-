// frontend/src/pages/Stores.jsx
// Uses Geoapify Places API directly — no backend needed

import React, { useState, useEffect, useCallback } from 'react'
import { useStore } from '../store/useStore'
import axios from 'axios'

const GEOAPIFY_KEY = 'a8b9a07330464048b6b5cafdced7b8a8'
const GEOAPIFY_URL = 'https://api.geoapify.com/v2/places'

const JAN_AUSHADHI_STATES = [
  'Andhra Pradesh','Bihar','Delhi','Gujarat','Haryana','Jharkhand',
  'Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab',
  'Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','West Bengal'
]

// ── Store type → Geoapify category mapping ───────────────────────────────────
const CATEGORY_MAP = {
  pharmacy:  'healthcare.pharmacy',
  hospital:  'healthcare.hospital',
  clinic:    'healthcare.clinic_or_praxis',
  all:       'healthcare',
}

// ── Helper: haversine distance (km) ──────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2)
}

// ── Parse Geoapify feature → clean store object ───────────────────────────────
function parseFeature(feature, userLat, userLon) {
  const p = feature.properties
  const [lon, lat] = feature.geometry.coordinates
  const raw = p.datasource?.raw || {}

  const distance =
    userLat && userLon ? getDistance(userLat, userLon, lat, lon) : null

  // Category badge
  let type = 'Medical Store'
  if (p.categories?.includes('healthcare.pharmacy')) type = 'Pharmacy'
  else if (p.categories?.includes('healthcare.hospital')) type = 'Hospital'
  else if (p.categories?.includes('healthcare.clinic_or_praxis')) type = 'Clinic'
  else if (p.categories?.includes('healthcare.emergency')) type = 'Emergency'

  const phone = p.contact?.phone || raw.phone || null

  return {
    name: p.name || 'Medical Store',
    type,
    address: p.address_line2 || p.formatted || 'Address not available',
    opening_hours: p.opening_hours || raw.opening_hours || null,
    phone,
    distance_km: distance,
    lat, lon,
    brand: p.brand || null,
    maps_url: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    geomaps_url: `https://maps.geoapify.com/v1/staticmap?style=osm-carto&width=600&height=300&center=lonlat:${lon},${lat}&zoom=15&marker=lonlat:${lon},${lat};color:%23ef4444;size:medium&apiKey=${GEOAPIFY_KEY}`,
  }
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Stores() {
  const { profile } = useStore()
  const isHindi = profile.language === 'hi'
  const T = (en, hi) => isHindi ? hi : en

  const [tab, setTab] = useState('nearby')
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [storeFilter, setStoreFilter] = useState('pharmacy')
  const [radius, setRadius] = useState(3000)      // metres
  const [userCoords, setUserCoords] = useState(null)
  const [cityQuery, setCityQuery] = useState(profile.city || '')
  const [geocoding, setGeocoding] = useState(false)
  // 'idle' | 'requesting' | 'granted' | 'denied'
  // Start as 'requesting' immediately if browser supports geolocation
  const [gpsStatus, setGpsStatus] = useState(
    typeof navigator !== 'undefined' && navigator.geolocation ? 'requesting' : 'denied'
  )

  // ── Fetch from Geoapify by lat/lon ────────────────────────────────────────
  const fetchByCoords = useCallback(async (lat, lon, filter = storeFilter, rad = radius) => {
    setLoading(true)
    setError(null)
    setStores([])
    try {
      const category = CATEGORY_MAP[filter] || 'healthcare'
      const res = await axios.get(GEOAPIFY_URL, {
        params: {
          categories: category,
          filter: `circle:${lon},${lat},${rad}`,
          limit: 20,
          apiKey: GEOAPIFY_KEY,
        },
      })
      const features = res.data?.features || []
      const parsed = features
        .map(f => parseFeature(f, lat, lon))
        .sort((a, b) => parseFloat(a.distance_km) - parseFloat(b.distance_km))
      setStores(parsed)
      if (parsed.length === 0) setError(T('No medical stores found nearby. Try increasing the radius.', 'नज़दीक में कोई मेडिकल स्टोर नहीं मिला। रेडियस बढ़ाएं।'))
    } catch (err) {
      console.error('Geoapify error:', err)
      setError(T('Failed to fetch stores from Geoapify. Please try again.', 'दुकानें लाने में विफल। पुनः प्रयास करें।'))
    } finally {
      setLoading(false)
    }
  }, [storeFilter, radius, isHindi])

  // ── GPS: get user location ────────────────────────────────────────────────
  const syncGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError(T('Geolocation not supported by your browser.', 'ब्राउज़र में GPS समर्थित नहीं है।'))
      setGpsStatus('denied')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGpsStatus('granted')
        setUserCoords({ lat: coords.latitude, lon: coords.longitude })
        fetchByCoords(coords.latitude, coords.longitude)
      },
      () => {
        setGpsStatus('denied')
        setLoading(false)
        setError(T(
          'Location permission denied. Please allow location access in your browser, or enter your city below.',
          'GPS permission नहीं मिली। Browser में location allow करें, या नीचे शहर का नाम दर्ज करें।'
        ))
      },
      { timeout: 15000, enableHighAccuracy: true }
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchByCoords])

  // ── Geocode city name → coords → fetch ────────────────────────────────────
  const searchByCity = async () => {
    if (!cityQuery.trim()) return
    setGeocoding(true)
    setError(null)
    try {
      const res = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(cityQuery + ', India')}&apiKey=${GEOAPIFY_KEY}`
      )
      const feature = res.data?.features?.[0]
      if (!feature) {
        setError(T(`Could not find "${cityQuery}". Try a more specific location.`, `"${cityQuery}" नहीं मिला।`))
        return
      }
      const [lon, lat] = feature.geometry.coordinates
      setUserCoords({ lat, lon })
      await fetchByCoords(lat, lon)
    } catch {
      setError(T('Geocoding failed. Check your connection.', 'शहर की जियोकोडिंग विफल।'))
    } finally {
      setGeocoding(false)
    }
  }

  // Re-fetch when filter or radius changes (if coords already loaded)
  useEffect(() => {
    if (userCoords && tab === 'nearby') {
      fetchByCoords(userCoords.lat, userCoords.lon, storeFilter, radius)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilter, radius])

  // ── Auto-trigger syncGPS once gpsStatus = 'requesting' ───────────────────
  useEffect(() => {
    if (gpsStatus === 'requesting') {
      syncGPS()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsStatus])

  // ── Open hours badge ───────────────────────────────────────────────────────
  const renderHours = (hours) => {
    if (!hours) return null
    const isAllDay = hours === '24/7' || hours.toLowerCase().includes('24/7')
    return (
      <span style={{
        fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20,
        background: isAllDay ? '#ecfdf5' : '#fffbeb',
        color: isAllDay ? '#059669' : '#92400e',
        border: `1px solid ${isAllDay ? '#d1fae5' : '#fef3c7'}`,
      }}>
        🕒 {hours}
      </span>
    )
  }

  return (
    <div className="page" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div className="badge badge-indigo">📍 {T('Live Geospatial', 'लाइव जियोस्पेशियल')}</div>
          <div className="badge badge-emerald" style={{ fontSize: 10 }}>⚡ Powered by Geoapify</div>
        </div>
        <h1 className="section-title">
          {isHindi ? 'नज़दीकी मेडिकल स्टोर' : 'Nearby Medical Stores'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, maxWidth: 620, lineHeight: 1.6 }}>
          {T(
            'Find real pharmacies, hospitals & clinics near you using live location data from OpenStreetMap.',
            'आपके नज़दीक असली फार्मेसी, अस्पताल और क्लिनिक — OpenStreetMap से लाइव डेटा।'
          )}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 32, background: '#f8fafc',
        padding: 6, borderRadius: 16, border: '1px solid #e2e8f0'
      }}>
        {[
          { id: 'nearby', icon: '📡', label: T('Nearby Stores', 'नज़दीकी स्टोर') },
          { id: 'jan',    icon: '🏥', label: T('Jan Aushadhi', 'जन औषधि') },
          { id: 'online', icon: '🛒', label: T('Online Stores', 'ऑनलाइन स्टोर') },
          { id: 'emergency', icon: '🚨', label: T('Emergency', 'आपातकाल') },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '12px 8px', borderRadius: 12, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800,
              fontSize: 12, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, transition: 'all 0.2s',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#059669' : '#64748b',
              boxShadow: tab === t.id ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════════════
          TAB: NEARBY STORES (Geoapify powered)
      ═════════════════════════════════════════════════════════ */}
      {tab === 'nearby' && (
        <div className="animate-fade">
          {/* Auto-location banner */}
          {(gpsStatus === 'requesting' || loading) && stores.length === 0 && !error && (
            <div style={{
              marginBottom: 20, padding: '18px 22px', borderRadius: 16,
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: '1px solid #bfdbfe',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 28, animation: 'pulse 1.5s ease-in-out infinite' }}>📡</div>
              <div>
                <div style={{ fontWeight: 900, color: '#1e40af', fontSize: 14, marginBottom: 3 }}>
                  {T('Detecting Your Location...', 'आपकी लोकेशन का पता लगाया जा रहा है...')}
                </div>
                <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
                  {T(
                    'Please allow location access in your browser when prompted. Nearby pharmacies will load automatically.',
                    'Browser में location popup आए तो Allow करें। नज़दीकी फार्मेसी अपने आप लोड हो जाएंगी।'
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Controls panel */}
          <div className="card-premium" style={{ marginBottom: 24, padding: 28 }}>
            <div className="lbl" style={{ marginBottom: 14 }}>
              {T('Search Medical Stores Near You', 'नज़दीकी मेडिकल स्टोर खोजें')}
            </div>

            {/* City search row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input
                id="stores-city-input"
                className="inp"
                value={cityQuery}
                onChange={e => setCityQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByCity()}
                placeholder={T('Enter city, area, or landmark...', 'शहर, इलाक़ा या लैंडमार्क दर्ज करें...')}
                style={{ flex: 1, height: 50, borderRadius: 12 }}
              />
              <button
                id="stores-city-search-btn"
                className="btn btn-primary"
                onClick={searchByCity}
                disabled={loading || geocoding}
                style={{ height: 50, padding: '0 20px', borderRadius: 12, fontWeight: 800 }}
              >
                {geocoding ? '⏳' : T('SEARCH', 'खोजें')}
              </button>
            </div>

            {/* GPS button — shows live status */}
            <button
              id="stores-gps-btn"
              onClick={syncGPS}
              disabled={loading || gpsStatus === 'requesting'}
              style={{
                width: '100%', height: 52, borderRadius: 12, border: 'none',
                background:
                  gpsStatus === 'granted' ? 'linear-gradient(135deg, #059669, #047857)' :
                  gpsStatus === 'denied'  ? 'linear-gradient(135deg, #dc2626, #b91c1c)' :
                  loading                 ? '#f1f5f9' :
                                            'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: (loading && gpsStatus !== 'granted' && gpsStatus !== 'denied') ? '#94a3b8' : '#fff',
                fontWeight: 800, fontSize: 14, cursor: (loading || gpsStatus === 'requesting') ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: loading ? 'none' : '0 6px 16px rgba(59,130,246,0.3)',
                marginBottom: 16, transition: 'all 0.3s',
              }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> {T('Fetching nearby stores...', 'नज़दीकी स्टोर ढूंढ रहा है...')}</>
                : gpsStatus === 'granted'
                  ? <>✅ {T('Location Granted — Stores Loaded', 'Location मिल गई — स्टोर लोड हो गए')}</>
                  : gpsStatus === 'denied'
                    ? <>🔄 {T('Retry GPS', 'GPS दोबारा आज़माएं')}</>
                    : <>📡 {T('Requesting Your Location...', 'आपकी लोकेशन ले रहे हैं...')}</>
              }
            </button>

            {/* Filters row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  {T('Store Type', 'स्टोर प्रकार')}
                </div>
                <select
                  value={storeFilter}
                  onChange={e => setStoreFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit',
                    fontWeight: 700, color: '#475569', background: '#fff',
                  }}
                >
                  <option value="pharmacy">{T('💊 Pharmacy Only', '💊 फार्मेसी')}</option>
                  <option value="hospital">{T('🏥 Hospitals', '🏥 अस्पताल')}</option>
                  <option value="clinic">{T('🩺 Clinics', '🩺 क्लिनिक')}</option>
                  <option value="all">{T('🏪 All Healthcare', '🏪 सभी स्वास्थ्य')}</option>
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
                  {T('Search Radius', 'खोज दायरा')}
                </div>
                <select
                  value={radius}
                  onChange={e => setRadius(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 10,
                    border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'inherit',
                    fontWeight: 700, color: '#475569', background: '#fff',
                  }}
                >
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={3000}>3 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                </select>
              </div>
            </div>

            {/* Quick city chips */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                {T('Quick Select:', 'त्वरित चुनें:')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad'].map(city => (
                  <button
                    key={city}
                    onClick={() => { setCityQuery(city); setTimeout(() => searchByCity(), 100) }}
                    className="chip"
                    style={{ fontSize: 12, background: cityQuery === city ? '#ecfdf5' : '#f8fafc', border: `1px solid ${cityQuery === city ? '#059669' : '#e2e8f0'}`, color: cityQuery === city ? '#059669' : '#475569' }}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-warn animate-fade" style={{ marginBottom: 20, background: '#fffbeb' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Results */}
          {stores.length > 0 && (
            <>
              {/* Result header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 16 }}>
                  {stores.length} {T('stores found', 'स्टोर मिले')}
                  {userCoords && <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}> · {radius / 1000}km radius</span>}
                </div>
                <div className="badge badge-emerald" style={{ fontSize: 10 }}>
                  📡 {T('Live data', 'लाइव डेटा')}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                {stores.map((store, idx) => (
                  <div
                    key={idx}
                    className="card-hover"
                    style={{
                      padding: 22, borderRadius: 20, background: '#fff',
                      border: '1px solid #f1f5f9',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a' }}>
                            {store.type === 'Pharmacy' ? '💊' : store.type === 'Hospital' ? '🏥' : '🩺'} {store.name}
                          </div>
                          {store.brand && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 20 }}>
                              {store.brand}
                            </span>
                          )}
                        </div>
                        <div className="badge badge-indigo" style={{ fontSize: 10, background: '#eef2ff', color: '#6366f1', marginBottom: 10 }}>
                          {store.type.toUpperCase()}
                        </div>
                      </div>

                      {store.distance_km && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: 18, color: '#059669' }}>
                            {store.distance_km} <span style={{ fontSize: 11 }}>km</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>AWAY</div>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div style={{ display: 'flex', gap: 6, fontSize: 13, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>
                      <span style={{ flexShrink: 0 }}>📍</span>
                      <span>{store.address}</span>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      {store.opening_hours && renderHours(store.opening_hours)}
                      {store.phone && (
                        <a
                          href={`tel:${store.phone.replace(/[^+\d]/g, '').split(';')[0]}`}
                          style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '4px 10px', borderRadius: 20, border: '1px solid #dbeafe' }}
                        >
                          📞 {store.phone.split(';')[0]}
                        </a>
                      )}
                      <a
                        href={store.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: 'auto', padding: '8px 16px', borderRadius: 10,
                          background: 'linear-gradient(135deg, #059669, #047857)',
                          color: '#fff', fontSize: 11, fontWeight: 800, textDecoration: 'none',
                          boxShadow: '0 4px 8px rgba(5,150,105,0.2)',
                        }}
                      >
                        NAVIGATE ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Attribution */}
              <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                📡 Data: © OpenStreetMap contributors · Powered by Geoapify
              </div>
            </>
          )}

          {/* Empty state */}
          {!loading && !error && stores.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>
                {T('No stores loaded yet', 'अभी कोई स्टोर नहीं मिला')}
              </div>
              <p style={{ color: '#64748b', fontSize: 14, maxWidth: 320, margin: '0 auto 24px' }}>
                {T('Use GPS or enter your city name to find medical stores nearby.', 'नज़दीकी मेडिकल स्टोर देखने के लिए GPS दबाएं या शहर का नाम दर्ज करें।')}
              </p>
              <button
                onClick={syncGPS}
                className="btn btn-primary"
                style={{ height: 48, padding: '0 28px', borderRadius: 12, fontWeight: 800 }}
              >
                📡 {T('Find Near Me Now', 'अभी नज़दीकी ढूंढें')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB: JAN AUSHADHI
      ═════════════════════════════════════════════════════════ */}
      {tab === 'jan' && (
        <div className="animate-fade">
          <div className="card-premium" style={{ marginBottom: 24, padding: 32, borderTop: '6px solid #059669' }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, background: '#ecfdf5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, border: '1px solid #d1fae5'
              }}>🏥</div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
                  Jan Aushadhi Kendra
                </h2>
                <div className="badge badge-emerald">GOVERNMENT CERTIFIED</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: T('Helpline', 'हेल्पलाइन'), value: '1800-180-8080', color: '#059669', bg: '#ecfdf5' },
                { label: T('Website', 'वेबसाइट'), value: 'janaushadhi.gov.in', color: '#2563eb', bg: '#eff6ff' },
                { label: T('Stores Nationwide', 'देशभर में'), value: '10,000+ Stores', color: '#7c3aed', bg: '#f5f3ff' },
                { label: T('Medicines Available', 'उपलब्ध दवाइयाँ'), value: '1,700+ Medicines', color: '#d97706', bg: '#fffbeb' },
              ].map((s, idx) => (
                <div key={idx} style={{ padding: 16, borderRadius: 16, background: s.bg, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: s.color, opacity: 0.7, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <a
              href="https://janaushadhi.gov.in/StoreLocator.aspx"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 900, gap: 8 }}
            >
              🗺️ {T('Find Jan Aushadhi Near Me', 'नज़दीकी जन औषधि केंद्र ढूंढें')} ↗
            </a>
          </div>

          <div className="card-premium" style={{ marginBottom: 24 }}>
            <div className="lbl" style={{ marginBottom: 14 }}>{T('Coverage States', 'कवरेज राज्य')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {JAN_AUSHADHI_STATES.map(s => (
                <span key={s} className="chip" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#059669', fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, background: '#ecfdf5', borderRadius: 16, border: '1px solid #d1fae5' }}>
            <div style={{ fontWeight: 900, color: '#065f46', marginBottom: 8, fontSize: 14 }}>
              💚 {T('Why Jan Aushadhi?', 'जन औषधि क्यों?')}
            </div>
            <div style={{ fontSize: 13, color: '#064e3b', lineHeight: 1.7, fontWeight: 500 }}>
              {T(
                'Generic medicines at Jan Aushadhi stores cost 50-90% less than branded medicines. Same composition, same efficacy — verified by Indian Pharmacopoeia.',
                'जन औषधि स्टोर पर जेनेरिक दवाइयाँ ब्रांडेड से 50-90% सस्ती होती हैं। एक ही रचना, एक ही प्रभाव — इंडियन फार्माकोपिया द्वारा सत्यापित।'
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB: ONLINE PHARMACIES
      ═════════════════════════════════════════════════════════ */}
      {tab === 'online' && (
        <div className="animate-fade">
          <div className="card-premium" style={{ padding: 0, overflow: 'hidden' }}>
            {[
              { name: 'TATA 1mg', url: 'https://www.1mg.com', desc: T('Fast delivery, verified inventory, lab tests', 'फास्ट डिलीवरी, जाँच, लैब टेस्ट'), color: '#f97316', emoji: '🔶' },
              { name: 'PharmEasy', url: 'https://pharmeasy.in', desc: T('Express delivery + diagnostics + doctor consult', 'एक्सप्रेस डिलीवरी + डायग्नोस्टिक्स'), color: '#059669', emoji: '🟢' },
              { name: 'Netmeds', url: 'https://www.netmeds.com', desc: T('Trusted pharmacy supply chain', 'विश्वसनीय फार्मेसी सप्लाई चेन'), color: '#2563eb', emoji: '🔵' },
              { name: 'Apollo Pharmacy', url: 'https://www.apollopharmacy.in', desc: T('India\'s largest pharmacy chain', 'भारत की सबसे बड़ी फार्मेसी'), color: '#7c3aed', emoji: '🟣' },
              { name: 'Google Maps Search', url: 'https://www.google.com/maps/search/pharmacy+near+me', desc: T('Find local chemist shops near you', 'नज़दीकी केमिस्ट ढूंढें'), color: '#4285f4', emoji: '🗺️' },
            ].map((p, idx, arr) => (
              <a
                key={idx}
                href={p.url}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '20px 24px', borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #f1f5f9',
                  textDecoration: 'none', transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 14, background: `${p.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: `1px solid ${p.color}20`, flexShrink: 0,
                }}>
                  {p.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{ color: '#94a3b8', fontWeight: 700 }}>→</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          TAB: EMERGENCY
      ═════════════════════════════════════════════════════════ */}
      {tab === 'emergency' && (
        <div className="animate-fade">
          <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
            {[
              { number: '108', label: T('Ambulance', 'एंबुलेंस'), desc: T('National emergency ambulance service', 'राष्ट्रीय आपातकालीन एंबुलेंस'), color: '#ef4444' },
              { number: '102', label: T('Maternal Emergency', 'मातृत्व आपातकाल'), desc: T('Mother & child emergency transit', 'माता एवं शिशु आपातकालीन'), color: '#f59e0b' },
              { number: '104', label: T('Health Helpline', 'स्वास्थ्य हेल्पलाइन'), desc: T('24/7 National health consultation', '24/7 स्वास्थ्य परामर्श'), color: '#2563eb' },
              { number: '112', label: T('National Emergency', 'राष्ट्रीय आपातकाल'), desc: T('Police, Fire, Ambulance — unified', 'पुलिस, अग्निशमन, एंबुलेंस'), color: '#7c3aed' },
              { number: '1800-180-8080', label: T('Jan Aushadhi Helpline', 'जन औषधि हेल्पलाइन'), desc: T('Generic medicine store locator', 'जेनेरिक दवाई स्टोर'), color: '#059669' },
            ].map((c, idx) => (
              <div key={idx} className="card-premium" style={{ borderLeft: `5px solid ${c.color}`, padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: c.color, flexShrink: 0, minWidth: 80 }}>{c.number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 15, color: '#0f172a' }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <a
                    href={`tel:${c.number.replace(/[^+\d]/g, '')}`}
                    style={{
                      padding: '10px 18px', borderRadius: 12, textDecoration: 'none',
                      fontWeight: 900, fontSize: 12, color: '#fff',
                      background: c.color, flexShrink: 0,
                      boxShadow: `0 4px 8px ${c.color}40`,
                    }}
                  >
                    CALL ↗
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-danger" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ fontSize: 24 }}>🚨</div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
                <strong>CRITICAL:</strong>{T(
                  ' In case of chest pain, breathing difficulty, or sudden unconsciousness — call 108 immediately. Do not delay.',
                  ' सीने में दर्द, सांस लेने में दिक्कत, या बेहोशी — तुरंत 108 पर कॉल करें।'
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
      `}</style>
    </div>
  )
}
