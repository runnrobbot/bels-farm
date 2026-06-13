import { supabase } from '@/lib/supabase/client';
import { toAppError } from '@/lib/errors';
import type {
  CatalogAnimalRow,
  PublicQurbanPlanRow,
  CmsArticleRow,
  TestimonialRow,
  Species,
} from '@/types/database';

/**
 * Read-only data access for the public marketing site. Every query targets a
 * world-readable view or an RLS policy that permits anonymous reads, so these
 * work without authentication.
 */
export const marketingService = {
  async catalog(species?: Species | 'all'): Promise<CatalogAnimalRow[]> {
    let query = supabase
      .from('catalog_animals')
      .select('*')
      .order('created_at', { ascending: false });
    if (species && species !== 'all') query = query.eq('species', species);
    const { data, error } = await query;
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async listing(id: string): Promise<CatalogAnimalRow | null> {
    const { data, error } = await supabase
      .from('catalog_animals')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },

  async qurbanPlans(): Promise<PublicQurbanPlanRow[]> {
    const { data, error } = await supabase
      .from('public_qurban_plans')
      .select('*')
      .order('target_amount', { ascending: true });
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async articles(category?: CmsArticleRow['category']): Promise<CmsArticleRow[]> {
    let query = supabase
      .from('cms_articles')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('published_at', { ascending: false, nullsFirst: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw toAppError(error);
    return data ?? [];
  },

  async article(slug: string): Promise<CmsArticleRow | null> {
    const { data, error } = await supabase
      .from('cms_articles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },

  async testimonials(): Promise<TestimonialRow[]> {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw toAppError(error);
    return data ?? [];
  },
};
