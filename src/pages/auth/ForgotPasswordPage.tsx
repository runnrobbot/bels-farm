import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/site/Logo';
import { authService } from '@/features/auth/services/authService';
import { paths } from '@/app/routes/paths';
import { toast } from '@/stores/toastStore';
import { staggerIn } from '@/lib/animation/motion';

const schema = z.object({ email: z.string().email('Masukkan email yang valid') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (ref.current) staggerIn(ref.current.querySelectorAll('[data-reveal]'), { delay: 70 });
  }, [sent]);

  const onSubmit = async (values: FormValues) => {
    try {
      await authService.resetPassword(values.email);
      setSent(true);
    } catch (error) {
      toast.fromError(error, 'Gagal mengirim tautan reset');
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div ref={ref} className="w-full max-w-sm">
        <Link
          to={paths.login}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-reveal
        >
          <ArrowLeft className="size-4" /> Kembali ke masuk
        </Link>

        <div data-reveal className="mb-6">
          <Logo height={48} />
        </div>

        {sent ? (
          <div data-reveal className="rounded-xl border border-border bg-surface p-6 text-center">
            <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
              <MailCheck className="size-6" />
            </span>
            <h1 className="text-lg font-semibold text-foreground">Periksa email Anda</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Kami mengirim tautan atur ulang kata sandi ke{' '}
              <span className="font-medium text-foreground">{getValues('email')}</span>.
            </p>
          </div>
        ) : (
          <>
            <h1 data-reveal className="text-2xl font-semibold tracking-tight text-foreground">
              Lupa kata sandi?
            </h1>
            <p data-reveal className="mt-1.5 text-sm text-muted-foreground">
              Masukkan email Anda, kami kirimkan tautan untuk membuat kata sandi baru.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
              <div data-reveal>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  icon={<Mail className="size-4" />}
                  invalid={!!errors.email}
                  placeholder="anda@belsfarm.com"
                  {...register('email')}
                />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div data-reveal>
                <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                  Kirim tautan reset
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
