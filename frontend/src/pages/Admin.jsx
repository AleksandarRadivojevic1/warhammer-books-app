import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import client from '../api/client';
import Spinner from '../components/ui/Spinner';

function useFeaturedAdmin() {
  return useQuery({
    queryKey: ['featured'],
    queryFn: async () => {
      const { data } = await client.get('/api/featured');
      return data;
    },
  });
}

function useAddFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookSlug, order }) => client.post('/api/admin/featured', { bookSlug, order }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['featured'] }),
  });
}

function useRemoveFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.delete(`/api/admin/featured/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['featured'] }),
  });
}

function useReorderFeatured() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => client.put('/api/admin/featured/reorder', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['featured'] }),
  });
}

function SortableItem({ book, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.featuredId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="card px-4 py-3 flex items-center gap-4 touch-none"
    >
      {/* Drag handle — separate from remove so touch users can tap remove without dragging */}
      <button
        {...attributes}
        {...listeners}
        className="text-imperial-muted hover:text-imperial-gold cursor-grab active:cursor-grabbing p-1 -ml-1"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="flex-1 text-imperial-gold">
        {book.title ?? book.slug ?? book.bookSlug}
      </span>
      <button
        onClick={() => onRemove(book.featuredId)}
        className="text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0"
      >
        Remove
      </button>
    </li>
  );
}

export default function Admin() {
  const { data: featured = [], isLoading } = useFeaturedAdmin();
  const add = useAddFeatured();
  const remove = useRemoveFeatured();
  const reorder = useReorderFeatured();

  const [slug, setSlug] = useState('');
  const [addError, setAddError] = useState('');

  // Both pointer (mouse) and touch sensors so the list is draggable on mobile.
  // activationConstraint distance prevents accidental drags on tap.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      await add.mutateAsync({ bookSlug: slug.trim(), order: featured.length });
      setSlug('');
    } catch (err) {
      setAddError(err.response?.data?.error ?? 'Failed to add book');
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = featured.findIndex((b) => b.featuredId === active.id);
    const newIndex = featured.findIndex((b) => b.featuredId === over.id);
    const reordered = arrayMove(featured, oldIndex, newIndex);

    reorder.mutate(reordered.map((b) => b.featuredId));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl mb-2">Admin</h1>
      <p className="text-imperial-muted mb-10">Manage featured books shown on the homepage.</p>

      <section className="mb-10">
        <h2 className="text-xl mb-4">Add Featured Book</h2>
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            className="input flex-1"
            placeholder="Book slug (e.g. horus-rising)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <button className="btn-gold whitespace-nowrap" type="submit" disabled={add.isPending}>
            {add.isPending ? 'Adding...' : 'Add'}
          </button>
        </form>
        {addError && <p className="text-red-400 text-sm mt-2">{addError}</p>}
      </section>

      <section>
        <h2 className="text-xl mb-4">Current Featured Books</h2>
        {isLoading ? (
          <Spinner />
        ) : featured.length === 0 ? (
          <p className="text-imperial-muted">No featured books yet.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={featured.map((b) => b.featuredId)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {featured.map((book) => (
                  <SortableItem
                    key={book.featuredId}
                    book={book}
                    onRemove={(id) => remove.mutate(id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}
