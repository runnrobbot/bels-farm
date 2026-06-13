import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, Plus, Cake, Palette, MapPin, Dna, Printer, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ActivityTimeline } from '@/components/data/ActivityTimeline';
import { WeightChart } from '@/features/livestock/components/WeightChart';
import { AnimalForm } from '@/features/livestock/components/AnimalForm';
import { QrCode } from '@/components/ui/QrCode';
import { printAnimalLabel } from '@/features/livestock/printLabel';
import { useAnimal, useAnimalTimeline, useAnimalWeights } from '@/features/livestock/hooks/useAnimals';
import { useAddWeight, useUpdateAnimal, useDeleteAnimal } from '@/features/livestock/hooks/useAnimalMutations';
import type { AnimalFormValues } from '@/features/livestock/schema';
import { SPECIES_LABEL, SPECIES_TONE, STATUS_LABEL, STATUS_TONE } from '@/features/livestock/labels';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { useAuth } from '@/features/auth/AuthProvider';
import { paths } from '@/app/routes/paths';
import { emptyToNull } from '@/lib/utils';
import type { UpdateDto } from '@/types/database';
import { format } from 'date-fns';

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { can } = usePermission();
  const { profile } = useAuth();
  const { data: animal, isLoading } = useAnimal(id);
  const { data: weights = [] } = useAnimalWeights(id);
  const { data: timeline = [] } = useAnimalTimeline(id);
  const addWeight = useAddWeight();
  const updateAnimal = useUpdateAnimal();
  const deleteAnimal = useDeleteAnimal();

  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1"><SkeletonText lines={6} /></Card>
          <Card className="lg:col-span-2"><SkeletonText lines={8} /></Card>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <Card>
        <CardTitle>Animal not found</CardTitle>
        <Link to={paths.livestock} className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to livestock
        </Link>
      </Card>
    );
  }

  const submitWeight = () => {
    const value = Number(weightValue);
    if (!value || !id) return;
    addWeight.mutate(
      {
        animal_id: id,
        weight_kg: value,
        measured_at: new Date().toISOString().slice(0, 10),
        recorded_by: profile?.id ?? null,
      },
      {
        onSuccess: () => {
          setWeightOpen(false);
          setWeightValue('');
        },
      },
    );
  };

  const handleEdit = (values: AnimalFormValues) => {
    if (!id) return;
    const patch = emptyToNull({
      ...values,
      public_image_url: values.gallery_urls?.[0] ?? null,
    }) as UpdateDto<'animals'>;
    updateAnimal.mutate({ id, patch }, { onSuccess: () => setEditOpen(false) });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteAnimal.mutate(id, { onSuccess: () => navigate(paths.livestock) });
  };

  const details = [
    { icon: Dna, label: 'Breed', value: animal.breed?.name ?? '—' },
    { icon: Cake, label: 'Birth date', value: animal.birth_date ? format(new Date(animal.birth_date), 'd MMM yyyy') : '—' },
    { icon: Palette, label: 'Color', value: animal.color ?? '—' },
    { icon: Scale, label: 'Current weight', value: animal.current_weight_kg ? `${animal.current_weight_kg} kg` : '—' },
    { icon: MapPin, label: 'Sex', value: animal.sex },
  ];

  return (
    <div>
      <Link
        to={paths.livestock}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Livestock
      </Link>

      <PageHeader
        title={animal.name || 'Unnamed animal'}
        description={`Ear tag ${animal.ear_tag}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {can('livestock', 'update') && (
              <Button variant="outline" onClick={() => setWeightOpen(true)}>
                <Plus className="size-4" /> Record weight
              </Button>
            )}
            {can('livestock', 'update') && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
            {can('livestock', 'delete') && (
              <Button variant="ghost" onClick={() => setDeleteOpen(true)} aria-label="Arsipkan hewan">
                <Trash2 className="size-4 text-danger" />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={animal.name || animal.ear_tag} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge tone={SPECIES_TONE[animal.species]}>{SPECIES_LABEL[animal.species]}</Badge>
                  <Badge tone={STATUS_TONE[animal.status]} dot>
                    {STATUS_LABEL[animal.status]}
                  </Badge>
                </div>
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">{animal.ear_tag}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-3">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <d.icon className="size-4" /> {d.label}
                  </dt>
                  <dd className="font-medium capitalize text-foreground">{d.value}</dd>
                </div>
              ))}
            </dl>

            {animal.qr_code && (
              <div className="mt-5 flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-sunken p-4">
                <QrCode value={animal.qr_code} size={148} />
                <p className="text-center text-2xs text-muted-foreground">
                  Pindai untuk membuka profil ini
                </p>
                <Button variant="outline" size="sm" onClick={() => printAnimalLabel(animal.qr_code!, animal.ear_tag, animal.name)}>
                  <Printer className="size-4" /> Cetak label QR
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Analytics + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardTitle className="mb-2">Growth & weight history</CardTitle>
            <WeightChart records={weights} />
          </Card>

          <Card>
            <CardTitle className="mb-4">Activity timeline</CardTitle>
            <ActivityTimeline events={timeline} />
          </Card>
        </div>
      </div>

      <Modal
        open={weightOpen}
        onClose={() => setWeightOpen(false)}
        title="Record weight"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setWeightOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitWeight} loading={addWeight.isPending}>
              Save
            </Button>
          </>
        }
      >
        <label className="mb-1.5 block text-sm font-medium text-foreground">Weight (kg)</label>
        <Input
          type="number"
          step="0.1"
          min="0"
          autoFocus
          value={weightValue}
          onChange={(e) => setWeightValue(e.target.value)}
          placeholder="e.g. 312.5"
          icon={<Scale className="size-4" />}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          This updates the animal's current weight and adds an entry to its growth chart and timeline.
        </p>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit animal"
        description={`Perbarui data ${animal.ear_tag}.`}
        size="xl"
      >
        <AnimalForm
          submitting={updateAnimal.isPending}
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          defaultValues={{
            ear_tag: animal.ear_tag,
            name: animal.name ?? '',
            species: animal.species,
            sex: animal.sex,
            breed_id: animal.breed_id ?? null,
            color: animal.color ?? '',
            birth_date: animal.birth_date ?? '',
            acquisition: animal.acquisition,
            status: animal.status,
            current_weight_kg: animal.current_weight_kg ?? null,
            notes: animal.notes ?? '',
            is_listed: animal.is_listed ?? false,
            listing_title: animal.listing_title ?? '',
            listing_price: animal.listing_price ?? null,
            listing_description: animal.listing_description ?? '',
            gallery_urls: animal.gallery_urls ?? [],
          }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Arsipkan hewan ini?"
        description={`${animal.name || animal.ear_tag} akan diarsipkan (soft delete). Riwayat tetap tersimpan dan bisa dipulihkan kembali.`}
        confirmLabel="Arsipkan"
        loading={deleteAnimal.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </div>
  );
}
