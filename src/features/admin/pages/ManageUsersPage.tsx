import { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Profile, UserRole } from "@/types";
import { ROLE_LABELS } from "@/lib/constants";
import { initials } from "@/lib/utils";

const ASSIGNABLE_ROLES: UserRole[] = ["admin", "teacher", "student"];

export default function ManageUsersPage() {
  const { profile: currentProfile } = useAuth();
  const isSuperAdmin = currentProfile?.role === "super_admin";
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data as Profile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleActiveToggle(userId: string, isActive: boolean) {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: isActive } : u)));
      toast.success(isActive ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user");
    }
  }

  const columns = useMemo<ColumnDef<Profile>[]>(
    () => [
      {
        id: "name",
        header: "User",
        accessorFn: (row) => row.full_name,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.original.avatar_url ?? undefined} />
              <AvatarFallback>{initials(row.original.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{row.original.full_name}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        accessorFn: (row) => row.role,
        cell: ({ row }) =>
          isSuperAdmin && row.original.role !== "super_admin" ? (
            <Select value={row.original.role} onValueChange={(v) => handleRoleChange(row.original.id, v as UserRole)}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">{ROLE_LABELS[row.original.role]}</Badge>
          ),
      },
      {
        id: "active",
        header: "Active",
        accessorFn: (row) => row.is_active,
        cell: ({ row }) =>
          row.original.role === "super_admin" ? (
            <Badge variant="success">Active</Badge>
          ) : (
            <Switch checked={row.original.is_active} onCheckedChange={(checked) => handleActiveToggle(row.original.id, checked)} />
          ),
      },
    ],
    [isSuperAdmin]
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Manage Users" description="View all users and manage their roles and access." />
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        error={error}
        onRetry={load}
        searchPlaceholder="Search users..."
        emptyIcon={Users}
        emptyTitle="No Users Found"
        emptyDescription="Users will appear here once accounts are created."
      />
    </div>
  );
}
