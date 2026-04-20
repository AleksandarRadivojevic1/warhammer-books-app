import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useSeriesList(params = {}) {
  return useQuery({
    queryKey: ['series', params],
    queryFn: async () => {
      const { data } = await client.get('/api/series', { params });
      return data;
    },
  });
}

export function useSeries(slug) {
  return useQuery({
    queryKey: ['series', slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/series/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}
