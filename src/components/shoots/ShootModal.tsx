import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, User, Tag, FileText } from 'lucide-react';
import { Shoot, ShootType, SHOOT_TYPES } from '../../types';

interface ShootModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shoot: Shoot) => void;
  initialShoot?: Shoot | null;
  defaultDate?: string;
}

export const ShootModal: React.FC<ShootModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialShoot,
  defaultDate,
}) => {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [location, setLocation] = useState('');
  const [shootType, setShootType] = useState<ShootType>('Portrait');
  const [generalNotes, setGeneralNotes] = useState('');

  useEffect(() => {
    if (initialShoot) {
      setTitle(initialShoot.title);
      setClientName(initialShoot.clientName);
      setDateTime(initialShoot.dateTime);
      setLocation(initialShoot.location);
      setShootType(initialShoot.shootType as ShootType);
      setGeneralNotes(initialShoot.generalNotes);
    } else {
      setTitle('');
      setClientName('');
      const d = defaultDate ? new Date(defaultDate) : new Date();
      d.setHours(10, 0, 0, 0);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      setDateTime(localISOTime);
      setLocation('');
      setShootType('Portrait');
      setGeneralNotes('');
    }
  }, [initialShoot, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientName.trim() || !dateTime) return;

    const shoot: Shoot = {
      id: initialShoot?.id || `shoot-${Date.now()}`,
      title: title.trim(),
      clientName: clientName.trim(),
      dateTime,
      location: location.trim() || 'Studio Location',
      shootType,
      generalNotes: generalNotes.trim(),
      createdAt: initialShoot?.createdAt || new Date().toISOString(),
    };

    onSave(shoot);
    onClose();
  };

  return (
    <div
      id="shoot-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        id="shoot-modal-content"
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
                {initialShoot ? 'Edit Photoshoot' : 'Schedule New Shoot'}
              </h3>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                Setup client booking, date/time, and location
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
          {/* Title */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Shoot Title *
            </label>
            <input
              id="shoot-input-title"
              type="text"
              required
              placeholder="e.g., Autumn Editorial Sunset, Smith Wedding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
            />
          </div>

          {/* Client Name & Shoot Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="pulsar-section-label block mb-1.5">
                Client Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="shoot-input-client"
                  type="text"
                  required
                  placeholder="Client or Agency"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] pl-10 pr-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                />
              </div>
            </div>

            <div>
              <label className="pulsar-section-label block mb-1.5">
                Shoot Type *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  id="shoot-select-type"
                  value={shootType}
                  onChange={(e) => setShootType(e.target.value as ShootType)}
                  className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] pl-10 pr-3.5 py-2.5 text-xs text-black dark:text-white focus:outline-none focus:border-[#FF2D20]"
                >
                  {SHOOT_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-[#FFFFFF] dark:bg-[#121212] text-black dark:text-white">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Date & Time *
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="shoot-input-datetime"
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] pl-10 pr-3.5 py-2.5 text-xs text-black dark:text-white focus:outline-none focus:border-[#FF2D20] font-mono"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Location
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="shoot-input-location"
                type="text"
                placeholder="e.g., Presidio Bluff Studio, San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] pl-10 pr-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
          </div>

          {/* General Notes */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              General Notes & Call Sheet Details
            </label>
            <textarea
              id="shoot-input-notes"
              rows={3}
              placeholder="e.g., Wardrobe changes, model agency contacts, parking access, sunset timing..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-4 py-3 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              id="shoot-submit-btn"
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] text-white transition-all"
            >
              {initialShoot ? 'Save Shoot' : 'Schedule Shoot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
