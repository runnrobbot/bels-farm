import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { DefaultValues, FieldValues, Path, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'date' | 'textarea' | 'select';
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  step?: string;
  /** Column span within the 2-column grid (defaults to 1). */
  full?: boolean;
}

interface CrudFormModalProps<TValues extends FieldValues> {
  open: boolean;
  title: string;
  description?: string;
  fields: FieldDef[];
  schema: ZodType<TValues>;
  defaultValues: DefaultValues<TValues>;
  submitting?: boolean;
  size?: 'md' | 'lg' | 'xl';
  onSubmit: (values: TValues) => void;
  onClose: () => void;
}

/**
 * Declarative create/edit form rendered from a field schema. Powers most admin
 * modules so they only describe their fields + Zod schema, not boilerplate JSX.
 */
export function CrudFormModal<TValues extends FieldValues>({
  open,
  title,
  description,
  fields,
  schema,
  defaultValues,
  submitting,
  size = 'lg',
  onSubmit,
  onClose,
}: CrudFormModalProps<TValues>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TValues>({ resolver: zodResolver(schema) as Resolver<TValues> });

  useEffect(() => {
    if (open) reset(defaultValues);
    // defaultValues is rebuilt by the parent per open; intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button form="crud-form" type="submit" loading={submitting}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="crud-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const error = (errors[f.name as Path<TValues>]?.message as string) ?? undefined;
          const name = f.name as Path<TValues>;
          return (
            <Field
              key={f.name}
              label={f.label}
              required={f.required}
              error={error}
              hint={f.hint}
              className={cn((f.full || f.type === 'textarea') && 'sm:col-span-2')}
            >
              {f.type === 'textarea' ? (
                <Textarea placeholder={f.placeholder} invalid={!!error} {...register(name)} />
              ) : f.type === 'select' ? (
                <Select
                  placeholder={f.placeholder}
                  invalid={!!error}
                  options={f.options ?? []}
                  {...register(name)}
                />
              ) : (
                <Input
                  type={f.type}
                  step={f.step}
                  placeholder={f.placeholder}
                  invalid={!!error}
                  {...register(name)}
                />
              )}
            </Field>
          );
        })}
      </form>
    </Modal>
  );
}
