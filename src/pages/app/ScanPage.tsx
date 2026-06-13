import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, Camera, CameraOff, Search, Loader2, ScanBarcode } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { livestockService } from '@/features/livestock/services/livestockService';
import { paths } from '@/app/routes/paths';
import { toast } from '@/stores/toastStore';

type Status = 'starting' | 'scanning' | 'denied' | 'unsupported';

/** Extract an animal id from a scanned deep-link, else return the raw payload. */
function extractCode(raw: string): string {
  const match = raw.match(/livestock\/([0-9a-fA-F-]{36})/);
  return match ? match[1] : raw.trim();
}

export default function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolvingRef = useRef(false);

  const [status, setStatus] = useState<Status>('starting');
  const [manual, setManual] = useState('');
  const [looking, setLooking] = useState(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resolveCode = useCallback(
    async (raw: string) => {
      if (resolvingRef.current) return;
      const code = extractCode(raw);
      if (!code) return;
      resolvingRef.current = true;
      setLooking(true);
      try {
        const animal = await livestockService.findByCode(code);
        if (animal) {
          stopCamera();
          void navigate(paths.animal(animal.id));
        } else {
          toast.error('Tidak ditemukan', `Tidak ada ternak untuk kode "${code}".`);
          resolvingRef.current = false;
        }
      } catch (error) {
        toast.fromError(error, 'Gagal mencari ternak');
        resolvingRef.current = false;
      } finally {
        setLooking(false);
      }
    },
    [navigate, stopCamera],
  );

  useEffect(() => {
    if (!('BarcodeDetector' in window) || !window.BarcodeDetector) {
      setStatus('unsupported');
      return;
    }
    let cancelled = false;
    const Detector = window.BarcodeDetector;

    void (async () => {
      try {
        const detector = new Detector({ formats: ['qr_code', 'code_128', 'ean_13', 'code_39'] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus('scanning');

        intervalRef.current = setInterval(() => {
          if (resolvingRef.current || !videoRef.current) return;
          detector
            .detect(videoRef.current)
            .then((codes) => {
              if (codes.length > 0) void resolveCode(codes[0].rawValue);
            })
            .catch(() => undefined);
        }, 400);
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [resolveCode, stopCamera]);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (manual.trim()) void resolveCode(manual);
  };

  return (
    <div>
      <PageHeader
        title="Pindai QR / Ear Tag"
        description="Arahkan kamera ke kode QR ternak, atau ketik ear tag secara manual."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* Scanner */}
        <Card className="overflow-hidden p-0">
          <div className="relative aspect-square w-full bg-black sm:aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />
            {/* Reticle */}
            {status === 'scanning' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative size-48 rounded-2xl border-2 border-white/70">
                  <span className="absolute inset-x-0 top-0 h-0.5 animate-[scanline_2s_linear_infinite] bg-primary" />
                </div>
              </div>
            )}
            {status !== 'scanning' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface text-center">
                {status === 'starting' && (
                  <>
                    <Loader2 className="size-7 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Menyiapkan kamera…</p>
                  </>
                )}
                {status === 'denied' && (
                  <>
                    <CameraOff className="size-8 text-danger" />
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Akses kamera ditolak. Izinkan kamera di browser, atau gunakan input manual.
                    </p>
                  </>
                )}
                {status === 'unsupported' && (
                  <>
                    <Camera className="size-8 text-muted-foreground" />
                    <p className="max-w-xs text-sm text-muted-foreground">
                      Pemindai kamera tidak didukung di peramban ini. Gunakan input manual di samping
                      (disarankan Chrome di Android).
                    </p>
                  </>
                )}
              </div>
            )}
            {looking && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/60 py-2 text-sm text-white">
                <Loader2 className="size-4 animate-spin" /> Mencari…
              </div>
            )}
          </div>
        </Card>

        {/* Manual entry + help */}
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Search className="size-4 text-primary" /> Cari manual
            </div>
            <form onSubmit={submitManual} className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Ear tag / kode QR"
                icon={<ScanBarcode className="size-4" />}
              />
              <Button type="submit" loading={looking}>
                Cari
              </Button>
            </form>
          </Card>

          <Card className="bg-surface-sunken">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                <ScanLine className="size-5" />
              </span>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Tips</p>
                <p className="mt-1">
                  Setiap ternak punya kode QR unik yang bisa dicetak dari halaman detail ternak,
                  lalu ditempel di kandang atau kalung.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
