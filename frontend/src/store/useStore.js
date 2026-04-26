/**
 * AI Health Guardian v3 — Global State Store
 * Fixed: activePage (was activeTab mismatch), added language selection
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const defaultProfile = {
  session_id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'default-session',
  name: '',
  age: null,
  gender: '',
  blood_group: '',
  weight: null,
  city: '',
  language: 'en',
  diseases: [],
  allergies: [],
  currentMedicines: [],
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Language Selection (shown on first open) ──
      languageSelected: false,
      setLanguageSelected: (v) => set({ languageSelected: v }),

      // ── Auth ──
      user: null,
      authLoading: true,
      setUser: (user) => set({ user }),
      setAuthLoading: (loading) => set({ authLoading: loading }),

      // ── Session Profile (Guest Mode) ──
      sessionProfile: { age: null, isPregnant: false, diseases: [], allergies: [], currentMedicines: [] },
      setSessionProfile: (updates) => set((s) => ({ sessionProfile: { ...s.sessionProfile, ...updates } })),
      clearSessionProfile: () => set({ sessionProfile: { age: null, isPregnant: false, diseases: [], allergies: [], currentMedicines: [] } }),

      // ── Analysis Flow ──
      analysis: {
        medicines: [],
        medicationSchedule: [], // [{ medicine: string, time: string, dose_mg: number }]
        profileData: null,      // QuickForm data passed synchronously (no async race)
        ocrData: null,
        result: null,
        isAnalyzing: false,
        error: null
      },
      setAnalysis: (updates) => set((s) => ({ analysis: { ...s.analysis, ...updates } })),
      resetAnalysis: () => set({ analysis: { medicines: [], medicationSchedule: [], profileData: null, ocrData: null, result: null, isAnalyzing: false, error: null } }),

      // ── Navigation (FIXED: was activeTab) ──
      activePage: 'home',
      setActivePage: (page) => set({ activePage: page }),

      // ── User Profile (persisted) ──
      profile: defaultProfile,
      setProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
      resetProfile: () => set({ profile: defaultProfile }),

      getProfileCompleteness: () => {
        const p = get().profile
        const fields = [
          p.name, p.age, p.gender, p.blood_group,
          p.diseases?.length, p.allergies?.length, p.currentMedicines?.length, p.city,
        ]
        return Math.round((fields.filter(Boolean).length / fields.length) * 100)
      },

      isPersonalized: () => {
        const p = get().profile
        return !!(p.name && (p.diseases?.length || p.allergies?.length || p.currentMedicines?.length || p.age))
      },

      // ── Chat ──
      chatHistory: [],
      addChatMessage: (msg) =>
        set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
      clearChatHistory: () => set({ chatHistory: [] }),
      setChatHistory: (history) => set({ chatHistory: history }),

      // ── TTS & Voice ──
      ttsEnabled: false,
      setTtsEnabled: (v) => set({ ttsEnabled: v }),

      // ── Symptom page state ──
      selectedSymptoms: [],
      addSymptom: (s) =>
        set((st) => ({
          selectedSymptoms: st.selectedSymptoms.includes(s)
            ? st.selectedSymptoms
            : [...st.selectedSymptoms, s],
        })),
      removeSymptom: (s) =>
        set((st) => ({ selectedSymptoms: st.selectedSymptoms.filter((x) => x !== s) })),
      clearSymptoms: () => set({ selectedSymptoms: [] }),
      lastSymptomResult: null,
      setLastSymptomResult: (r) => set({ lastSymptomResult: r }),

      // ── Interaction page state ──
      interactionMeds: [],
      addInteractionMed: (m) =>
        set((st) => ({
          interactionMeds: st.interactionMeds.includes(m)
            ? st.interactionMeds
            : [...st.interactionMeds, m],
        })),
      removeInteractionMed: (m) =>
        set((st) => ({ interactionMeds: st.interactionMeds.filter((x) => x !== m) })),
      clearInteractionMeds: () => set({ interactionMeds: [] }),

      // ── Scanner state ──
      scanMode: 'upload',
      setScanMode: (m) => set({ scanMode: m }),
      lastScanResult: null,
      setLastScanResult: (r) => set({ lastScanResult: r }),

      // ── Store search state ──
      storeType: 'pharmacy',
      setStoreType: (t) => set({ storeType: t }),
      userLocation: null,
      setUserLocation: (loc) => set({ userLocation: loc }),

      searchHistory: [],
      addSearchHistory: (item) =>
        set((s) => ({
          searchHistory: [item, ...s.searchHistory.filter((x) => x !== item)].slice(0, 20),
        })),
    }),
    {
      name: 'ahg-v3-store',
      partialize: (s) => ({
        profile: s.profile,
        chatHistory: s.chatHistory,
        ttsEnabled: s.ttsEnabled,
        searchHistory: s.searchHistory,
        languageSelected: s.languageSelected,
      }),
    }
  )
)

export const useProfile = () => useStore((s) => s.profile)
export const useIsPersonalized = () => useStore((s) => s.isPersonalized())
export const useProfileCompleteness = () => useStore((s) => s.getProfileCompleteness())
export const useChatHistory = () => useStore((s) => s.chatHistory)
export const useSelectedSymptoms = () => useStore((s) => s.selectedSymptoms)
export const useInteractionMeds = () => useStore((s) => s.interactionMeds)
