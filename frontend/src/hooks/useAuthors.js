import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useAuthors(params = {}) {
  return useQuery({
    queryKey: ['authors', params],
    queryFn: async () => {
      const { data } = await client.get('/api/authors', { params });
      return data;
    },
  });
}

export function useAuthor(slug) {
  return useQuery({
    queryKey: ['author', slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/authors/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}
