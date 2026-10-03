import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Thing } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowRight } from 'lucide-react';

interface CalendarPageProps {
  onSelectThing: (thingId: string) => void;
}

interface TimelineEvent {
  date: Date;
  dateStr: string;
  monthYear: string;
  thingId: string;
  thingName: string;
  categoryName?: string;
  type: string;
  status: string;
  humanRemaining: string;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onSelectThing }) => {
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.getThings({ sort: 'expiryAsc' });
        setThings(data);
      } catch (err) {
        console.error('Failed to load timeline events:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const events: TimelineEvent[] = [];
  for (const t of things) {
    if (t.expiryDate) {
      const d = new Date(t.expiryDate);
      events.push({
        date: d,
        dateStr: d.toLocaleDateString(undefined, { dateStyle: 'medium' }),
        monthYear: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        thingId: t.id,
        thingName: t.name,
        categoryName: t.category?.name,
        type: 'Expiry date',
        status: t.calculated.status,
        humanRemaining: t.calculated.humanRemaining,
      });
    }
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const groupedMonths: { [key: string]: TimelineEvent[] } = {};
  for (const ev of events) {
    if (!groupedMonths[ev.monthYear]) {
      groupedMonths[ev.monthYear] = [];
    }
    groupedMonths[ev.monthYear].push(ev);
  }

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-4xl space-y-10">
      {/* Header */}
      <div className="border-b border-[#E2E0D9] pb-6 space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] font-normal">
          Upcoming timeline
        </h1>
        <p className="text-sm text-[#78716C]">
          A chronological schedule of deadlines, contract ends, and expirations.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-sm text-[#78716C]">
          Loading timeline schedule...
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center border-t border-[#E2E0D9] text-sm text-[#78716C]">
          No upcoming deadlines scheduled on your timeline.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedMonths).map(([month, monthEvents]) => (
            <section key={month} className="space-y-3">
              <div className="border-b border-[#E2E0D9] pb-2 flex items-baseline justify-between">
                <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
                  {month}
                </h2>
                <span className="text-xs text-[#78716C]">
                  {monthEvents.length} {monthEvents.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              <div className="divide-y divide-[#E2E0D9]">
                {monthEvents.map((ev, idx) => (
                  <div
                    key={`${ev.thingId}-${idx}`}
                    onClick={() => onSelectThing(ev.thingId)}
                    className="py-3.5 hover:bg-[#F0EFEB]/50 -mx-3 px-3 rounded-[5px] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-baseline gap-4 min-w-0 pr-4">
                      <span className="text-xs font-medium text-[#78716C] w-24 shrink-0">
                        {ev.dateStr}
                      </span>
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-medium text-[#1C1C1E] truncate">
                          {ev.thingName}
                        </div>
                        <div className="text-xs text-[#78716C]">
                          {ev.type} {ev.categoryName && `• ${ev.categoryName}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 self-start sm:self-center">
                      <StatusBadge status={ev.status} humanRemaining={ev.humanRemaining} />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8A29E]" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
