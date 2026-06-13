import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, CornerDownLeft, ScanLine } from 'lucide-react';
import { NAV_GROUPS } from './navigation';
import { paths } from '@/app/routes/paths';
import { useUiStore } from '@/stores/uiStore';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { popIn } from '@/lib/animation/motion';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  run: () => void;
}

/**
 * Raycast-style command palette (⌘K / Ctrl+K). Provides fuzzy navigation and a
 * few global actions. Fully keyboard-driven with roving selection.
 */
export function CommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermission();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUiStore.getState().toggleCommand();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => {
        if (panelRef.current) popIn(panelRef.current);
        inputRef.current?.focus();
      });
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => can(i.resource, 'view'))
      .map((i) => ({
        id: i.to,
        label: t(`nav.${i.label}`),
        hint: 'Navigate',
        icon: i.icon,
        run: () => navigate(i.to),
      }));

    const actions: Command[] = [
      { id: 'scan', label: 'Scan QR / Ear Tag', hint: 'Action', icon: ScanLine, run: () => navigate(paths.scan) },
    ];

    return [...navCommands, ...actions];
  }, [can, navigate, t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(filtered.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % Math.max(filtered.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = filtered[active];
      if (command) {
        command.run();
        setOpen(false);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="panel-raised w-full max-w-xl overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search modules and actions…"
            className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-2xs text-muted-foreground">ESC</kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">No matches</li>
          )}
          {filtered.map((command, index) => (
            <li key={command.id}>
              <button
                onMouseEnter={() => setActive(index)}
                onClick={() => {
                  command.run();
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                  index === active ? 'bg-primary-muted text-primary' : 'text-foreground hover:bg-muted',
                )}
              >
                <command.icon className="size-[18px] shrink-0 opacity-80" />
                <span className="flex-1">{command.label}</span>
                {command.hint && (
                  <span className="text-2xs text-muted-foreground">{command.hint}</span>
                )}
                {index === active && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
