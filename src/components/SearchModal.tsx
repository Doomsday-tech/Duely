import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../api/client';
import { Thing, DocumentRecord } from '../api/types';
import { StatusBadge } from './StatusBadge';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectThing: (thingId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectThing,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ things: Thing[]; documents: DocumentRecord[] }>({
    things: [],
    documents: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ things: [], documents: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ things: [], documents: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/25 backdrop-blur-[1px] text-sm">
      <div
        className="w-full max-w-xl bg-[#F7F6F3] border border-[#E2E0D9] rounded-[6px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E2E0D9] bg-white">
          <Search className="w-4 h-4 text-[#A8A29E] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, policy numbers, documents..."
            className="w-full bg-transparent text-sm text-[#1C1C1E] placeholder:text-[#A8A29E] focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#78716C] hover:text-[#1C1C1E]"
            >
              Clear
            </button>
          ) : (
            <span className="text-[11px] text-[#A8A29E]">ESC</span>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#E2E0D9] p-2 text-sm">
          {isSearching && (
            <div className="p-4 text-center text-xs text-[#78716C]">
              Searching your notebook...
            </div>
          )}

          {!isSearching && query.trim() && results.things.length === 0 && results.documents.length === 0 && (
            <div className="p-8 text-center text-xs text-[#78716C]">
              No entries found matching &ldquo;{query}&rdquo;
            </div>
          )}

          {!query.trim() && (
            <div className="p-6 text-center text-xs text-[#A8A29E]">
              Type a name, policy identifier, or year to search...
            </div>
          )}

          {/* Things */}
          {results.things.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium tracking-wide uppercase text-[#8C827A]">
                Tracked entries ({results.things.length})
              </div>
              {results.things.map((thing) => (
                <button
                  key={thing.id}
                  onClick={() => {
                    onSelectThing(thing.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-[5px] hover:bg-[#F0EFEB] flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-serif text-base text-[#1C1C1E] font-medium">
                      {thing.name}
                    </div>
                    {thing.category && (
                      <span className="text-xs text-[#78716C]">
                        {thing.category.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge
                      status={thing.calculated.status}
                      humanRemaining={thing.calculated.humanRemaining}
                      size="sm"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Documents */}
          {results.documents.length > 0 && (
            <div className="py-2">
              <div className="px-3 pb-1.5 text-[11px] font-medium tracking-wide uppercase text-[#8C827A]">
                Documents ({results.documents.length})
              </div>
              {results.documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => {
                    if (doc.thingId) {
                      onSelectThing(doc.thingId);
                      onClose();
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-[5px] hover:bg-[#F0EFEB] flex items-center justify-between group transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0 pr-3">
                    <div className="font-medium text-[#1C1C1E] truncate text-xs">
                      {doc.originalName}
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      {doc.documentType || 'Document'} {doc.identifier && `• ID: ${doc.identifier}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-[#E2E0D9] bg-[#EFECE6] flex justify-between text-xs text-[#78716C]">
          <span>Searches items, documents, and notes</span>
          <button onClick={onClose} className="hover:text-[#1C1C1E] underline cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
