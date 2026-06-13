import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { NAV_GROUPS } from './navigation';
import { useUiStore } from '@/stores/uiStore';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { Logo } from '@/components/site/Logo';
import { cn } from '@/lib/utils';

/**
 * Primary navigation rail. Collapses to an icon-only rail on desktop and slides
 * in as a drawer on mobile. Items are filtered by the user's view permissions.
 */
export function Sidebar() {
  const { t } = useTranslation();
  const { can } = usePermission();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const setMobileNav = useUiStore((s) => s.setMobileNav);

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((i) => can(i.resource, 'view')),
      })).filter((g) => g.items.length > 0),
    [can],
  );

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-surface transition-[width] duration-300 ease-spring',
        collapsed ? 'w-[68px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-4">
        <Logo height={36} className="shrink-0" />
        {!collapsed && (
          <div className="min-w-0 animate-fade-in">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              BELS FARM
            </p>
            <p className="truncate text-2xs text-muted-foreground">Livestock ERP</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <div key={group.heading}>
            {!collapsed && (
              <p className="px-2.5 pb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to.split('/').length <= 2}
                    onClick={() => setMobileNav(false)}
                    title={collapsed ? t(`nav.${item.label}`) : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-muted text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        collapsed && 'justify-center',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                        )}
                        <item.icon className="size-[18px] shrink-0" aria-hidden />
                        {!collapsed && <span className="truncate">{t(`nav.${item.label}`)}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={toggle}
        className="hidden h-12 items-center gap-3 border-t border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
