import { Menu, Search, Command } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';

/**
 * Top app bar: mobile nav trigger, command-palette search affordance, theme
 * toggle, notifications and the user menu.
 */
export function Topbar() {
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <button
        onClick={() => setMobileNav(true)}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-9 max-w-md flex-1 items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-ring/40 hover:bg-surface-raised"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search anything…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-2xs sm:flex">
          <Command className="size-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <div className="mx-1 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}
