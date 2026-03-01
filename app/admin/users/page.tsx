"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Shield, ShieldCheck } from "lucide-react";

import { useToast } from "@/components/ui/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Widget } from "@/components/ui/widget";
import { useSession } from "@/hooks/use-session";
import { getUserProfiles, updateUserProfileAdmin, type UserProfileRecord } from "@/lib/api/user-profiles";
import { formatDateTime } from "@/lib/utils";

export default function AdminUsersPage() {
  const { session } = useSession();
  const { pushToast } = useToast();
  const [users, setUsers] = useState<UserProfileRecord[]>([]);
  const [pendingValues, setPendingValues] = useState<Record<string, "admin" | "user">>({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const refreshUsers = async () => {
    setLoading(true);

    try {
      const nextUsers = await getUserProfiles();
      setUsers(nextUsers);
      setPendingValues(
        Object.fromEntries(nextUsers.map((user) => [user.id, user.is_admin ? "admin" : "user"]))
      );
    } catch (error) {
      console.error("Failed to load users:", error);
      pushToast({
        title: "Failed to load users",
        description: "Check your Supabase permissions for the user_profiles table.",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshUsers();
  }, []);

  const stats = useMemo(() => {
    const adminCount = users.filter((user) => user.is_admin).length;
    return {
      total: users.length,
      admins: adminCount,
      standard: users.length - adminCount
    };
  }, [users]);

  const handleRoleChange = (userId: string, value: "admin" | "user") => {
    setPendingValues((current) => ({
      ...current,
      [userId]: value
    }));
  };

  const saveRole = async (user: UserProfileRecord) => {
    const nextRole = pendingValues[user.id] ?? (user.is_admin ? "admin" : "user");
    const nextIsAdmin = nextRole === "admin";

    if (nextIsAdmin === user.is_admin) {
      return;
    }

    if (session?.user.id === user.id && !nextIsAdmin) {
      pushToast({
        title: "Cannot remove your own admin access",
        description: "Promote another administrator first if you need to step down.",
        variant: "error"
      });
      setPendingValues((current) => ({
        ...current,
        [user.id]: "admin"
      }));
      return;
    }

    setSavingUserId(user.id);

    try {
      const updated = await updateUserProfileAdmin(user.id, nextIsAdmin);

      setUsers((current) => current.map((item) => (item.id === user.id ? updated : item)));
      setPendingValues((current) => ({
        ...current,
        [user.id]: updated.is_admin ? "admin" : "user"
      }));
      pushToast({
        title: "User updated",
        description: `${updated.full_name ?? updated.email ?? "User"} is now ${updated.is_admin ? "an admin" : "a standard user"}.`
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      pushToast({
        title: "Failed to update user",
        description: "The database rejected the change. Confirm your RLS or update policy for user_profiles.",
        variant: "error"
      });
      setPendingValues((current) => ({
        ...current,
        [user.id]: user.is_admin ? "admin" : "user"
      }));
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">User Administration</div>
          <div className="text-sm text-slate-600">Manage access for records stored in `public.user_profiles`.</div>
        </div>

        <Button variant="outline" className="h-9 rounded-lg px-3 text-sm" onClick={() => void refreshUsers()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total Users" value={stats.total} />
        <StatCard label="Administrators" value={stats.admins} accent="admin" />
        <StatCard label="Standard Users" value={stats.standard} accent="user" />
      </div>

      <Widget
        title="Manage Users"
        subtitle="Toggle administrator access by updating the `is_admin` boolean."
        loading={loading}
        emptyState="No user profiles were found."
        maxBodyHeight="none"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Current Access</TableHead>
              <TableHead>Change Access</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[160px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const pendingRole = pendingValues[user.id] ?? (user.is_admin ? "admin" : "user");
              const hasChanges = pendingRole !== (user.is_admin ? "admin" : "user");
              const isSelf = session?.user.id === user.id;
              const disableSave = savingUserId === user.id || !hasChanges;

              return (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-slate-900">{user.full_name ?? "Unnamed User"}</div>
                      <div className="text-xs text-slate-500">{user.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email ?? "No email"}</TableCell>
                  <TableCell>
                    <Badge variant={user.is_admin ? "secondary" : "default"}>
                      {user.is_admin ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={pendingRole}
                      onValueChange={(value) => handleRoleChange(user.id, value as "admin" | "user")}
                    >
                      <SelectTrigger className="h-9 w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDateTime(user.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button className="h-9 rounded-lg px-3 text-sm" disabled={disableSave} onClick={() => void saveRole(user)}>
                        {savingUserId === user.id ? "Saving..." : "Save"}
                      </Button>
                      {isSelf ? (
                        <Badge variant="outline">You</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Widget>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent
}: {
  label: string;
  value: number;
  accent?: "admin" | "user";
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-600">
        {accent === "admin" ? <ShieldCheck className="h-4 w-4 text-blue-600" /> : null}
        {accent === "user" ? <Shield className="h-4 w-4 text-slate-500" /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}
