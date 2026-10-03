import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/client';
import { DocumentRecord } from '../api/types';

interface UploadDocModalProps {
  isOpen: boolean;
  thingId?: string;
  thingName?: string;
  onClose: () => void;
  onUploaded: (doc: DocumentRecord) => void;
}

export const UploadDocModal: React.FC<UploadDocModalProps> = ({
  isOpen,
  thingId,
  thingName,
  onClose,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedDoc, setUploadedDoc] = useState<DocumentRecord | null>(null);
  const [extractedHints, setExtractedHints] = useState<any>(null);
  const [confirmedExpiry, setConfirmedExpiry] = useState('');
  const [confirmedType, setConfirmedType] = useState('POLICY');
  const [confirmedIdentifier, setConfirmedIdentifier] = useState('');
  const [syncToThing, setSyncToThing] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (thingId) formData.append('thingId', thingId);

      const res = await api.uploadDocument(formData);
      setUploadedDoc(res.document);
      setExtractedHints(res.suggestedExtraction);

      if (res.suggestedExtraction?.expiryDate) {
        setConfirmedExpiry(res.suggestedExtraction.expiryDate);
      }
      if (res.suggestedExtraction?.documentType) {
        setConfirmedType(res.suggestedExtraction.documentType);
      }
      if (res.suggestedExtraction?.identifier) {
        setConfirmedIdentifier(res.suggestedExtraction.identifier);
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmExtraction = async () => {
    if (!uploadedDoc) return;
    setIsConfirming(true);
    try {
      const res = await api.confirmExtraction(uploadedDoc.id, {
        expiryDate: confirmedExpiry || undefined,
        documentType: confirmedType,
        identifier: confirmedIdentifier || undefined,
        syncToThing,
      });
      onUploaded(res.document);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not verify document.');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1px] text-sm">
      <div
        className="w-full max-w-lg bg-[#F7F6F3] border border-[#E2E0D9] rounded-[6px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E0D9] bg-[#EFECE6]">
          <h2 className="font-serif text-lg font-medium text-[#1C1C1E]">
            {uploadedDoc ? 'Confirm document details' : 'Upload document'}
          </h2>
          <button onClick={onClose} className="text-[#78716C] hover:text-[#1C1C1E] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-white border border-[#E2E0D9] text-[#A8382B] text-xs rounded-[5px]">
              {error}
            </div>
          )}

          {!uploadedDoc ? (
            <form onSubmit={handleUpload} className="space-y-4">
              {thingName && (
                <div className="text-xs text-[#78716C]">
                  Attaching to item: <strong className="text-[#1C1C1E]">{thingName}</strong>
                </div>
              )}

              <div className="border border-dashed border-[#D6D3CC] p-8 rounded-[5px] bg-white text-center relative hover:bg-[#F0EFEB]/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="font-medium text-[#1C1C1E] text-sm">
                    {file ? file.name : 'Choose a file or drop it here'}
                  </div>
                  <div className="text-xs text-[#78716C]">
                    PDF, PNG, JPG, or DOC up to 25MB
                  </div>
                </div>
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
                  disabled={!file || isUploading}
                  className="px-4 py-2 text-xs font-medium rounded-[5px] bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload & verify'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-white border border-[#E2E0D9] rounded-[5px] text-xs text-[#57534E]">
                We found details for <strong>{uploadedDoc.originalName}</strong>. You can verify or edit them before saving:
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
                    Document type
                  </label>
                  <select
                    value={confirmedType}
                    onChange={(e) => setConfirmedType(e.target.value)}
                    className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
                  >
                    <option value="POLICY">Insurance Policy</option>
                    <option value="INVOICE">Tax Invoice / Receipt</option>
                    <option value="PASSPORT">Passport / ID</option>
                    <option value="WARRANTY">Warranty Card</option>
                    <option value="CONTRACT">Agreement / Contract</option>
                    <option value="CERTIFICATE">Certificate / PUC</option>
                    <option value="OTHER">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
                    Expiry or renewal date
                  </label>
                  <input
                    type="date"
                    value={confirmedExpiry}
                    onChange={(e) => setConfirmedExpiry(e.target.value)}
                    className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#2C2C2C] mb-1">
                    Policy or serial number
                  </label>
                  <input
                    type="text"
                    value={confirmedIdentifier}
                    onChange={(e) => setConfirmedIdentifier(e.target.value)}
                    placeholder="e.g. POL-99281, APL-409192"
                    className="w-full p-2 border border-[#D6D3CC] bg-white text-sm rounded-[5px] focus:outline-none"
                  />
                </div>

                {thingId && confirmedExpiry && (
                  <label className="flex items-center gap-2 pt-1 text-xs text-[#2C2C2C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToThing}
                      onChange={(e) => setSyncToThing(e.target.checked)}
                      className="rounded-[3px] border-[#D6D3CC]"
                    />
                    <span>Update item deadline to match this document ({confirmedExpiry})</span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E2E0D9]">
                <button
                  type="button"
                  onClick={() => {
                    onUploaded(uploadedDoc);
                    onClose();
                  }}
                  className="text-xs text-[#78716C] hover:text-[#2C2C2C] underline"
                >
                  Keep as uploaded
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExtraction}
                  disabled={isConfirming}
                  className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] px-4 py-2 rounded-[5px] font-medium text-xs disabled:opacity-50"
                >
                  {isConfirming ? 'Saving...' : 'Confirm details'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
