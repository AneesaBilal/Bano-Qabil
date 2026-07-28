import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Settings,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, ROUTES } from "@/lib/constants";
import type { UserRole } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { countPendingApprovals } from "@/api/approvals.api";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: UserRole[];
  /** Distinct accent color per item — shown on the active state (background tint + left border + icon/text color). */
  color: string;
  badgeKey?: "pendingApprovals";
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: ROUTES.dashboard, icon: LayoutDashboard, roles: ["super_admin", "admin", "teacher", "student"], color: "#2563eb" },
  { label: "Students", to: ROUTES.students, icon: GraduationCap, roles: ["super_admin", "admin", "teacher"], color: "#059669" },
  { label: "Teachers", to: ROUTES.teachers, icon: Users, roles: ["super_admin", "admin"], color: "#7c3aed" },
  { label: "Manage Users", to: "/users", icon: Users, roles: ["super_admin", "admin"], color: "#0891b2" },
  { label: "Courses", to: ROUTES.courses, icon: BookOpen, roles: ["super_admin", "admin"], color: "#ea580c" },
  { label: "Batches", to: ROUTES.batches, icon: Layers, roles: ["super_admin", "admin"], color: "#0d9488" },
  { label: "Assignments", to: ROUTES.assignments, icon: ClipboardList, roles: ["super_admin", "admin", "teacher", "student"], color: "#db2777" },
  { label: "Attendance", to: ROUTES.attendance, icon: CalendarCheck, roles: ["super_admin", "admin", "teacher", "student"], color: "#0ea5e9" },
  { label: "Approvals", to: ROUTES.approvals, icon: ClipboardCheck, roles: ["super_admin", "admin"], color: "#ca8a04", badgeKey: "pendingApprovals" },
  { label: "Reports", to: ROUTES.reports, icon: BarChart3, roles: ["super_admin", "admin"], color: "#4f46e5" },
  { label: "Settings", to: ROUTES.settings, icon: Settings, roles: ["super_admin", "admin", "teacher", "student"], color: "#64748b" },
];

const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true";
}

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const items = NAV_ITEMS.filter((item) => (role ? item.roles.includes(role) : false));

  useEffect(() => {
    if (role !== "admin" && role !== "super_admin") return;
    countPendingApprovals()
      .then(setPendingApprovals)
      .catch(() => {});
  }, [role]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      return next;
    });
  }

  function badgeCountFor(item: NavItem) {
    if (item.badgeKey === "pendingApprovals") return pendingApprovals;
    return 0;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "relative flex h-full flex-col border-r bg-card transition-[width] duration-200 ease-in-out",
          collapsed ? "w-16" : "w-64",
          className
        )}
      >
        <div className={cn("flex h-14 items-center gap-2 border-b px-4", collapsed && "justify-center px-0")}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          {!collapsed && <span className="truncate font-semibold">{APP_NAME}</span>}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-thin">
          {items.map((item) => {
            const badgeCount = badgeCountFor(item);

            const linkContent = (isActive: boolean) => (
              <>
                <item.icon className="h-4 w-4 shrink-0" style={isActive ? { color: item.color } : undefined} />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {badgeCount > 0 && (
                  <span
                    className={cn(
                      "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1 text-[11px] font-semibold text-white",
                      collapsed && "absolute right-1 top-1 h-4 min-w-4 text-[9px]"
                    )}
                    style={{ backgroundColor: item.color }}
                  >
                    {badgeCount}
                  </span>
                )}
              </>
            );

            const navLink = (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-2 text-sm font-medium transition-all duration-150",
                    collapsed && "justify-center px-0",
                    isActive
                      ? "font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )
                }
                style={({ isActive }) =>
                  isActive
                    ? { backgroundColor: `${item.color}1a`, color: item.color, borderLeftColor: item.color }
                    : undefined
                }
              >
                {({ isActive }) => linkContent(isActive)}
              </NavLink>
            );

            return collapsed ? (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {badgeCount > 0 && ` (${badgeCount})`}
                </TooltipContent>
              </Tooltip>
            ) : (
              navLink
            );
          })}
        </nav>

        <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
