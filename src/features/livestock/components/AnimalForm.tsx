import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { animalSchema, type AnimalFormValues, SPECIES, SEXES, STATUSES, ACQUISITIONS } from '../schema';
import { useBreeds } from '../hooks/useBreeds';
import { SPECIES_LABEL, STATUS_LABEL } from '../labels';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { MultiImageUpload } from '@/components/ui/MultiImageUpload';

interface AnimalFormProps {
  defaultValues?: Partial<AnimalFormValues>;
  submitting?: boolean;
  onSubmit: (values: AnimalFormValues) => void;
  onCancel: () => void;
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function AnimalForm({ defaultValues, submitting, onSubmit, onCancel }: AnimalFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnimalFormValues>({
    resolver: zodResolver(animalSchema),
    defaultValues: { species: 'cattle', sex: 'unknown', status: 'active', acquisition: 'born_on_farm', gallery_urls: [], ...defaultValues },
  });

  const species = watch('species');
  const gallery = watch('gallery_urls') ?? [];
  const { data: breeds = [] } = useBreeds(species);

  return (
    <form id="animal-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Ear tag *" error={errors.ear_tag?.message}>
          <Input placeholder="e.g. ID-0421" invalid={!!errors.ear_tag} {...register('ear_tag')} />
        </Field>
        <Field label="Name" error={errors.name?.message}>
          <Input placeholder="Optional name" {...register('name')} />
        </Field>

        <Field label="Species *" error={errors.species?.message}>
          <Select
            options={SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s] }))}
            {...register('species')}
          />
        </Field>
        <Field label="Breed" error={errors.breed_id?.message}>
          <Select
            placeholder="Select breed"
            options={breeds.map((b) => ({ value: b.id, label: b.name }))}
            {...register('breed_id')}
          />
        </Field>

        <Field label="Sex">
          <Select
            options={SEXES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
            {...register('sex')}
          />
        </Field>
        <Field label="Status">
          <Select
            options={STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            {...register('status')}
          />
        </Field>

        <Field label="Birth date" error={errors.birth_date?.message}>
          <Input type="date" {...register('birth_date')} />
        </Field>
        <Field label="Color" error={errors.color?.message}>
          <Input placeholder="e.g. Brown" {...register('color')} />
        </Field>

        <Field label="Acquisition">
          <Select
            options={ACQUISITIONS.map((a) => ({
              value: a,
              label: a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            }))}
            {...register('acquisition')}
          />
        </Field>
        <Field label="Current weight (kg)" error={errors.current_weight_kg?.message}>
          <Input type="number" step="0.1" min="0" placeholder="0.0" {...register('current_weight_kg')} />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes?.message}>
        <textarea
          rows={3}
          placeholder="Any additional details…"
          className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('notes')}
        />
      </Field>

      {/* Public catalog listing */}
      <div className="rounded-lg border border-border bg-surface-sunken p-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="size-4 rounded border-input accent-primary"
            {...register('is_listed')}
          />
          <span>
            <span className="text-sm font-medium text-foreground">Tampilkan di katalog publik</span>
            <span className="block text-xs text-muted-foreground">
              Hewan ini akan muncul di website penjualan.
            </span>
          </span>
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Judul listing" error={errors.listing_title?.message}>
            <Input placeholder="mis. Sapi Limousin Premium" {...register('listing_title')} />
          </Field>
          <Field label="Harga jual (Rp)" error={errors.listing_price?.message}>
            <Input type="number" step="1000" min="0" placeholder="0" {...register('listing_price')} />
          </Field>
          <Field label="Foto ternak (maks 5)" error={errors.gallery_urls?.message} className="sm:col-span-2">
            <MultiImageUpload
              value={gallery}
              onChange={(urls) => setValue('gallery_urls', urls, { shouldDirty: true })}
              folder="animals"
              max={5}
            />
          </Field>
          <Field label="Deskripsi listing" error={errors.listing_description?.message} className="sm:col-span-2">
            <textarea
              rows={3}
              placeholder="Deskripsi untuk calon pembeli…"
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('listing_description')}
            />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save animal
        </Button>
      </div>
    </form>
  );
}
