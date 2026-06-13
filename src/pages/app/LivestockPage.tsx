import { useMemo, useState } from 'react';
import { Plus, Search, Beef, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimalTable } from '@/features/livestock/components/AnimalTable';
import { AnimalForm } from '@/features/livestock/components/AnimalForm';
import { useAnimals } from '@/features/livestock/hooks/useAnimals';
import { useCreateAnimal } from '@/features/livestock/hooks/useAnimalMutations';
import { DEFAULT_FILTERS, SPECIES, STATUSES, type AnimalFilters, type AnimalFormValues } from '@/features/livestock/schema';
import { SPECIES_LABEL, STATUS_LABEL } from '@/features/livestock/labels';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBranches } from '@/hooks/useBranches';
import { useUiStore } from '@/stores/uiStore';
import { emptyToNull } from '@/lib/utils';
import type { InsertDto } from '@/types/database';

export default function LivestockPage() {
  const { can } = usePermission();
  const { profile } = useAuth();
  const { data: branches = [] } = useBranches();
  const activeBranchId = useUiStore((s) => s.activeBranchId);

  const [filters, setFilters] = useState<AnimalFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [createOpen, setCreateOpen] = useState(false);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch, page: debouncedSearch !== filters.search ? 0 : filters.page }),
    [filters, debouncedSearch],
  );

  const { data, isLoading, isPlaceholderData } = useAnimals(effectiveFilters);
  const createAnimal = useCreateAnimal();

  const totalPages = data ? Math.ceil(data.total / filters.pageSize) : 0;
  const branchId = activeBranchId ?? branches[0]?.id ?? null;

  const handleCreate = (values: AnimalFormValues) => {
    if (!profile?.organization_id || !branchId) return;
    const payload = emptyToNull({
      ...values,
      public_image_url: values.gallery_urls?.[0] ?? null,
      organization_id: profile.organization_id,
      branch_id: branchId,
      created_by: profile.id,
    }) as InsertDto<'animals'>;

    createAnimal.mutate(payload, { onSuccess: () => setCreateOpen(false) });
  };

  return (
    <div>
      <PageHeader
        title="Livestock"
        description="Every animal in your herd — searchable, filterable and fully traceable."
        actions={
          can('livestock', 'create') && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> Add animal
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            icon={<Search className="size-4" />}
            placeholder="Search by ear tag, name or barcode…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            className="w-36"
            value={filters.species}
            onChange={(e) =>
              setFilters((f) => ({ ...f, species: e.target.value as AnimalFilters['species'], page: 0 }))
            }
            options={[
              { value: 'all', label: 'All species' },
              ...SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s] })),
            ]}
          />
          <Select
            className="w-36"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value as AnimalFilters['status'], page: 0 }))
            }
            options={[
              { value: 'all', label: 'All statuses' },
              ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="panel space-y-3 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState
          icon={Beef}
          title="No animals yet"
          description="Register your first animal to start tracking its health, weight and history."
          action={
            can('livestock', 'create') && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" /> Add animal
              </Button>
            )
          }
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <AnimalTable rows={data.rows} />

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.total.toLocaleString()} animal{data.total === 1 ? '' : 's'}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 0}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  <ChevronLeft className="size-4" /> Prev
                </Button>
                <span className="tabular-nums">
                  {filters.page + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages - 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register animal"
        description="Add a new animal to your herd."
        size="xl"
      >
        <AnimalForm
          submitting={createAnimal.isPending}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
