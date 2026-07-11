import { useTranslation } from 'react-i18next';
import { useEffect, useRef } from 'react';
import { Beef, Wallet, TrendingDown, TrendingUp, Users, Boxes, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/features/dashboard/components/StatCard';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';
import { useAuth } from '@/features/auth/AuthProvider';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card, CardTitle } from '@/components/ui/Card';
import { staggerIn } from '@/lib/animation/motion';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data, isLoading, isError } = useDashboardStats();
  const gridRef = useRef<HTMLDivElement>(null);

  // Inline scroll reveal: stagger cards in when they enter the viewport.
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          staggerIn(el.children);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [data]);

  const greeting = profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : '';

  return (
    <div>
      <PageHeader
        title={`${t('dashboard.title')}${greeting}`}
        description="A live snapshot of your farm operations this month."
      />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <Card className="border-danger/30">
          <CardTitle className="text-danger">Couldn't load dashboard</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Check your Supabase connection and try refreshing.
          </p>
        </Card>
      )}

      {data && (
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label={t('dashboard.totalCattle')} value={data.livestock.cattle} icon={Beef} tone="primary" />
          <StatCard label={t('dashboard.totalGoats')} value={data.livestock.goat} icon={Beef} tone="accent" />
          <StatCard label={t('dashboard.totalSheep')} value={data.livestock.sheep} icon={Beef} tone="info" />
          <StatCard label={t('dashboard.newCustomers')} value={data.newCustomersMonth} icon={Users} tone="success" />
          <StatCard label={t('dashboard.revenue')} value={data.revenueMonth} icon={TrendingUp} format="currency" tone="success" />
          <StatCard label={t('dashboard.expenses')} value={data.expenseMonth} icon={TrendingDown} format="currency" tone="danger" />
          <StatCard label={t('dashboard.profit')} value={data.profitMonth} icon={Wallet} format="currency" tone="primary" />
          <StatCard label="Pending tasks" value={data.pendingTasks} icon={ListChecks} tone="info" />
        </div>
      )}

      {data && data.lowStockItems > 0 && (
        <Card className="mt-4 flex items-center gap-3 border-warning/30 bg-warning/5">
          <Boxes className="size-5 text-warning" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">{data.lowStockItems}</span> inventory item(s) are at or
            below their minimum stock level.
          </p>
        </Card>
      )}
    </div>
  );
}
