import { useMutation, useQueryClient } from '@tanstack/react-query';
import { livestockService } from '../services/livestockService';
import { queryKeys } from '@/lib/query/queryKeys';
import { toast } from '@/stores/toastStore';
import type { InsertDto, UpdateDto } from '@/types/database';

export function useCreateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InsertDto<'animals'>) => livestockService.create(input),
    onSuccess: (animal) => {
      void qc.invalidateQueries({ queryKey: queryKeys.animals.lists() });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Animal registered', `${animal.ear_tag} added to the herd.`);
    },
    onError: (error) => toast.fromError(error, 'Could not register animal'),
  });
}

export function useUpdateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateDto<'animals'> }) =>
      livestockService.update(id, patch),
    onSuccess: (animal) => {
      void qc.invalidateQueries({ queryKey: queryKeys.animals.detail(animal.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.animals.lists() });
      toast.success('Changes saved');
    },
    onError: (error) => toast.fromError(error, 'Could not save changes'),
  });
}

export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => livestockService.softDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.animals.lists() });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Animal archived', 'The record was soft-deleted and can be restored.');
    },
    onError: (error) => toast.fromError(error, 'Could not archive animal'),
  });
}

export function useAddWeight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InsertDto<'weight_records'>) => livestockService.addWeight(input),
    onSuccess: (record) => {
      void qc.invalidateQueries({ queryKey: queryKeys.animals.weights(record.animal_id) });
      void qc.invalidateQueries({ queryKey: queryKeys.animals.timeline(record.animal_id) });
      void qc.invalidateQueries({ queryKey: queryKeys.animals.detail(record.animal_id) });
      toast.success('Weight recorded');
    },
    onError: (error) => toast.fromError(error, 'Could not record weight'),
  });
}
