import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Lock, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/site/Logo';
import { supabase } from '@/lib/supabase/client';
import { paths } from '@/app/routes/paths';
import { toast } from '@/stores/toastStore';
import { toAppError } from '@/lib/errors';
import { staggerIn } from '@/lib/animation/motion';

const schema = z
  .object({
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirm'],
  });
type FormValues = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Supabase establishes a temporary recovery session from the email link.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ref.current) staggerIn(ref.current.querySelectorAll('[data-reveal]'), { delay: 70 });
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw toAppError(error);
      toast.success('Kata sandi diperbarui', 'Silakan masuk dengan kata sandi baru Anda.');
      void navigate(paths.dashboard, { replace: true });
    } catch (error) {
      toast.fromError(error, 'Gagal memperbarui kata sandi');
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div ref={ref} className="w-full max-w-sm">
        <div data-reveal className="mb-6">
          <Logo height={48} />
        </div>
        <h1 data-reveal className="text-2xl font-semibold tracking-tight text-foreground">
          Buat kata sandi baru
        </h1>
        <p data-reveal className="mt-1.5 text-sm text-muted-foreground">
          {ready
            ? 'Masukkan kata sandi baru untuk akun Anda.'
            : 'Membuka tautan… jika halaman ini tidak siap, buka kembali tautan dari email Anda.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <div data-reveal>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Kata sandi baru
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              icon={<Lock className="size-4" />}
              invalid={!!errors.password}
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <div data-reveal>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-foreground">
              Konfirmasi kata sandi
            </label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              icon={<KeyRound className="size-4" />}
              invalid={!!errors.confirm}
              placeholder="••••••••"
              {...register('confirm')}
            />
            {errors.confirm && <p className="mt-1 text-xs text-danger">{errors.confirm.message}</p>}
          </div>
          <div data-reveal>
            <Button type="submit" loading={isSubmitting} disabled={!ready} className="w-full" size="lg">
              Simpan kata sandi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
