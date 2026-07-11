import { supabase } from '@/lib/supabase/client';
import { toAppError, unwrap } from '@/lib/errors';
import { EMPTY_ACCESS, type AccessContext } from '@/features/auth/types';
import type { ProfileRow } from '@/types/database';

interface RawAccess {
  is_super_admin: boolean;
  branch_ids: string[];
  roles: string[];
  permissions: string[];
}

export const authService = {
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw toAppError(error);
    return data;
  },

  async signUp(email: string, password: string, fullName: string, whatsapp?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, whatsapp: whatsapp ?? '' },
        // After clicking the confirmation link, return the user to the portal.
        emailRedirectTo: `${window.location.origin}/portal/qurban`,
      },
    });
    if (error) throw toAppError(error);
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw toAppError(error);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) throw toAppError(error);
  },

  async getProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },

  /** Resolve the caller's effective access via the SECURITY DEFINER RPC. */
  async getAccess(): Promise<AccessContext> {
    const { data, error } = await supabase.rpc('my_access');
    if (error) throw toAppError(error);
    const raw = data as unknown as RawAccess | null;
    if (!raw) return EMPTY_ACCESS;
    return {
      isSuperAdmin: Boolean(raw.is_super_admin),
      branchIds: raw.branch_ids ?? [],
      roles: raw.roles ?? [],
      permissions: new Set(raw.permissions ?? []),
    };
  },

  async updateOwnProfile(userId: string, patch: Partial<ProfileRow>) {
    return unwrap(
      await supabase.from('profiles').update(patch).eq('id', userId).select('*').single(),
    );
  },
};
