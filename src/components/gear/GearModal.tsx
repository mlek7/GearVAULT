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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        id="gear-modal-content"
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
                {initialItem ? 'Edit Equipment' : 'Add Gear to Vault'}
              </h2>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                Track serial numbers, technical notes & specifications
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-none">
          {/* ExifTool Auto-Detection / Quick Launch */}
          <div className="flex items-center justify-between p-3.5 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-[#FF2D20]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <span className="pulsar-section-label block">
                  ExifTool Metadata Engine
                </span>
                <p className="text-xs font-medium text-black dark:text-white mt-0.5">
                  Auto-fill specs from photo EXIF tags
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExifModalOpen(true)}
              className="pulsar-bracket-btn"
            >
              <Sparkles className="w-3 h-3 text-[#FF2D20]" />
              <span>SCAN PHOTO</span>
            </button>
          </div>

          {/* Detected EXIF Notification Banner */}
          {exifDetectedBanner && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[18px] flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Zap className="w-4 h-4 text-[#30D158] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-black dark:text-white truncate">
                    Detected: {exifDetectedBanner.summary}
                  </p>
                  <p className="text-[10px] text-[#8E8E93] font-mono">
                    ExifTool found camera specs in uploaded photo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleAutoFillFromExif(exifDetectedBanner.data)}
                className="px-3 py-1 rounded-full bg-[#30D158] text-white text-xs font-medium shrink-0 hover:brightness-105 transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* ExifTool Verified Indicator if present */}
          {exifMetadata && (
            <div className="px-3.5 py-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-between text-xs text-[#30D158]">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#30D158]" />
                <span>EXIFTOOL VERIFIED METADATA</span>
              </span>
              {exifMetadata.shutterCount && (
                <span className="text-[10px] font-mono">
                  {exifMetadata.shutterCount.toLocaleString()} ACTUATIONS
                </span>
              )}
            </div>
          )}

          {/* Equipment Name */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Item Name *
            </label>
            <input
              id="gear-input-name"
              type="text"
              required
              placeholder="e.g., Sony Alpha 1, FE 24-70mm f/2.8 GM II..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
            />
          </div>

          {/* Category Select Pills */}
          <div>
            <label className="pulsar-section-label block mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GEAR_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all text-center truncate ${
                    category === cat
                      ? 'bg-[#FF2D20] text-white shadow-xs'
                      : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white border border-transparent'
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
              <label className="pulsar-section-label block mb-1.5">
                Brand / Make
              </label>
              <input
                id="gear-input-brand"
                type="text"
                placeholder="e.g., Sony, Profoto, Rode"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
            <div>
              <label className="pulsar-section-label block mb-1.5">
                Serial Number
              </label>
              <input
                id="gear-input-serial"
                type="text"
                placeholder="e.g., SN-8823901"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white font-mono placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
          </div>

          {/* Image Upload & Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="pulsar-section-label">
                Photo Thumbnail
              </label>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="pulsar-bracket-btn"
              >
                <Sparkles className="w-3 h-3 text-[#FF2D20]" />
                <span>{showPresets ? 'HIDE PRESETS' : 'PRESET GALLERY'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-[14px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt="Gear preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8E8E93]">
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
                  className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-4 py-2 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                />

                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white rounded-full text-xs font-medium cursor-pointer transition-colors border border-black/[0.08] dark:border-white/[0.08]">
                  <Upload className="w-3.5 h-3.5 text-[#FF2D20]" />
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
              <div className="mt-3 p-3 bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[20px]">
                <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mb-2 font-mono">
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
                      className="group relative aspect-square rounded-[12px] overflow-hidden border border-black/[0.08] dark:border-white/[0.08] hover:border-[#FF2D20] focus:outline-none transition-all"
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
            <label className="pulsar-section-label block mb-1.5">
              Notes & Technical Details
            </label>
            <textarea
              id="gear-input-notes"
              rows={3}
              placeholder="e.g., Dual slot CFexpress/SD, recently serviced shutter, 82mm filter thread..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] resize-none"
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
              id="gear-submit-btn"
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] text-white transition-all"
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
