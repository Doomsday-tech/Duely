import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Category } from '../api/types';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [jobStatusMsg, setJobStatusMsg] = useState<string | null>(null);
  const [isTriggeringJob, setIsTriggeringJob] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.createCategory({ name: newCatName.trim() });
      setNewCatName('');
      setIsAddingCat(false);
      await loadCategories();
    } catch (err: any) {
      alert(err?.message || 'Failed to add category');
    }
  };

  const handleRunReminders = async () => {
    setIsTriggeringJob(true);
    setJobStatusMsg(null);
    try {
      const res = await api.runRemindersJob();
      setJobStatusMsg(
        `Job completed successfully: Triggered ${res.stats?.triggeredCount || 0} reminders, synchronized ${
          res.stats?.updatedThingsCount || 0
        } records.`
      );
    } catch (err: any) {
      setJobStatusMsg('Execution failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsTriggeringJob(false);
    }
  };

  const handleExportData = async () => {
    try {
      const [things, documents, reminders] = await Promise.all([
        api.getThings(),
        api.getDocuments(),
        api.getReminders(),
      ]);

      const exportPayload = {
        application: 'Duely',
        exportedAt: new Date().toISOString(),
        user: { email: user?.email, name: user?.name },
        things,
        documents,
        reminders,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duely-notebook-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not export data.');
    }
  };

  return (
    <div className="p-6 sm:p-12 lg:p-14 max-w-3xl space-y-12 text-sm">
      {/* Header */}
      <div className="border-b border-[#E2E0D9] pb-6 space-y-1">
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1C1E] font-normal">
          Notebook settings
        </h1>
        <p className="text-sm text-[#78716C]">
          Account profile, custom categories, and data portability.
        </p>
      </div>

      {/* Account Profile */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg text-[#1C1C1E] font-medium border-b border-[#E2E0D9] pb-2">
          Your account
        </h2>
        <div className="divide-y divide-[#E2E0D9] text-sm">
          <div className="py-2.5 flex justify-between">
            <span className="text-[#78716C]">Name</span>
            <span className="font-medium text-[#1C1C1E]">{user?.name}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-[#78716C]">Email address</span>
            <span className="font-medium text-[#1C1C1E]">{user?.email}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-[#78716C]">Data privacy</span>
            <span className="text-[#2D5A43] font-medium">Row-level multi-tenant isolated</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#A8382B] px-4 py-2 text-xs font-medium rounded-[5px] transition-colors cursor-pointer"
        >
          Sign out of session
        </button>
      </section>

      {/* Categories */}
      <section className="space-y-4">
        <div className="border-b border-[#E2E0D9] pb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-lg text-[#1C1C1E] font-medium">
            Categories
          </h2>
          <button
            onClick={() => setIsAddingCat(!isAddingCat)}
            className="text-xs text-[#2C2C2C] hover:underline"
          >
            + Add category
          </button>
        </div>

        {isAddingCat && (
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name..."
              className="border border-[#D6D3CC] px-3 py-1.5 bg-white text-sm rounded-[5px] w-full"
            />
            <button
              type="submit"
              className="bg-[#2C2C2C] text-[#F7F6F3] px-4 py-1.5 text-xs font-medium rounded-[5px] shrink-0"
            >
              Add
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((c) => (
            <span
              key={c.id}
              className="border border-[#E2E0D9] bg-white px-3 py-1 text-xs text-[#57534E] rounded-[5px]"
            >
              {c.name}
            </span>
          ))}
        </div>
      </section>

      {/* Reminder Scheduler */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg text-[#1C1C1E] font-medium border-b border-[#E2E0D9] pb-2">
          Background reminder service
        </h2>
        <p className="text-[#57534E] leading-relaxed text-xs">
          Duely checks your upcoming deadlines every 60 seconds and updates their status from upcoming to due soon or overdue automatically.
        </p>

        {jobStatusMsg && (
          <div className="border border-[#E2E0D9] bg-white p-3 rounded-[5px] text-xs text-[#2C2C2C]">
            {jobStatusMsg}
          </div>
        )}

        <button
          onClick={handleRunReminders}
          disabled={isTriggeringJob}
          className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-3.5 py-1.5 text-xs font-medium rounded-[5px] disabled:opacity-50 transition-colors"
        >
          {isTriggeringJob ? 'Running check...' : 'Run reminder check now'}
        </button>
      </section>

      {/* Data Export */}
      <section className="space-y-4">
        <h2 className="font-serif text-lg text-[#1C1C1E] font-medium border-b border-[#E2E0D9] pb-2">
          Data portability
        </h2>
        <p className="text-[#57534E] leading-relaxed text-xs">
          Download a complete backup archive of all your entries, reminders, actions, and document metadata.
        </p>
        <button
          onClick={handleExportData}
          className="bg-[#2C2C2C] hover:bg-[#1C1C1E] text-[#F7F6F3] px-4 py-2 text-xs font-medium rounded-[5px] transition-colors"
        >
          Export all data (JSON)
        </button>
      </section>
    </div>
  );
};
