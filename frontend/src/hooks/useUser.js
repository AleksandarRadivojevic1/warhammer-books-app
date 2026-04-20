import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await client.get('/api/user/favorites');
      return data;
    },
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookSlug) => client.post('/api/user/favorites', { bookSlug }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => client.delete(`/api/user/favorites/${slug}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useReadingList() {
  return useQuery({
    queryKey: ['reading-list'],
    queryFn: async () => {
      const { data } = await client.get('/api/user/reading-list');
      return data;
    },
  });
}

export function useUpdateReadingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, status }) => client.patch(`/api/user/reading-list/${slug}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reading-list'] }),
  });
}

export function useRemoveFromReadingList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug) => client.delete(`/api/user/reading-list/${slug}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reading-list'] }),
  });
}
