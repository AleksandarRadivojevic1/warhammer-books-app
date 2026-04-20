import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export function useFeatured() {
  return useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const { data } = await client.get('/api/featured');
      return data;
    },
  });
}
