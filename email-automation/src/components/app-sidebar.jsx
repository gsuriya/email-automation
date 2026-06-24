import * as React from "react"
import * as Icons from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { useAuth } from "@/components/AuthGate"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "Test",
      logo: Icons.GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: Icons.AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Icons.Command,
      plan: "Free",
    },
  ],
  primary: [
    {
      title: "Cold Emailing Script",
      url: "/cold-emailing/spreadsheet",
      icon: Icons.Send,
      isActive: true,
      items: [
        {
          title: "Stage Emails",
          url: "/cold-emailing/spreadsheet",
        },
        {
          title: "Create Drafts",
          url: "/cold-emailing/drafts",
        },
      ],
    },
    {
      title: "Reachouts",
      url: "/tracker",
      icon: Icons.BookUser,
      isActive: true,
      items: [
        {
          title: "Tracker",
          url: "/tracker",
        },
      ],
    }
  ],
  comingSoonMain: [
    {
      title: "Send Emails",
      url: "/send-emails/draft",
      icon: Icons.Mail,
      items: [
        {
          title: "Create Draft",
          url: "/send-emails/draft",
        },
        {
          title: "Create Cadences",
          url: "/send-emails/cadences",
        },
      ],
    },
  ],
  comingSoonLinks: [
    {
      name: "Documentation",
      url: "/documentation",
      icon: Icons.BookOpen,
    },
    {
      name: "Resources",
      url: "/settings",
      icon: Icons.Settings2,
    }
  ],
}

export function AppSidebar({
  ...props
}) {
  const { user } = useAuth()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <div className="pt-4">
          <NavMain label={null} items={data.primary} />
        </div>
        <div className="mt-auto pb-2">
          <NavMain label="Coming Soon" items={data.comingSoonMain} />
          <NavProjects projects={data.comingSoonLinks} />
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
