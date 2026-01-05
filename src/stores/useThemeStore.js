import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',

            setTheme: (theme) => {
                set({ theme })
                // Apply to document
                const root = window.document.documentElement
                root.classList.remove('light', 'dark')
                root.classList.add(theme)
            },

            toggleTheme: () => {
                set((state) => {
                    const newTheme = state.theme === 'light' ? 'dark' : 'light'
                    // Apply to document
                    const root = window.document.documentElement
                    root.classList.remove('light', 'dark')
                    root.classList.add(newTheme)
                    return { theme: newTheme }
                })
            }
        }),
        {
            name: 'theme-storage', // localStorage key
            onRehydrateStorage: () => (state) => {
                // Apply theme to document after rehydration
                if (state?.theme) {
                    const root = window.document.documentElement
                    root.classList.remove('light', 'dark')
                    root.classList.add(state.theme)
                }
            },
        }),
)