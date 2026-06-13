import QRCode from 'qrcode';
import { SITE } from '@/features/marketing/site';

/**
 * Open a print-ready window with a QR label for an animal (QR + ear tag + name).
 * Generates the QR offline; designed to fit a small adhesive label.
 */
export async function printAnimalLabel(
  qrValue: string,
  earTag: string,
  name?: string | null,
): Promise<void> {
  const dataUrl = await QRCode.toDataURL(qrValue, {
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  const win = window.open('', '_blank', 'width=420,height=560');
  if (!win) return;

  win.document.write(`<!doctype html>
<html><head><title>Label ${earTag}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .label { width: 280px; padding: 16px; border: 1px solid #ddd; border-radius: 12px; text-align: center; }
  .brand { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; }
  img { width: 220px; height: 220px; margin: 10px auto; }
  .tag { font-size: 20px; font-weight: 700; font-family: ui-monospace, monospace; color: #111; }
  .name { font-size: 13px; color: #4b5563; margin-top: 2px; }
  @media print { .label { border: none; } }
</style></head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, 300);">
  <div class="label">
    <div class="brand">${SITE.name}</div>
    <img src="${dataUrl}" alt="QR ${earTag}" />
    <div class="tag">${earTag}</div>
    ${name ? `<div class="name">${name}</div>` : ''}
  </div>
</body></html>`);
  win.document.close();
}
