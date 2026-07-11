import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/site/Logo';
import { authService } from '@/features/auth/services/authService';
import { paths } from '@/app/routes/paths';
import { toast } from '@/stores/toastStore';
import { staggerIn } from '@/lib/animation/motion';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const formRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (formRef.current) staggerIn(formRef.current.querySelectorAll('[data-reveal]'), { delay: 70 });
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      await authService.signInWithPassword(values.email, values.password);
      // Route by access: staff/admin → dashboard, customers → self-service portal.
      const access = await authService.getAccess();
      const isStaff = access.isSuperAdmin || access.roles.length > 0;
      const from = (location.state as { from?: string } | null)?.from;
      void navigate(isStaff ? (from ?? paths.dashboard) : paths.portalQurban, { replace: true });
    } catch (error) {
      toast.fromError(error, 'Sign in failed');
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="bg-grid absolute inset-0 opacity-[0.07]" />
        <div className="relative flex items-center gap-2.5">
          <Logo height={48} />
          <span className="text-lg font-semibold tracking-tight">BELS FARM</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Every animal, accounted for.
          </h2>
          <p className="mt-3 text-primary-foreground/75">
            Track livestock, health, breeding, finance and customers — built for serious farm
            operations that scale across branches.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} BELS FARM. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6">
        <div ref={formRef} className="w-full max-w-sm">
          <div data-reveal className="mb-8 lg:hidden">
            <Logo height={44} />
          </div>

          <h1 data-reveal className="text-2xl font-semibold tracking-tight text-foreground">
            {t('auth.welcome')}
          </h1>
          <p data-reveal className="mt-1.5 text-sm text-muted-foreground">
            {t('auth.signInSubtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div data-reveal>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                icon={<Mail className="size-4" />}
                invalid={!!errors.email}
                placeholder="email@belsfarm.com"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div data-reveal>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  {t('auth.password')}
                </label>
                <Link to={paths.forgotPassword} className="text-xs text-primary hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                icon={<Lock className="size-4" />}
                invalid={!!errors.password}
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            <div data-reveal>
              <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                {t('auth.signIn')}
              </Button>
            </div>
          </form>

          <p data-reveal className="mt-6 text-center text-sm text-muted-foreground">
            New to BELS FARM?{' '}
            <Link to={paths.register} className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
