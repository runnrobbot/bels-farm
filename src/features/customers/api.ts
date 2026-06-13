import { z } from 'zod';
import { createResource } from '@/lib/crud/resource';
import { createResourceHooks } from '@/lib/crud/useResource';

export const customersResource = createResource('customers', {
  searchColumns: ['full_name', 'whatsapp', 'phone', 'email', 'city'],
  orderBy: 'created_at',
});

export const customersHooks = createResourceHooks(customersResource, { label: 'Pelanggan' });

export const customerSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter'),
  whatsapp: z.string().max(20).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(80).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
