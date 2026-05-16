'use client'

import { createContext, useContext } from 'react'

interface AdminMobileCtx {
  isMobile: boolean
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const AdminMobileCtx = createContext<AdminMobileCtx>({
  isMobile: false,
  sidebarOpen: false,
  setSidebarOpen: () => {},
})

export function useAdminMobile() {
  return useContext(AdminMobileCtx)
}
