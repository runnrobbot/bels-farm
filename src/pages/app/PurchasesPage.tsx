import { PageHeader } from '@/components/layout/PageHeader';
import { AdminPurchases } from '@/features/animal-purchases/AdminPurchases';

export default function PurchasesPage() {
  return (
    <div>
      <PageHeader
        title="Pembelian Hewan"
        description="Tinjau dan setujui permintaan pembelian hewan yang diajukan melalui website."
      />
      <AdminPurchases />
    </div>
  );
}
