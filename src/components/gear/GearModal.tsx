import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, Image as ImageIcon, Sparkles, Cpu, Zap, ShieldCheck, ExternalLink } from 'lucide-react';
import { GearItem, GearCategory, GEAR_CATEGORIES, GearExifMetadata } from '../../types';
import { ExifToolInspectorModal } from './ExifToolInspectorModal';
import { parseEquipmentExif, ExifToolExtractedData } from '../../services/exiftoolService';

interface GearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: GearItem) => void;
  initialItem?: GearItem | null;
}

const PRESET_IMAGES: { label: string; url: string; category: GearCategory }[] = [
  {
    label: 'Sony A1 Camera',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    category: 'Camera Body',
  },
  {
    label: 'Mirrorless Body',
    url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
    category: 'Camera Body',
  },
  {
    label: 'G Master Zoom',
    url: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80',
    category: 'Lens',
  },
  {
    label: 'Prime Portrait Lens',
    url: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80',
    category: 'Lens',
  },
  {
    label: 'Studio Strobe Monolight',
    url: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=600&q=80',
    category: 'Lighting',
  },
  {
    label: 'Speedlite Flash',
    url: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=600&q=80',
    category: 'Lighting',
  },
  {
    label: 'Wireless Audio Kit',
    url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
    category: 'Audio',
  },
  {
    label: 'Pro Batteries',
    url: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?auto=format&fit=crop&w=600&q=80',
    category: 'Batteries/Memory Cards',
  },
  {
    label: 'Tough Memory Cards',
    url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    category: 'Batteries/Memory Cards',
  },
  {
    label: 'Carbon Tripod',
    url: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=600&q=80',
    category: 'Accessories',
  },
];

export const GearModal: React.FC<GearModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GearCategory>('Camera Body');
  const [serialNumber, setSerialNumber] = useState('');
  const [image, setImage] = useState('');
  const [notes, setNotes] = useState('');
  const [brand, setBrand] = useState('');
  const [showPresets, setShowPresets] = useState(false);
  const [exifMetadata, setExifMetadata] = useState<GearExifMetadata | undefined>(
    initialItem?.exifMetadata
  );
  const [isExifModalOpen, setIsExifModalOpen] = useState(false);
  const [exifDetectedBanner, setExifDetectedBanner] = useState<{
    summary: string;
    data: ExifToolExtractedData;
  } | null>(null);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setSerialNumber(initialItem.serialNumber || '');
      setImage(initialItem.image || '');
      setNotes(initialItem.notes || '');
      setBrand(initialItem.brand || '');
      setExifMetadata(initialItem.exifMetadata);
      setExifDetectedBanner(null);
    } else {
      setName('');
      setCategory('Camera Body');
      setSerialNumber('');
      setImage('https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80');
      setNotes('');
      setBrand('');
      setExifMetadata(undefined);
      setExifDetectedBanner(null);
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Run ExifTool inspection on the photo
    try {
      const data = await parseEquipmentExif(file);
      if (data.model || data.lensModel || data.bodySerialNumber) {
        const detectedTitle = data.model || data.lensModel || 'Equipment';
        const serial = data.bodySerialNumber || data.lensSerialNumber || '';
        setExifDetectedBanner({
          summary: `${detectedTitle}${serial ? ` (SN: ${serial})` : ''}`,
          data,
        });
      }
    } catch (err) {
      console.warn('Exif inspection error:', err);
    }
  };

  const handleAutoFillFromExif = (data: ExifToolExtractedData) => {
    // If current category or suggested is lens
    if (category === 'Lens' && data.suggestedGear.lens) {
      const lens = data.suggestedGear.lens;
      setName(lens.name);
      setBrand(lens.brand);
      if (lens.serialNumber) setSerialNumber(lens.serialNumber);
      if (lens.notes) setNotes((prev) => (prev ? `${prev}\n${lens.notes}` : lens.notes));
      setExifMetadata({
        lensModel: data.lensModel,
        lensSerialNumber: data.lensSerialNumber,
        focalLength: String(data.focalLength || ''),
        maxAperture: data.fNumber ? `f/${data.fNumber}` : undefined,
        rawTags: data.rawTags,
        verifiedAt: new Date().toISOString(),
      });
    } else if (data.suggestedGear.camera) {
      const cam = data.suggestedGear.camera;
      setName(cam.name);
      setBrand(cam.brand);
      setCategory('Camera Body');
      if (cam.serialNumber) setSerialNumber(cam.serialNumber);
      if (cam.notes) setNotes((prev) => (prev ? `${prev}\n${cam.notes}` : cam.notes));
      setExifMetadata({
        cameraMake: data.make,
        cameraModel: data.model,
        bodySerialNumber: data.bodySerialNumber,
        shutterCount: data.shutterCount,
        firmwareVersion: data.software,
        rawTags: data.rawTags,
        verifiedAt: new Date().toISOString(),
      });
    }
    setExifDetectedBanner(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: GearItem = {
      id: initialItem?.id || `gear-${Date.now()}`,
      name: name.trim(),
      category,
      serialNumber: serialNumber.trim(),
      image: image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      notes: notes.trim(),
      brand: brand.trim() || undefined,
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      exifMetadata,
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div
      id="gear-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        id="gear-modal-content"
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                {initialItem ? 'Edit Equipment' : 'Add Gear to Vault'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Track serial numbers, technical notes & specifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* ExifTool Auto-Detection / Quick Launch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#F29191] to-[#F7ADAD] text-white">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#CCFBFA] font-mono block">
                  ExifTool Metadata Engine
                </span>
                <p className="text-xs font-medium text-slate-200">
                  Auto-fill specs from photo EXIF tags
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExifModalOpen(true)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF3E1] text-[11px] font-bold transition-colors inline-flex items-center gap-1 border border-white/10"
            >
              <Sparkles className="w-3 h-3 text-[#F29191]" />
              <span>Scan & Auto-Fill</span>
            </button>
          </div>

          {/* Detected EXIF Notification Banner */}
          {exifDetectedBanner && (
            <div className="p-3 bg-[#CCFBFA]/40 border border-[#B1E5E6] rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#0F4E50] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F4E50] truncate">
                    Detected: {exifDetectedBanner.summary}
                  </p>
                  <p className="text-[10px] text-[#0F4E50]/80">
                    ExifTool found camera specs in uploaded photo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAutoFillFromExif(exifDetectedBanner.data)}
                className="px-3 py-1 rounded-full bg-[#0F4E50] text-[#CCFBFA] text-xs font-bold shrink-0 hover:bg-[#0F4E50]/90 transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* ExifTool Verified Indicator if present */}
          {exifMetadata && (
            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <span className="inline-flex items-center gap-1.5 font-bold font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ExifTool Verified Metadata Attached</span>
              </span>
              {exifMetadata.shutterCount && (
                <span className="text-[10px] font-mono text-emerald-700">
                  {exifMetadata.shutterCount.toLocaleString()} actuations
                </span>
              )}
            </div>
          )}

          {/* Equipment Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Item Name *
            </label>
            <input
              id="gear-input-name"
              type="text"
              required
              placeholder="e.g., Sony Alpha 1, FE 24-70mm f/2.8 GM II..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
            />
          </div>

          {/* Category Select Pills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 font-mono">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GEAR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all text-left truncate ${
                    category === cat
                      ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Serial Number Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Brand / Make
              </label>
              <input
                id="gear-input-brand"
                type="text"
                placeholder="e.g., Sony, Profoto, Rode"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                Serial Number
              </label>
              <input
                id="gear-input-serial"
                type="text"
                placeholder="e.g., SN-8823901"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
              />
            </div>
          </div>

          {/* Image Upload & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Photo Thumbnail
              </label>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="inline-flex items-center gap-1 text-[11px] text-[#D45B5B] hover:underline font-bold"
              >
                <Sparkles className="w-3 h-3" />
                <span>{showPresets ? 'Hide presets' : 'Preset gallery'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                {image ? (
                  <img
                    src={image}
                    alt="Gear preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  id="gear-input-image-url"
                  type="url"
                  placeholder="Image URL (https://...)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
                />

                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200">
                  <Upload className="w-3.5 h-3.5 text-[#D45B5B]" />
                  <span>Upload Photo from Device</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Presets Gallery */}
            {showPresets && (
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-[11px] text-slate-600 mb-2 font-medium">
                  Tap to use high-res photography asset:
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImage(preset.url);
                        setShowPresets(false);
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-[#F29191] focus:outline-none transition-all"
                      title={preset.label}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Notes & Technical Details
            </label>
            <textarea
              id="gear-input-notes"
              rows={3}
              placeholder="e.g., Dual slot CFexpress/SD, recently serviced shutter, 82mm filter thread..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="gear-submit-btn"
              type="submit"
              className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all"
            >
              {initialItem ? 'Save Changes' : 'Add to Vault'}
            </button>
          </div>
        </form>
      </div>

      {/* ExifTool Inspector Sub-modal */}
      <ExifToolInspectorModal
        isOpen={isExifModalOpen}
        onClose={() => setIsExifModalOpen(false)}
        mode="form_autofill"
        onAutoFillForm={handleAutoFillFromExif}
      />
    </div>
  );
};
