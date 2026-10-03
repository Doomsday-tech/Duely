import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Thing, ActionRecord } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Check, Plus, ExternalLink, Trash2, Edit2, Download } from 'lucide-react';

interface ThingDetailPageProps {
  thingId: string;
  onBack: () => void;
  onOpenRenew: (thing: Thing) => void;
  onOpenUploadDoc: (thingId: string, thingName: string) => void;
  onThingDeleted: () => void;
}

export const ThingDetailPage: React.FC<ThingDetailPageProps> = ({
  thingId,
  onBack,
  onOpenRenew,
  onOpenUploadDoc,
  onThingDeleted,
}) => {
  const [thing, setThing] = useState<Thing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionUrl, setNewActionUrl] = useState('');
  const [isAddingAction, setIsAddingAction] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadThing = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getThing(thingId);
      setThing(data);
      setEditName(data.name);
      setEditNotes(data.notes || '');
      setEditExpiryDate(data.expiryDate ? data.expiryDate.split('T')[0] : '');
    } catch (err: any) {
      console.error('Failed to load item:', err);
      setError(err?.message || 'Could not load record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThing();
  }, [thingId]);

  const handleToggleAction = async (action: ActionRecord) => {
    try {
      await api.updateAction(action.id, { completed: !action.completed });
      await loadThing();
    } catch (err) {
      console.error('Failed to toggle action:', err);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    try {
      await api.deleteAction(actionId);
      await loadThing();
    } catch (err) {
      console.error('Failed to delete action:', err);
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    try {
      await api.addAction(thingId, {
        title: newActionTitle.trim(),
        actionUrl: newActionUrl.trim() || undefined,
      });
      setNewActionTitle('');
      setNewActionUrl('');
      setIsAddingAction(false);
      await loadThing();
    } catch (err) {
      console.error('Failed to add action:', err);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('Delete this attached document?')) return;
    try {
      await api.deleteDocument(docId);
      await loadThing();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleDeleteThing = async () => {
    if (!window.confirm(`Permanently remove "${thing?.name}" from your notebook?`)) return;
    try {
      await api.deleteThing(thingId);
      onThingDeleted();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await api.updateThing(thingId, {
        name: editName.trim(),
        notes: editNotes.trim() || null,
        expiryDate: editExpiryDate || null,
      });
      setIsEditing(false);
      await loadThing();
    } catch (err: any) {
      alert(err?.message || 'Update failed.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 sm:p-12 text-sm text-[#78716C]">
        Loading details...
      </div>
    );
  }

  if (error || !thing) {
    return (
      <div className="p-8 sm:p-12 space-y-4">
        <div className="border border-[#E2E0D9] bg-white p-4 rounded-[5px] text-sm text-[#A8382B]">
          {error || 'Item not found.'}
        </div>
        <button
          onClick={onBack}
          className="border border-[#D6D3CC] px-4 py-2 text-xs rounded-[5px]"
        >
          Return to list
        </button>
      </div>
    );
  }

  const actions = thing.actions || [];
  const documents = thing.documents || [];
  const reminders = thing.reminders || [];
  const renewalHistory = thing.renewalHistory || [];

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-4xl space-y-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-[#E2E0D9] pb-4">
        <button
          onClick={onBack}
          className="text-xs text-[#78716C] hover:text-[#1C1C1E] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to things</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenRenew(thing)}
            className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] text-xs font-medium px-3.5 py-1.5 rounded-[5px] transition-colors"
          >
            Renew entry
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] text-xs font-medium px-3 py-1.5 rounded-[5px] transition-colors"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>

          <button
            onClick={handleDeleteThing}
            className="text-[#78716C] hover:text-[#A8382B] text-xs px-2 py-1.5 transition-colors"
            title="Delete record"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Item Header or Edit Form */}
      {!isEditing ? (
        <section className="space-y-3 border-b border-[#E2E0D9] pb-8">
          <div className="flex items-center gap-2 text-xs text-[#78716C]">
            <StatusBadge
              status={thing.calculated.status}
              humanRemaining={thing.calculated.humanRemaining}
            />
            {thing.category && (
              <span>&bull; {thing.category.name}</span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] font-medium leading-tight">
            {thing.name}
          </h1>

          {thing.description && (
            <p className="text-sm text-[#57534E] max-w-2xl leading-relaxed pt-1">
              {thing.description}
            </p>
          )}

          {/* Key Facts Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#E2E0D9] text-xs">
            <div>
              <span className="text-[#8C827A] block">Due date</span>
              <span className="font-medium text-[#1C1C1E] text-sm">
                {thing.expiryDate ? new Date(thing.expiryDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'None'}
              </span>
            </div>
            <div>
              <span className="text-[#8C827A] block">Remaining</span>
              <span className="font-medium text-[#1C1C1E] text-sm">
                {thing.calculated.daysRemaining !== null
                  ? `${thing.calculated.daysRemaining} days`
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[#8C827A] block">Documents</span>
              <span className="font-medium text-[#1C1C1E] text-sm">
                {documents.length} {documents.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <div>
              <span className="text-[#8C827A] block">Status</span>
              <span className="font-medium text-[#1C1C1E] text-sm capitalize">
                {thing.status.toLowerCase()}
              </span>
            </div>
          </div>
        </section>
      ) : (
        /* Edit Form */
        <section className="border border-[#E2E0D9] bg-white p-6 rounded-[5px] space-y-4 text-xs">
          <div className="font-medium text-sm text-[#1C1C1E] pb-2 border-b border-[#E2E0D9]">
            Edit entry details
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[#78716C] mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-[#D6D3CC] p-2 rounded-[5px] text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[#78716C] mb-1">Expiry date</label>
              <input
                type="date"
                value={editExpiryDate}
                onChange={(e) => setEditExpiryDate(e.target.value)}
                className="w-full border border-[#D6D3CC] p-2 rounded-[5px] text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-[#78716C] mb-1">Notes</label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full border border-[#D6D3CC] p-2 rounded-[5px] text-sm bg-white resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="bg-[#2C2C2C] text-[#F7F6F3] px-4 py-2 rounded-[5px] text-xs font-medium"
              >
                {isSavingEdit ? 'Saving...' : 'Save changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="border border-[#D6D3CC] px-4 py-2 rounded-[5px] text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Grid of Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm">
        {/* Main 2 Columns: Actions & Documents */}
        <div className="md:col-span-2 space-y-10">
          {/* Actions */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E2E0D9] pb-2">
              <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
                Action items
              </h2>
              <button
                onClick={() => setIsAddingAction(!isAddingAction)}
                className="text-xs text-[#2C2C2C] hover:underline"
              >
                + Add action
              </button>
            </div>

            {isAddingAction && (
              <form onSubmit={handleCreateAction} className="border border-[#E2E0D9] bg-white p-3 rounded-[5px] space-y-2 text-xs">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Action title (e.g. Renew online, call broker)..."
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  className="w-full border border-[#D6D3CC] p-2 rounded-[5px] bg-white text-xs"
                />
                <input
                  type="url"
                  placeholder="Website or portal link (optional)..."
                  value={newActionUrl}
                  onChange={(e) => setNewActionUrl(e.target.value)}
                  className="w-full border border-[#D6D3CC] p-2 rounded-[5px] bg-white text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingAction(false)}
                    className="border border-[#D6D3CC] px-3 py-1 text-xs rounded-[5px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#2C2C2C] text-[#F7F6F3] px-3 py-1 text-xs font-medium rounded-[5px]"
                  >
                    Save action
                  </button>
                </div>
              </form>
            )}

            {actions.length === 0 ? (
              <div className="py-4 text-xs text-[#78716C]">
                No actions listed yet. Add tasks you need to complete before this expires.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E0D9]">
                {actions.map((act) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleAction(act)}
                        className={`mt-0.5 w-4 h-4 rounded-[3px] border border-[#D6D3CC] flex items-center justify-center transition-colors cursor-pointer ${
                          act.completed ? 'bg-[#2C2C2C] text-white' : 'bg-white'
                        }`}
                      >
                        {act.completed && <Check className="w-3 h-3" />}
                      </button>
                      <div className="space-y-0.5 min-w-0">
                        <span
                          className={`text-sm block truncate ${
                            act.completed ? 'line-through text-[#8C827A]' : 'text-[#1C1C1E]'
                          }`}
                        >
                          {act.title}
                        </span>
                        {act.notes && (
                          <div className="text-xs text-[#78716C]">{act.notes}</div>
                        )}
                        {act.actionUrl && (
                          <a
                            href={act.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#2C2C2C] hover:underline"
                          >
                            <span>Open website</span>
                            <ExternalLink className="w-3 h-3 text-[#78716C]" />
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAction(act.id)}
                      className="text-xs text-[#8C827A] hover:text-[#A8382B] shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Documents */}
          <section className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-[#E2E0D9] pb-2">
              <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
                Attached documents
              </h2>
              <button
                onClick={() => onOpenUploadDoc(thing.id, thing.name)}
                className="text-xs text-[#2C2C2C] hover:underline"
              >
                + Upload document
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="py-4 text-xs text-[#78716C]">
                No files attached. Upload your invoice, certificate, or policy agreement.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E0D9]">
                {documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-sm font-medium text-[#1C1C1E] truncate">
                        {doc.originalName}
                      </div>
                      <div className="text-xs text-[#78716C]">
                        {doc.documentType || 'Document'} {doc.identifier && `• ID: ${doc.identifier}`} •{' '}
                        {(doc.size / 1024).toFixed(0)} KB
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href={api.getDocumentDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-2.5 py-1 text-xs rounded-[5px] transition-colors"
                      >
                        View file
                      </a>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-xs text-[#8C827A] hover:text-[#A8382B]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Renewal History */}
          <section className="space-y-3">
            <div className="border-b border-[#E2E0D9] pb-2">
              <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
                Renewal history
              </h2>
            </div>

            {renewalHistory.length === 0 ? (
              <div className="py-4 text-xs text-[#78716C]">
                No previous renewals on record yet.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E0D9]">
                {renewalHistory.map((h) => {
                  const prevStr = h.previousExpiry
                    ? new Date(h.previousExpiry).toLocaleDateString(undefined, { dateStyle: 'medium' })
                    : 'Initial';
                  const newStr = new Date(h.newExpiry).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  });
                  const timestamp = new Date(h.renewedAt).toLocaleDateString(undefined, {
                    dateStyle: 'medium',
                  });

                  return (
                    <div key={h.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-[#1C1C1E] text-sm">
                          {prevStr} &rarr; {newStr}
                        </div>
                        {h.notes && <div className="text-[#78716C]">{h.notes}</div>}
                      </div>
                      <div className="text-right text-[#78716C]">
                        {h.cost && <div className="font-medium text-[#1C1C1E]">₹{h.cost.toLocaleString()}</div>}
                        <div>{timestamp}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Reminders & Notes */}
        <div className="space-y-8">
          {/* Reminders list */}
          <section className="border border-[#E2E0D9] bg-white p-4 rounded-[5px] space-y-3">
            <div className="font-serif text-sm font-medium text-[#1C1C1E] border-b border-[#E2E0D9] pb-2">
              Scheduled reminders
            </div>
            {reminders.length === 0 ? (
              <p className="text-xs text-[#78716C]">No reminders set.</p>
            ) : (
              <div className="space-y-2">
                {reminders.map((r) => (
                  <div key={r.id} className="border-b border-[#EFECE6] pb-2 text-xs">
                    <div className="flex justify-between font-medium text-[#2C2C2C]">
                      <span>{r.daysBefore} days before</span>
                      <span className="capitalize text-[#78716C] font-normal">{r.status.toLowerCase()}</span>
                    </div>
                    <div className="text-[11px] text-[#78716C]">
                      Date: {new Date(r.remindAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="border border-[#E2E0D9] bg-white p-4 rounded-[5px] space-y-2">
            <div className="font-serif text-sm font-medium text-[#1C1C1E] border-b border-[#E2E0D9] pb-2">
              Notebook notes
            </div>
            {thing.notes ? (
              <p className="text-xs text-[#57534E] leading-relaxed whitespace-pre-wrap">
                {thing.notes}
              </p>
            ) : (
              <p className="text-xs text-[#78716C] italic">No notes recorded.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
