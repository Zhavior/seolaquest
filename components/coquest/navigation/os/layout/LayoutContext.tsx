'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

interface LayoutContextValue {
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({
  children,
}: {
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
    }),
    [collapsed]
  )

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)

  if (!ctx) {
    throw new Error('useLayout must be used inside LayoutProvider')
  }

  return ctx
}
