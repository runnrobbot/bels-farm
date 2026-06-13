import { create } from 'zustand';
import { toAppError } from '@/lib/errors';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    const duration = toast.duration ?? (toast.tone === 'error' ? 6000 : 4000);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id, duration }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helpers usable outside React (services, mutation callbacks). */
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'success', title, description }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'error', title, description }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'info', title, description }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ tone: 'warning', title, description }),
  /** Convert any thrown error into a friendly error toast. */
  fromError: (error: unknown, fallbackTitle = 'Something went wrong') => {
    const appError = toAppError(error);
    return useToastStore.getState().push({
      tone: 'error',
      title: fallbackTitle,
      description: appError.message,
    });
  },
};
