'use client'

import { useEffect, useState } from 'react'
import { isElectron, getElectronAPI, type ElectronAPI } from '@/lib/platform'

/** Electron 環境判定とプラットフォーム API 取得フック */
export function useElectron(): { isElectron: boolean; api: ElectronAPI | null } {
  const [state, setState] = useState({ isElectron: false, api: null as ElectronAPI | null })

  useEffect(() => {
    setState({ isElectron, api: getElectronAPI() })
  }, [])

  return state
}
