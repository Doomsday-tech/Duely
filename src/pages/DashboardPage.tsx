import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { DashboardSummary, Thing } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { Check, Plus, RefreshCw, ArrowRight } from 'lucide-react';

interface DashboardPageProps {
  onSelectThing: (thingId: string) => void;
  onOpenAdd: () => void;
  onOpenRenew: (thing: Thing) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectThing,
  onOpenAdd,
  onOpenRenew,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
      setError(err?.message || 'Could not load your overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleToggleAction = async (actionId: string, currentCompleted: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateAction(actionId, { completed: !currentCompleted });
      await loadSummary();
    } catch (err) {
      console.error('Could not toggle action:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-12 text-sm text-[#78716C]">
        Loading your notes and deadlines...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 sm:p-12 space-y-4">
        <div className="border border-[#E2E0D9] bg-white p-4 rounded-[5px] text-sm text-[#A8382B]">
          {error}
        </div>
        <button
          onClick={loadSummary}
          className="bg-[#2C2C2C] text-[#F7F6F3] px-4 py-2 text-xs font-medium rounded-[5px]"
        >
          Try again
        </button>
      </div>
    );
  }

  const attentionItems = summary?.attention || [];
  const upcomingItems = summary?.upcoming || [];
  const recentlyUpdated = summary?.recentlyUpdated || [];
  const totalThings = summary?.totalCount || 0;

  if (totalThings === 0) {
    return (
      <div className="p-8 sm:p-16 max-w-xl space-y-6">
        <div className="text-xs uppercase tracking-wide text-[#78716C] font-medium">
          Getting started
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] leading-snug">
          Your life notebook is ready.
        </h1>
        <p className="text-sm text-[#57534E] leading-relaxed">
          Record your essential documents, insurance policies, passport validity, and warranties so you always know what is due ahead of time.
        </p>
        <button
          onClick={onOpenAdd}
          className="bg-[#2C2C2C] hover:bg-[#1C1C1E] text-[#F7F6F3] px-4 py-2.5 text-sm font-medium rounded-[5px] transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add your first entry</span>
        </button>
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'there';
  const attentionCount = summary?.attentionCount || 0;

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-4xl space-y-12">
      {/* Editorial Header Greeting */}
      <section className="space-y-3 border-b border-[#E2E0D9] pb-8">
        <div className="text-xs tracking-wider text-[#8C827A] uppercase font-medium">
          Daily overview
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1C1C1E] leading-tight font-normal">
          Good day, {firstName}.
        </h1>

        <p className="text-base text-[#57534E] leading-relaxed pt-1">
          {attentionCount === 0 ? (
            'Everything is currently up to date. You have nothing requiring immediate attention.'
          ) : (
            <>
              You have <span className="font-semibold text-[#1C1C1E]">{attentionCount} {attentionCount === 1 ? 'item' : 'items'}</span> requiring your attention in the near term.
            </>
          )}
        </p>
      </section>

      {/* SECTION 1: ATTENTION (Items due soon or overdue) */}
      {attentionItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-[#E2E0D9] pb-2">
            <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
              Requires attention
            </h2>
            <span className="text-xs text-[#78716C]">
              {attentionItems.length} {attentionItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="divide-y divide-[#E2E0D9]">
            {attentionItems.map((thing) => {
              const primaryAction = thing.actions?.[0];
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
                  className="py-4 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left metadata & title */}
                  <div className="space-y-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif text-lg text-[#1C1C1E] group-hover:text-black">
                        {thing.name}
                      </span>
                      {thing.category && (
                        <span className="text-xs text-[#78716C]">
                          &bull; {thing.category.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E]">
                      <StatusBadge
                        status={thing.calculated.status}
                        humanRemaining={thing.calculated.humanRemaining}
                      />
                      {effectiveDate && (
                        <span className="text-[#78716C]">
                          Due {effectiveDate}
                        </span>
                      )}
                    </div>

                    {thing.notes && (
                      <p className="text-xs text-[#78716C] line-clamp-1 pt-0.5">
                        {thing.notes}
                      </p>
                    )}
                  </div>

                  {/* Right inline actions */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                    {primaryAction && (
                      <button
                        onClick={(e) => handleToggleAction(primaryAction.id, primaryAction.completed, e)}
                        className={`text-xs px-2.5 py-1.5 rounded-[5px] border transition-colors flex items-center gap-1.5 ${
                          primaryAction.completed
                            ? 'bg-transparent text-[#78716C] border-[#E2E0D9] line-through'
                            : 'bg-white text-[#2C2C2C] border-[#D6D3CC] hover:bg-[#EFECE6]'
                        }`}
                        title="Mark task completed"
                      >
                        <Check className="w-3.5 h-3.5 text-[#78716C]" />
                        <span className="truncate max-w-[150px]">{primaryAction.title}</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRenew(thing);
                      }}
                      className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] text-xs font-medium px-3 py-1.5 rounded-[5px] transition-colors"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: UPCOMING */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#E2E0D9] pb-2">
          <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
            Coming up later
          </h2>
          <span className="text-xs text-[#78716C]">
            {upcomingItems.length} {upcomingItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {upcomingItems.length === 0 ? (
          <div className="py-6 text-sm text-[#78716C]">
            No upcoming items beyond the next 30 days.
          </div>
        ) : (
          <div className="divide-y divide-[#E2E0D9]">
            {upcomingItems.map((thing) => {
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
                  className="py-3.5 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] transition-colors cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1C1C1E]">
                        {thing.name}
                      </span>
                      {thing.category && (
                        <span className="text-xs text-[#78716C]">
                          &bull; {thing.category.name}
                        </span>
                      )}
                    </div>
                    {effectiveDate && (
                      <div className="text-xs text-[#78716C]">
                        Due {effectiveDate}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <span className="text-xs text-[#57534E]">
                      {thing.calculated.humanRemaining}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E] group-hover:text-[#2C2C2C]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: RECENTLY UPDATED */}
      {recentlyUpdated.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="border-b border-[#E2E0D9] pb-2">
            <h2 className="font-serif text-base text-[#1C1C1E] font-medium">
              Recently updated
            </h2>
          </div>

          <div className="divide-y divide-[#E2E0D9] text-xs text-[#57534E]">
            {recentlyUpdated.map((thing) => {
              const updatedDate = new Date(thing.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={thing.id}
                  onClick={() => onSelectThing(thing.id)}
                  className="py-2.5 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] cursor-pointer flex items-center justify-between"
                >
                  <span className="text-sm text-[#2C2C2C] truncate pr-4">
                    {thing.name}
                  </span>
                  <span className="text-xs text-[#78716C] shrink-0">
                    Updated {updatedDate}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
