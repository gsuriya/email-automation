import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import './App.css'
import { Meteors } from '@/components/ui/meteors'

import CreateDraft    from '@/pages/CreateDraft'
import CreateCadences from '@/pages/CreateCadences'
import ByCompany      from '@/pages/ByCompany'
import ByPeople       from '@/pages/ByPeople'
import Documentation  from '@/pages/Documentation'
import Settings       from '@/pages/Settings'

export default function App() {
  return (
    <HeroUIProvider>
    <BrowserRouter>
      <Meteors>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>

              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/send-emails/draft"    element={<CreateDraft />} />
                  <Route path="/send-emails/cadences" element={<CreateCadences />} />
                  <Route path="/reachouts/company"    element={<ByCompany />} />
                  <Route path="/reachouts/people"     element={<ByPeople />} />
                  <Route path="/documentation"        element={<Documentation />} />
                  <Route path="/settings"             element={<Settings />} />
                </Routes>
              </main>


            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </Meteors>
    </BrowserRouter>
    </HeroUIProvider>
  )
}
