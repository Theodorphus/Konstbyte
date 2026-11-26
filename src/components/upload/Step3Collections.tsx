'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCollection, getUserCollections } from '@/app/actions/collection-actions';
import { AlertCircle, Loader2 } from 'lucide-react';

interface Collection {
  id: string;
  title: string;
  description: string | null;
  _count: { items: number };
}

interface Step3CollectionsProps {
  onBack: () => void;
  onSubmit: (collectionId: string | null) => void;
  isSubmitting: boolean;
}

type Mode = 'choose' | 'create';

export function Step3Collections({
  onBack,
  onSubmit,
  isSubmitting,
}: Step3CollectionsProps) {
  const t = useTranslations('upload');
  const [mode, setMode] = useState<'skip' | Mode>('choose');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const result = await getUserCollections();
        setCollections(result);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(t('collections_load_error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Creates the collection and returns its id (null if it could not be created).
  const handleCreateCollection = async (): Promise<string | null> => {
    if (!newCollectionTitle.trim()) {
      setError(t('collection_name_required'));
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const newCollection = await createCollection({
        title: newCollectionTitle,
        description: newCollectionDesc || undefined,
      });

      // Add _count property to match Collection interface
      const collectionWithCount: Collection = {
        ...newCollection,
        _count: { items: 0 },
      };

      setCollections([collectionWithCount, ...collections]);
      setSelectedId(newCollection.id);
      setMode('choose');
      setNewCollectionTitle('');
      setNewCollectionDesc('');
      return newCollection.id;
    } catch (err) {
      console.error('Error creating collection:', err);
      setError(t('collection_create_error'));
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'skip') {
      onSubmit(null);
    } else if (mode === 'create') {
      const id = await handleCreateCollection();
      if (id) onSubmit(id);
    } else {
      onSubmit(selectedId || null);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">{t('step3_title')}</h2>
        <p className="text-slate-600">
          {t('step3_desc')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">{t('collections_loading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Skip option */}
          <label className="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="radio"
              name="mode"
              value="skip"
              checked={mode === 'skip'}
              onChange={() => setMode('skip')}
              className="w-4 h-4 accent-amber-400"
            />
            <span className="ml-3 font-medium text-slate-900">
              {t('skip_collection')}
            </span>
          </label>

          {/* Choose existing */}
          <div>
            <label className="flex items-center p-4 border-2 border-slate-200 rounded-t-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="mode"
                value="choose"
                checked={mode === 'choose'}
                onChange={() => setMode('choose')}
                className="w-4 h-4 accent-amber-400"
              />
              <span className="ml-3 font-medium text-slate-900">
                {t('choose_collection', { count: collections.length })}
              </span>
            </label>

            {mode === 'choose' && collections.length > 0 && (
              <div className="border-2 border-t-0 border-slate-200 rounded-b-xl p-4 space-y-2 bg-slate-50/50">
                {collections.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center p-2 rounded hover:bg-white transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="collection"
                      value={col.id}
                      checked={selectedId === col.id}
                      onChange={() => setSelectedId(col.id)}
                      className="w-4 h-4 accent-amber-400"
                    />
                    <span className="ml-3 font-medium text-slate-900">{col.title}</span>
                    <span className="ml-auto text-xs text-slate-500">
                      {t('collection_items', { count: col._count.items })}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {mode === 'choose' && collections.length === 0 && (
              <div className="border-2 border-t-0 border-slate-200 rounded-b-xl p-4 bg-slate-50/50 text-center text-sm text-slate-500">
                {t('no_collections')}
              </div>
            )}
          </div>

          {/* Create new */}
          <div>
            <label className="flex items-center p-4 border-2 border-slate-200 rounded-t-xl cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="mode"
                value="create"
                checked={mode === 'create'}
                onChange={() => setMode('create')}
                className="w-4 h-4 accent-amber-400"
              />
              <span className="ml-3 font-medium text-slate-900">{t('create_collection')}</span>
            </label>

            {mode === 'create' && (
              <div className="border-2 border-t-0 border-slate-200 rounded-b-xl p-4 space-y-3 bg-slate-50/50">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('collection_name')}
                  </label>
                  <Input
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    placeholder={t('collection_name_placeholder')}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t('collection_desc')}
                  </label>
                  <textarea
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    placeholder={t('collection_desc_placeholder')}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          variant="outline"
          className="border-slate-200"
        >
          {t('back')}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isCreating || isLoading}
          className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('publishing')}
            </>
          ) : (
            t('publish')
          )}
        </Button>
      </div>
    </form>
  );
}
