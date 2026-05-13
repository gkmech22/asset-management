import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceUser {
  email: string;
  name: string;
  role?: string;
  online_at: string;
}

const colorFor = (s: string) => {
  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const titleCase = (s?: string) => (s ? s.replace(/\b\w/g, (c) => c.toUpperCase()) : "");

export const OnlineUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [role, setRole] = useState<string | undefined>();

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();
      if (!cancelled) setRole(data?.role || undefined);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const channel = supabase.channel("online-users", {
      config: { presence: { key: user.email } },
    });

    const sync = () => {
      const state = channel.presenceState<PresenceUser>();
      const list: PresenceUser[] = [];
      const seen = new Set<string>();
      Object.values(state).forEach((arr) => {
        arr.forEach((p) => {
          if (!seen.has(p.email)) {
            seen.add(p.email);
            list.push(p);
          }
        });
      });
      list.sort((a, b) => (a.email === user.email ? -1 : b.email === user.email ? 1 : a.name.localeCompare(b.name)));
      setUsers(list);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            email: user.email,
            name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              (user.email ?? "").split("@")[0],
            role,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.email, user?.user_metadata, role]);

  const count = users.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {count} online
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <div className="font-semibold text-sm">Online Users</div>
          <div className="text-xs text-muted-foreground">{count} currently active</div>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {users.map((u) => {
            const initial = (u.name || u.email).charAt(0).toUpperCase();
            const isMe = u.email === user?.email;
            return (
              <div key={u.email} className="flex items-center gap-3 px-4 py-2.5">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className={colorFor(u.email)}>{initial}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {titleCase(u.role) || "User"}
                    {" • "}
                    {isMe ? "You" : u.email}
                  </div>
                </div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            );
          })}
          {count === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No users online</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
