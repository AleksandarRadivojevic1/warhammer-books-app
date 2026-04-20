import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useBooks(params = {}) {
  return useQuery({
    queryKey: ['books', params],
    queryFn: async () => {
      const { data } = await client.get('/api/books', { params });
      return data;
    },
  });
}

export function useBook(slug) {
  return useQuery({
    queryKey: ['book', slug],
    queryFn: async () => {
      const { data } = await client.get(`/api/books/${slug}`);
      return data;
    },
    enabled: !!slug,
  });
}

export function useRelatedBooks(slug) {
  return useQuery({
    queryKey: ['book', slug, 'related'],
    queryFn: async () => {
      const { data } = await client.get(`/api/books/${slug}/related`);
      return data;
    },
    enabled: !!slug,
  });
}
