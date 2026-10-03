import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Thing, Category } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Search } from 'lucide-react';

interface ThingsPageProps {
  onSelectThing: (thingId: string) => void;
  onOpenAdd: () => void;
  onOpenRenew: (thing: Thing) => void;
}

export const ThingsPage: React.FC<ThingsPageProps> = ({
  onSelectThing,
  onOpenAdd,
  onOpenRenew,
}) => {
  const [things, setThings] = useState<Thing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'expiryAsc' | 'name'>('urgency');

  const loadData = async () => {
    try {
      setLoading(true);
      const [thingsData, catData] = await Promise.all([
        api.getThings({
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          search: searchQuery.trim() || undefined,
          sort: sortBy,
        }),
        api.getCategories(),
      ]);
      setThings(thingsData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load things:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedCategory, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const statusFilters = [
    { id: 'ALL', label: 'All items' },
    { id: 'ATTENTION', label: 'Attention' },
    { id: 'ACTIVE', label: 'Upcoming' },
    { id: 'OVERDUE', label: 'Overdue' },
    { id: 'RENEWED', label: 'Renewed' },
  ];

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-4xl space-y-8">
      {/* Header */}
      <div className="border-b border-[#E2E0D9] pb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] font-normal">
            All tracked things
          </h1>
          <p className="text-sm text-[#78716C] mt-1">
            A complete register of documents, policies, and upcoming expirations.
          </p>
        </div>

        <button
          onClick={onOpenAdd}
          className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] text-xs font-medium py-2 px-3.5 rounded-[5px] flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#E2E0D9]" />
          <span>New entry</span>
        </button>
      </div>

      {/* Control Bar: Filters, Search, Sort */}
      <div className="space-y-4 text-xs">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {statusFilters.map((f) => {
            const active = selectedStatus === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedStatus(f.id)}
                className={`px-3 py-1.5 rounded-[5px] transition-colors ${
                  active
                    ? 'bg-[#E5E1D8] text-[#1C1C1E] font-medium'
                    : 'text-[#78716C] hover:text-[#1C1C1E] hover:bg-[#F0EFEB]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Search, Category, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-[#E2E0D9] rounded-[5px] flex items-center px-3 py-1.5 bg-white text-xs">
            <Search className="w-3.5 h-3.5 text-[#A8A29E] mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or note..."
              className="w-full bg-transparent text-[#2C2C2C] placeholder:text-[#A8A29E] focus:outline-none"
            />
          </div>

          <div className="border border-[#E2E0D9] rounded-[5px] px-3 py-1.5 bg-white">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-transparent text-xs text-[#2C2C2C] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border border-[#E2E0D9] rounded-[5px] px-3 py-1.5 bg-white">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs text-[#2C2C2C] focus:outline-none cursor-pointer"
            >
              <option value="urgency">Sort by urgency</option>
              <option value="expiryAsc">Sort by date (earliest first)</option>
              <option value="name">Sort alphabetically</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dense List with Faint Lines */}
      {loading ? (
        <div className="py-12 text-sm text-[#78716C]">
          Loading records...
        </div>
      ) : things.length === 0 ? (
        <div className="py-16 text-center border-t border-[#E2E0D9] text-sm text-[#78716C]">
          No entries found matching your criteria.
        </div>
      ) : (
        <div className="border-t border-[#E2E0D9] divide-y divide-[#E2E0D9]">
          {things.map((thing) => {
            const effectiveDate = thing.expiryDate
              ? new Date(thing.expiryDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <div
                key={thing.id}
                onClick={() => onSelectThing(thing.id)}
                className="py-3.5 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="space-y-0.5 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base text-[#1C1C1E] font-medium">
                      {thing.name}
                    </span>
                    {thing.category && (
                      <span className="text-xs text-[#78716C]">
                        &bull; {thing.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#78716C]">
                    <StatusBadge
                      status={thing.calculated.status}
                      humanRemaining={thing.calculated.humanRemaining}
                      size="sm"
                    />
                    {effectiveDate && <span>Due {effectiveDate}</span>}
                    {thing._count?.documents ? (
                      <span>{thing._count.documents} {thing._count.documents === 1 ? 'doc' : 'docs'}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRenew(thing);
                    }}
                    className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-3 py-1 text-xs rounded-[5px] transition-colors"
                  >
                    Renew
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
