import * as React from "react"
import * as Icons from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
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
  navMain: [
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
  projects: [
    {
      name: "Documentation",
      url: "/documentation",
      icon: Icons.BookOpen,
    },
    {
      name: "Settings",
      url: "/settings",
      icon: Icons.Settings2,
    }
  ],
}

export function AppSidebar({
  ...props
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
