'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminMobileCtx } from './AdminMobileCtx'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <AdminMobileCtx.Provider value={{ isMobile, sidebarOpen, setSidebarOpen }}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F7F1E4' }}>
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.35)', zIndex: 38,
            }}
          />
        )}
        <AdminSidebar />
        <main className="admin-main" style={{
          flex: 1,
          marginLeft: isMobile ? 0 : 248,
          minWidth: 0,
          overflowX: 'hidden',
        }}>
          <style>{`
            @media (max-width: 768px) {
              .admin-main [style*="8px 32px 48px"] {
                padding: 8px 14px 32px !important;
              }
              .admin-main [style*="18px 32px"] {
                padding: 12px 14px !important;
                flex-wrap: wrap !important;
                gap: 10px !important;
                row-gap: 10px !important;
              }
              .admin-main [style*="1.4fr 1fr"],
              .admin-main [style*="1.5fr 1fr"] {
                grid-template-columns: 1fr !important;
                gap: 16px !important;
              }
              .admin-main [style*="repeat(4, 1fr)"] {
                grid-template-columns: 1fr 1fr !important;
              }
              .admin-main [style*="1fr 140px 120px 130px"] {
                grid-template-columns: 1fr !important;
                gap: 6px !important;
              }
              .admin-main [style*="0 0 calc(50%"],
              .admin-main [style*="0 0 160px"],
              .admin-main [style*="0 0 200px"],
              .admin-main [style*="0 0 220px"],
              .admin-main [style*="0 0 240px"] {
                flex: 1 1 100% !important;
              }
              .admin-main [style*="padding: 28px"],
              .admin-main [style*="padding:28px"] {
                padding: 18px !important;
              }
              .admin-main [style*="max-width: 520px"],
              .admin-main [style*="max-width:520px"] {
                max-width: 100% !important;
              }
            }
            @media (max-width: 480px) {
              .admin-main [style*="18px 32px"] button,
              .admin-main [style*="18px 32px"] a {
                font-size: 12.5px !important;
                padding: 7px 10px !important;
              }
            }
          `}</style>
          {children}
        </main>
      </div>
    </AdminMobileCtx.Provider>
  )
}
