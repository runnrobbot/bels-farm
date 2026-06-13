import { SITE } from '@/features/marketing/site';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export interface ReceiptData {
  receiptNo: string;
  paidAt: string;
  customerName: string;
  planName: string;
  amount: number;
  method: string | null;
}

/**
 * Open a print-ready kuitansi (receipt) for a confirmed qurban payment.
 * Generated client-side; no server round-trip needed.
 */
export function printReceipt(data: ReceiptData): void {
  const win = window.open('', '_blank', 'width=560,height=720');
  if (!win) return;

  const dateLabel = format(new Date(data.paidAt), 'd MMMM yyyy');

  win.document.write(`<!doctype html>
<html lang="id"><head><meta charset="utf-8" /><title>Kuitansi ${data.receiptNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: ui-sans-serif, system-ui, Arial, sans-serif; color: #1f2419; }
  body { padding: 40px; }
  .card { max-width: 520px; margin: 0 auto; border: 1px solid #e2dac6; border-radius: 16px; overflow: hidden; }
  .head { background: #33502f; color: #f6f1e7; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
  .head h1 { font-size: 18px; letter-spacing: 0.04em; }
  .head .sub { font-size: 12px; opacity: 0.8; }
  .body { padding: 28px; }
  .title { font-size: 13px; letter-spacing: 0.18em; text-transform: uppercase; color: #8a8a7a; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2dac6; font-size: 14px; }
  .row .k { color: #5c6052; }
  .row .v { font-weight: 600; }
  .amount { margin-top: 22px; padding: 18px; background: #eef2e8; border-radius: 12px; text-align: center; }
  .amount .lbl { font-size: 12px; color: #5c6052; }
  .amount .val { font-size: 28px; font-weight: 700; color: #243b20; margin-top: 4px; }
  .status { display: inline-block; margin-top: 8px; padding: 3px 12px; border-radius: 999px; background: #2f855a; color: #fff; font-size: 12px; font-weight: 600; }
  .foot { padding: 18px 28px; font-size: 11px; color: #8a8a7a; text-align: center; border-top: 1px solid #e2dac6; }
  @media print { body { padding: 0; } .card { border: none; } }
</style></head>
<body onload="window.print(); setTimeout(function(){ window.close(); }, 300);">
  <div class="card">
    <div class="head">
      <div><h1>${SITE.name}</h1><div class="sub">Tabungan Qurban</div></div>
      <div style="text-align:right"><div class="sub">No. Kuitansi</div><div style="font-weight:700">${data.receiptNo}</div></div>
    </div>
    <div class="body">
      <div class="title">Kuitansi Pembayaran</div>
      <div style="margin-top:14px">
        <div class="row"><span class="k">Tanggal</span><span class="v">${dateLabel}</span></div>
        <div class="row"><span class="k">Nama</span><span class="v">${data.customerName}</span></div>
        <div class="row"><span class="k">Paket</span><span class="v">${data.planName}</span></div>
        <div class="row"><span class="k">Metode</span><span class="v">${data.method ?? '-'}</span></div>
      </div>
      <div class="amount">
        <div class="lbl">Jumlah Diterima</div>
        <div class="val">${formatCurrency(data.amount)}</div>
        <div class="status">LUNAS / DIKONFIRMASI</div>
      </div>
    </div>
    <div class="foot">Kuitansi ini sah tanpa tanda tangan. Terima kasih atas kepercayaan Anda. — ${SITE.name}</div>
  </div>
</body></html>`);
  win.document.close();
}
