import React from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, Calendar, LogOut, Loader2, Home } from "lucide-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/events", label: "All Events", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r bg-card flex flex-col h-auto md:h-screen sticky top-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground">
            <BookOpen size={18} />
          </div>
          <span className="font-semibold text-lg tracking-tight">ClassMind</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                location === item.href
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {user && (
          <div className="p-4 mt-auto border-t">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={user.picture || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-medium truncate">{user.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
              </div>
            </div>
            <a
              href="/api/auth/logout"
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-secondary transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </a>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
