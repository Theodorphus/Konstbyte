import { CollectionCard } from './CollectionCard';

interface CollectionStripProps {
  collections: {
    id: string;
    title: string;
    coverImage: string | null;
    _count: { items: number };
    items?: { artwork: { imageUrl: string; id: string } }[];
  }[];
  title?: string;
}

export function CollectionStrip({
  collections,
  title = 'Utforska samlingar',
}: CollectionStripProps) {
  if (!collections || collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-4 pb-2">
          {collections.map((collection) => (
            <div key={collection.id} className="flex-shrink-0 w-full sm:w-80">
              <CollectionCard collection={collection} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
