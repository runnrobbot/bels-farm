import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Scale, Plus, Cake, Palette, MapPin, Dna, Printer } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { ActivityTimeline } from '@/components/data/ActivityTimeline';
import { WeightChart } from '@/features/livestock/components/WeightChart';
import { QrCode } from '@/components/ui/QrCode';
import { printAnimalLabel } from '@/features/livestock/printLabel';
import { useAnimal, useAnimalTimeline, useAnimalWeights } from '@/features/livestock/hooks/useAnimals';
import { useAddWeight } from '@/features/livestock/hooks/useAnimalMutations';
import { SPECIES_LABEL, SPECIES_TONE, STATUS_LABEL, STATUS_TONE } from '@/features/livestock/labels';
import { usePermission } from '@/features/auth/hooks/usePermission';
import { useAuth } from '@/features/auth/AuthProvider';
import { paths } from '@/app/routes/paths';
import { format } from 'date-fns';

export default function AnimalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { can } = usePermission();
  const { profile } = useAuth();
  const { data: animal, isLoading } = useAnimal(id);
  const { data: weights = [] } = useAnimalWeights(id);
  const { data: timeline = [] } = useAnimalTimeline(id);
  const addWeight = useAddWeight();

  const [weightOpen, setWeightOpen] = useState(false);
  const [weightValue, setWeightValue] = useState('');

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
          can('livestock', 'update') && (
            <Button variant="outline" onClick={() => setWeightOpen(true)}>
              <Plus className="size-4" /> Record weight
            </Button>
          )
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
    </div>
  );
}
