import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { authService } from '@/features/auth/services/authService';
import { Avatar } from '@/components/ui/Avatar';
import { paths } from '@/app/routes/paths';
import { setLocale, SUPPORTED_LOCALES } from '@/i18n';
import { toast } from '@/stores/toastStore';
import { popIn } from '@/lib/animation/motion';
import { useTranslation } from 'react-i18next';

export function UserMenu() {
  const { profile, session, access } = useAuth();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = profile?.full_name || session?.user.email || 'User';
  const roleLabel = access.isSuperAdmin ? 'Super Admin' : access.roles[0] ?? 'Member';

  useEffect(() => {
    if (!open) return;
    if (menuRef.current) popIn(menuRef.current);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      void navigate(paths.login);
    } catch (error) {
      toast.fromError(error, 'Could not sign out');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-muted"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} size="sm" />
        <span className="hidden text-sm font-medium text-foreground sm:block">{name.split(' ')[0]}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="panel-raised absolute right-0 top-12 w-60 overflow-hidden p-1.5"
        >
          <div className="flex items-center gap-3 px-2.5 py-2">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-2xs capitalize text-muted-foreground">{roleLabel}</p>
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          <MenuItem icon={User} label="Profile" onClick={() => navigate(paths.settings)} />
          <MenuItem icon={Settings} label="Settings" onClick={() => navigate(paths.settings)} />

          <div className="my-1 h-px bg-border" />

          <div className="px-2.5 py-1.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
              <Languages className="size-3" /> Language
            </p>
            <div className="flex gap-1">
              {SUPPORTED_LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}                  className={`flex-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    i18n.language === l.code
                      ? 'bg-primary-muted text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          <MenuItem icon={LogOut} label="Sign out" tone="danger" onClick={handleSignOut} />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: typeof User;
  label: string;
  onClick: () => void;
  tone?: 'danger';
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted ${
        tone === 'danger' ? 'text-danger hover:bg-danger/10' : 'text-foreground'
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}
