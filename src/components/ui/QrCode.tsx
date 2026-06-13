import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renders an offline-generated QR code (data URL) for a given payload. */
export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const [src, setSrc] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1e241b', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!src) {
    return <div className={cn('skeleton rounded-md', className)} style={{ width: size, height: size }} />;
  }

  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="Kode QR"
      className={cn('rounded-md', className)}
    />
  );
}
