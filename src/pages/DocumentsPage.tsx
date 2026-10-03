import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DocumentRecord } from '../api/types';
import { Search, Plus } from 'lucide-react';

interface DocumentsPageProps {
  onSelectThing: (thingId: string) => void;
  onOpenUpload: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  onSelectThing,
  onOpenUpload,
}) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Remove document "${name}" from your vault?`)) return;
    try {
      await api.deleteDocument(id);
      await loadDocuments();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filtered = documents.filter((doc) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      doc.originalName.toLowerCase().includes(q) ||
      doc.documentType?.toLowerCase().includes(q) ||
      doc.identifier?.toLowerCase().includes(q) ||
      doc.thing?.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E0D9] pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] font-normal">
            Document vault
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            Invoices, policy documents, and certificates supporting your tracked items.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] text-xs font-medium py-2 px-3.5 rounded-[5px] flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#E2E0D9]" />
          <span>Upload document</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="border border-[#E2E0D9] rounded-[5px] max-w-md flex items-center px-3 py-1.5 bg-white text-xs">
        <Search className="w-3.5 h-3.5 text-[#A8A29E] mr-2 shrink-0" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filter documents by name or identifier..."
          className="w-full bg-transparent text-[#2C2C2C] placeholder:text-[#A8A29E] focus:outline-none"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-sm text-[#78716C]">
          Loading documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border-t border-[#E2E0D9] text-sm text-[#78716C]">
          No documents found.
        </div>
      ) : (
        <div className="border-t border-[#E2E0D9] divide-y divide-[#E2E0D9] text-sm">
          {filtered.map((doc) => {
            const uploadDate = new Date(doc.createdAt).toLocaleDateString(undefined, {
              dateStyle: 'medium',
            });

            return (
              <div
                key={doc.id}
                className="py-3.5 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0 pr-4">
                  <div className="font-medium text-[#1C1C1E] truncate">
                    {doc.originalName}
                  </div>
                  <div className="text-xs text-[#78716C] flex flex-wrap items-center gap-2">
                    {doc.thing && (
                      <button
                        onClick={() => onSelectThing(doc.thing!.id)}
                        className="text-[#2C2C2C] hover:underline"
                      >
                        Item: {doc.thing.name}
                      </button>
                    )}
                    <span>&bull;</span>
                    <span>{doc.documentType || 'Document'}</span>
                    {doc.identifier && <span>&bull; ID: {doc.identifier}</span>}
                    <span>&bull;</span>
                    <span>{(doc.size / 1024).toFixed(0)} KB</span>
                    <span>&bull;</span>
                    <span>Added {uploadDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                  <a
                    href={api.getDocumentDownloadUrl(doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-2.5 py-1 text-xs rounded-[5px] transition-colors"
                  >
                    View file
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id, doc.originalName)}
                    className="text-xs text-[#8C827A] hover:text-[#A8382B] px-1 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
