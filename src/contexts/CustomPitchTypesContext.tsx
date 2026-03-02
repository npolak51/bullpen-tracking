import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { fetchCustomPitchTypes } from '../lib/customPitchTypes'
import type { CustomPitchType } from '../types/database'

interface CustomPitchTypesContextValue {
  customTypes: CustomPitchType[]
  refresh: () => Promise<void>
}

const CustomPitchTypesContext = createContext<CustomPitchTypesContextValue | null>(
  null
)

export function CustomPitchTypesProvider({ children }: { children: ReactNode }) {
  const [customTypes, setCustomTypes] = useState<CustomPitchType[]>([])

  const refresh = useCallback(async () => {
    const types = await fetchCustomPitchTypes()
    setCustomTypes(types)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <CustomPitchTypesContext.Provider value={{ customTypes, refresh }}>
      {children}
    </CustomPitchTypesContext.Provider>
  )
}

export function useCustomPitchTypes() {
  const ctx = useContext(CustomPitchTypesContext)
  return ctx ?? { customTypes: [], refresh: async () => {} }
}
