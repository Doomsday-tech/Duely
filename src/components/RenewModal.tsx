import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Thing } from '../api/types';
import { api } from '../api/client';

interface RenewModalProps {
  isOpen: boolean;
  thing: Thing | null;
  onClose: () => void;
  onRenewed: (updatedThing: Thing) => void;
}

export const RenewModal: React.FC<RenewModalProps> = ({
  isOpen,
  thing,
  onClose,
  onRenewed,
}) => {
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (thing?.expiryDate) {
      const current = new Date(thing.expiryDate);
      current.setFullYear(current.getFullYear() + 1);
      setNewExpiryDate(current.toISOString().split('T')[0]);
    } else {
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      setNewExpiryDate(oneYear.toISOString().split('T')[0]);
    }
    setCost('');
    setNotes('');
    setError(null);
  }, [thing, isOpen]);

  if (!isOpen || !thing) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiryDate) {
      setError('Please specify the new expiry date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updated = await api.renewThing(thing.id, {
        newExpiryDate,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes.trim() || undefined,
      });

      onRenewed(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not record renewal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1px] text-sm">
      <div
        className="w-full max-w-md bg-[#F7F6F3] border border-[#E2E0D9] rounded-[6px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E0D9] bg-[#EFECE6]">
          <h2 className="font-serif text-lg font-medium text-[#1C1C1E]">
            Record renewal
          </h2>
          <button onClick={onClose} className="text-[#78716C] hover:text-[#1C1C1E] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-white border border-[#E2E0D9] text-[#A8382B] text-xs rounded-[5px]">
              {error}
            </div>
          )}

          <div className="border-b border-[#E2E0D9] pb-3">
            <div className="text-xs text-[#78716C]">Item to renew</div>
            <div className="font-serif text-base font-medium text-[#1C1C1E]">{thing.name}</div>
            {thing.expiryDate && (
              <div className="text-xs text-[#78716C] mt-0.5">
                Current expiry: {new Date(thing.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              New expiry date *
            </label>
            <input
              type="date"
              required
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              Renewal cost (optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 14500"
              className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              Notes (discounts, terms)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 25% No-claim bonus applied..."
              className="w-full p-2 border border-[#D6D3CC] bg-white text-xs rounded-[5px] resize-none focus:outline-none"
            />
          </div>

          <div className="p-3 bg-white border border-[#E2E0D9] rounded-[5px] text-xs text-[#57534E]">
            Duely archives your previous expiry in your renewal history and resets reminders for the new cycle.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E0D9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-[5px] border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-[5px] bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm renewal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
