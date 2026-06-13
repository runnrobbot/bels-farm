import { useQuery } from '@tanstack/react-query';
import { marketingService } from './services/marketingService';
import type { CmsArticleRow, Species } from '@/types/database';

const FIVE_MIN = 5 * 60_000;

export function useCatalog(species?: Species | 'all') {
  return useQuery({
    queryKey: ['public', 'catalog', species ?? 'all'],
    queryFn: () => marketingService.catalog(species),
    staleTime: FIVE_MIN,
  });
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['public', 'listing', id],
    queryFn: () => marketingService.listing(id as string),
    enabled: Boolean(id),
    staleTime: FIVE_MIN,
  });
}

export function usePublicQurbanPlans() {
  return useQuery({
    queryKey: ['public', 'qurban-plans'],
    queryFn: () => marketingService.qurbanPlans(),
    staleTime: FIVE_MIN,
  });
}

export function useArticles(category?: CmsArticleRow['category']) {
  return useQuery({
    queryKey: ['public', 'articles', category ?? 'all'],
    queryFn: () => marketingService.articles(category),
    staleTime: FIVE_MIN,
  });
}

export function useArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['public', 'article', slug],
    queryFn: () => marketingService.article(slug as string),
    enabled: Boolean(slug),
    staleTime: FIVE_MIN,
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['public', 'testimonials'],
    queryFn: () => marketingService.testimonials(),
    staleTime: FIVE_MIN,
  });
}
