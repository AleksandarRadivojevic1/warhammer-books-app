import BookCard from './BookCard';

function RelatedGroup({ title, books }) {
  if (!books?.length) return null;

  return (
    <div className="mb-8">
      <p className="label mb-4">{title}</p>
      <div className="flex gap-4">
        {books.slice(0, 6).map((book) => (
          <div key={book.slug} className="w-30">
            <BookCard book={book} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RelatedBooks({ data }) {
  if (!data?.sameSeries?.length && !data?.relatedByPrimarch?.length) return null;

  return (
    <section className="mt-12 pt-8 border-t border-imperial-border">
      <RelatedGroup title="More from this series" books={data.sameSeries} />
      <RelatedGroup title="Related by primarch" books={data.relatedByPrimarch} />
    </section>
  );
}
