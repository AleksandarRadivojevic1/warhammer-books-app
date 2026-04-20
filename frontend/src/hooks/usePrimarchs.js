import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function usePrimarchs(params = {}) {
  return useQuery({
    queryKey: ['primarchs', params],
    queryFn: async () => {
      const { data } = await client.get('/api/primarchs', { params });
      return data;
    },
  });
}

export function usePrimarch(slug) {
  return useQuery({
    queryKey: ['primarch', slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/primarchs/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}
