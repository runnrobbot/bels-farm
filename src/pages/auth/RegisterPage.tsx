import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/site/Logo';
import { authService } from '@/features/auth/services/authService';
import { ensureMyCustomer } from '@/features/portal/service';
import { paths } from '@/app/routes/paths';
import { toast } from '@/stores/toastStore';
import { staggerIn } from '@/lib/animation/motion';

const schema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (ref.current) staggerIn(ref.current.querySelectorAll('[data-reveal]'), { delay: 60 });
  }, [checkEmail]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { session } = await authService.signUp(values.email, values.password, values.full_name);
      if (session) {
        // No email confirmation required — set up the customer record and enter.
        await ensureMyCustomer(values.full_name, values.whatsapp);
        void navigate(paths.portalQurban, { replace: true });
      } else {
        setCheckEmail(true);
      }
    } catch (error) {
      toast.fromError(error, 'Pendaftaran gagal');
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        <div className="bg-grid absolute inset-0 opacity-[0.07]" />
        <div className="relative flex items-center gap-2.5">
          <Logo height={48} />
          <span className="text-lg font-semibold tracking-tight">BELS FARM</span>
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Menabung qurban, tanpa ribet.
          </h2>
          <p className="mt-3 text-primary-foreground/75">
            Daftar akun untuk mengikuti program Tabungan Qurban, kirim setoran, dan
            pantau progres Anda kapan saja — sepenuhnya online.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} BELS FARM.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div ref={ref} className="w-full max-w-sm">
          <div data-reveal className="mb-8 lg:hidden">
            <Logo height={44} />
          </div>

          {checkEmail ? (
            <div data-reveal className="rounded-xl border border-border bg-surface p-6 text-center">
              <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
                <MailCheck className="size-6" />
              </span>
              <h1 className="text-lg font-semibold text-foreground">Verifikasi email Anda</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Kami mengirim tautan verifikasi. Setelah dikonfirmasi, masuk untuk
                mulai menabung.
              </p>
              <Link to={paths.login} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                Ke halaman masuk
              </Link>
            </div>
          ) : (
            <>
              <h1 data-reveal className="text-2xl font-semibold tracking-tight text-foreground">
                Buat akun
              </h1>
              <p data-reveal className="mt-1.5 text-sm text-muted-foreground">
                Untuk mengikuti Tabungan Qurban secara online.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
                <div data-reveal>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Nama lengkap</label>
                  <Input icon={<User className="size-4" />} invalid={!!errors.full_name} placeholder="Nama Anda" {...register('full_name')} />
                  {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name.message}</p>}
                </div>
                <div data-reveal>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                  <Input type="email" icon={<Mail className="size-4" />} invalid={!!errors.email} placeholder="anda@email.com" {...register('email')} />
                  {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
                </div>
                <div data-reveal>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">No. WhatsApp</label>
                  <Input icon={<Phone className="size-4" />} invalid={!!errors.whatsapp} placeholder="08xxxxxxxxxx" {...register('whatsapp')} />
                  {errors.whatsapp && <p className="mt-1 text-xs text-danger">{errors.whatsapp.message}</p>}
                </div>
                <div data-reveal>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Kata sandi</label>
                  <Input type="password" icon={<Lock className="size-4" />} invalid={!!errors.password} placeholder="••••••••" {...register('password')} />
                  {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
                </div>
                <div data-reveal>
                  <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                    Daftar
                  </Button>
                </div>
              </form>

              <p data-reveal className="mt-6 text-center text-sm text-muted-foreground">
                Sudah punya akun?{' '}
                <Link to={paths.login} className="font-medium text-primary hover:underline">
                  Masuk
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
