import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import { startOfMonth } from 'date-fns';
import type { Species } from '@/types/database';

export interface DashboardStats {
  livestock: Record<Species, number>;
  livestockTotal: number;
  revenueMonth: number;
  expenseMonth: number;
  profitMonth: number;
  newCustomersMonth: number;
  pendingTasks: number;
  lowStockItems: number;
}

async function countAnimals(species: Species, branchId: string | null): Promise<number> {
  let query = supabase
    .from('animals')
    .select('id', { count: 'exact', head: true })
    .eq('species', species)
    .eq('status', 'active')
    .is('deleted_at', null);
  if (branchId) query = query.eq('branch_id', branchId);
  const { count, error } = await query;
  if (error) throw toAppError(error);
  return count ?? 0;
}

async function sumFinance(kind: 'income' | 'expense', since: string): Promise<number> {
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('amount')
    .eq('kind', kind)
    .gte('occurred_at', since)
    .is('deleted_at', null);
  if (error) throw toAppError(error);
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
}

async function countLowStock(branchId: string | null): Promise<number> {
  let query = supabase
    .from('inventory_items')
    .select('quantity, min_quantity')
    .is('deleted_at', null);
  if (branchId) query = query.eq('branch_id', branchId);
  const { data, error } = await query;
  if (error) throw toAppError(error);
  return (data ?? []).filter((i) => Number(i.quantity) <= Number(i.min_quantity)).length;
}

export const dashboardService = {
  async getStats(branchId: string | null): Promise<DashboardStats> {
    const monthStart = startOfMonth(new Date()).toISOString().slice(0, 10);

    const [cattle, goat, sheep, revenue, expense, customers, tasks, lowStock] = await Promise.all([
      countAnimals('cattle', branchId),
      countAnimals('goat', branchId),
      countAnimals('sheep', branchId),
      sumFinance('income', monthStart),
      sumFinance('expense', monthStart),
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart)
        .is('deleted_at', null),
      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .in('status', ['todo', 'in_progress'])
        .is('deleted_at', null),
      countLowStock(branchId),
    ]);

    if (customers.error) throw toAppError(customers.error);
    if (tasks.error) throw toAppError(tasks.error);

    const livestock = { cattle, goat, sheep } as Record<Species, number>;

    return {
      livestock,
      livestockTotal: cattle + goat + sheep,
      revenueMonth: revenue,
      expenseMonth: expense,
      profitMonth: revenue - expense,
      newCustomersMonth: customers.count ?? 0,
      pendingTasks: tasks.count ?? 0,
      lowStockItems: lowStock,
    };
  },
};
