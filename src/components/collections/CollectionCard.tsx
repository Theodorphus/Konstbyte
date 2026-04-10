import Image from 'next/image';
import Link from 'next/link';

interface CollectionCardProps {
  collection: {
    id: string;
    title: string;
    coverImage: string | null;
    _count: { items: number };
    items?: { artwork: { imageUrl: string; id: string } }[];
  };
}

export function CollectionCard({ collection }: CollectionCardProps) {
  // Use cover image or first artwork image
  const coverImage =
    collection.coverImage ||
    collection.items?.[0]?.artwork.imageUrl;

  return (
    <Link href={`/collections/${collection.id}`}>
      <div className="group rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200/70 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200">
        {/* Cover image */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={collection.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
              <span className="text-slate-400 text-sm">Ingen bild</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 truncate line-clamp-2">
            {collection.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {collection._count.items === 1
              ? '1 verk'
              : `${collection._count.items} verk`}
          </p>
        </div>
      </div>
    </Link>
  );
}
