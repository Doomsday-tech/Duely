import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/client';
import { Category, Thing } from '../api/types';

interface AddThingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThingCreated: (thing: Thing) => void;
  initialCategory?: string;
}

export const AddThingModal: React.FC<AddThingModalProps> = ({
  isOpen,
  onClose,
  onThingCreated,
  initialCategory,
}) => {
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState(initialCategory || 'Documents');
  const [categories, setCategories] = useState<Category[]>([]);
  const [expiryDate, setExpiryDate] = useState('');
  const [reminders, setReminders] = useState<number[]>([14, 7]);
  const [actionTitle, setActionTitle] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then(setCategories).catch(() => {});
      setError(null);
    } else {
      setName('');
      setExpiryDate('');
      setReminders([14, 7]);
      setActionTitle('');
      setActionUrl('');
      setNotes('');
      setAttachedFile(null);
    }
  }, [isOpen]);

  const toggleReminder = (days: number) => {
    if (reminders.includes(days)) {
      setReminders(reminders.filter((d) => d !== days));
    } else {
      setReminders([...reminders, days].sort((a, b) => b - a));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this item.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createThing({
        name: name.trim(),
        categoryName,
        expiryDate: expiryDate || null,
        reminders,
        notes: notes.trim() || null,
        initialAction: actionTitle.trim()
          ? {
              title: actionTitle.trim(),
              actionUrl: actionUrl.trim() || undefined,
            }
          : undefined,
      });

      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);
        formData.append('thingId', created.id);
        if (expiryDate) formData.append('expiryDate', expiryDate);
        await api.uploadDocument(formData);
      }

      const enriched = await api.getThing(created.id);
      onThingCreated(enriched);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not create item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1px] text-sm">
      <div
        className="w-full max-w-lg bg-[#F7F6F3] border border-[#E2E0D9] rounded-[6px] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E0D9] bg-[#EFECE6]">
          <div>
            <h2 className="font-serif text-lg font-medium text-[#1C1C1E]">
              Add new entry
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Record a document, policy, subscription, or warranty.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#78716C] hover:text-[#1C1C1E] p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-white border border-[#E2E0D9] text-[#A8382B] text-xs rounded-[5px]">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              What are you tracking? *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Car Insurance, Passport, Laptop Warranty..."
              className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none focus:border-[#2C2C2C]"
            />
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
                Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none focus:border-[#2C2C2C] cursor-pointer"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Documents">Documents</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Warranties">Warranties</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Memberships">Memberships</option>
                    <option value="Property">Property</option>
                    <option value="Finance">Finance</option>
                    <option value="Technology">Technology</option>
                    <option value="Other">Other</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
                Expiry or renewal date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none focus:border-[#2C2C2C]"
              />
            </div>
          </div>

          {/* Reminder Interval Checkboxes */}
          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1.5">
              Remind me in advance
            </label>
            <div className="flex flex-wrap gap-2">
              {[30, 14, 7, 1].map((days) => {
                const active = reminders.includes(days);
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => toggleReminder(days)}
                    className={`px-3 py-1.5 text-xs rounded-[5px] border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#2C2C2C] text-[#F7F6F3] border-[#2C2C2C] font-medium'
                        : 'bg-white text-[#57534E] border-[#D6D3CC] hover:bg-[#EFECE6]'
                    }`}
                  >
                    {days === 1 ? '1 day before' : `${days} days before`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action */}
          <div className="border-t border-[#E2E0D9] pt-3 space-y-2">
            <label className="block text-xs font-medium text-[#2C2C2C]">
              Required action (optional)
            </label>
            <input
              type="text"
              value={actionTitle}
              onChange={(e) => setActionTitle(e.target.value)}
              placeholder="e.g. Renew online, compare quotes..."
              className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
            />
            <input
              type="url"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
              placeholder="Website link (https://...)"
              className="w-full p-2 border border-[#D6D3CC] bg-white text-xs rounded-[5px] focus:outline-none"
            />
          </div>

          {/* Attach Document File */}
          <div className="border-t border-[#E2E0D9] pt-3">
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              Attach document (PDF or image)
            </label>
            <div className="border border-dashed border-[#D6D3CC] p-3 rounded-[5px] bg-white text-center relative cursor-pointer hover:bg-[#F0EFEB]/50 transition-colors">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="text-xs text-[#57534E]">
                {attachedFile ? (
                  <strong className="text-[#1C1C1E]">{attachedFile.name}</strong>
                ) : (
                  'Click to attach invoice, policy, or receipt'
                )}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details, policy numbers, or contacts..."
              className="w-full p-2 border border-[#D6D3CC] bg-white text-xs rounded-[5px] resize-none focus:outline-none"
            />
          </div>

          {/* Buttons */}
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
              {isSubmitting ? 'Saving...' : 'Save entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
