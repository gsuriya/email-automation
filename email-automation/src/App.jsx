import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { AuthGate } from '@/components/AuthGate'
import './App.css'
import { Meteors } from '@/components/ui/meteors'

import CreateDraft from '@/pages/CreateDraft'
import CreateCadences from '@/pages/CreateCadences'
import Tracker from '@/pages/Tracker'
import Documentation from '@/pages/Documentation'
import Settings from '@/pages/Settings'
import AuthCallback from '@/pages/AuthCallback'
import ColdEmailSpreadsheet from '@/pages/ColdEmailSpreadsheet'
import ColdEmailDrafts from '@/pages/ColdEmailDrafts'

function WorkspaceShell() {
  return (
    <AuthGate>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>

          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 overflow-auto h-full">
            <Routes>
              <Route path="/send-emails/draft" element={<CreateDraft />} />
              <Route path="/send-emails/cadences" element={<CreateCadences />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/cold-emailing/spreadsheet" element={<ColdEmailSpreadsheet />} />
              <Route path="/cold-emailing/drafts" element={<ColdEmailDrafts />} />
              <Route path="/documentation" element={<Documentation />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

        </SidebarInset>
      </SidebarProvider>
    </AuthGate>
  )
}

function AppRoutes() {
  const location = useLocation()

  if (location.pathname === '/auth/callback') {
    return (
      <AuthGate>
        <AuthCallback />
      </AuthGate>
    )
  }

  return <WorkspaceShell />
}

export default function App() {
  return (
    <HeroUIProvider>
      <BrowserRouter>
        <Toaster richColors />
        <Meteors>
          <TooltipProvider>
            <AppRoutes />
          </TooltipProvider>
        </Meteors>
      </BrowserRouter>
    </HeroUIProvider>
  )
}
