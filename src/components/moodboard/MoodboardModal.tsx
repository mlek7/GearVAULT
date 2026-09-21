import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Sparkles, Image as ImageIcon, Palette } from 'lucide-react';
import { MoodboardItem } from '../../types';

interface MoodboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  shootId: string;
  onAddMoodboardItem: (item: MoodboardItem) => void;
}

const PRESET_INSPIRATIONS = [
  {
    label: 'Golden Hour Silhouette',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
    caption: 'Backlit flowing fabric against coastal breeze with warm rim-light.',
    link: 'https://pinterest.com/pin/coastal-silhouette-editorial',
    palette: ['#C29B7F', '#5E4B3C', '#E2D4C3', '#23201D'],
  },
  {
    label: 'Close-up Editorial Beauty',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    caption: 'Warm ambient glow with delicate shadow fall-off across cheekbones.',
    link: 'https://behance.net/gallery/editorial-beauty-lighting',
    palette: ['#E69C24', '#7D470D', '#1F1A16', '#FBE9D0'],
  },
  {
    label: 'Architectural High Fashion',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    caption: 'Dynamic angles with bold terracotta and slate contrast styling.',
    link: 'https://pinterest.com/pin/architectural-high-fashion',
    palette: ['#D67D3E', '#2B2B2B', '#EAE0D5', '#8C4F27'],
  },
  {
    label: 'Natural Couple Candid',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    caption: 'Soft romantic motion through sun-dappled grove. 85mm portrait depth.',
    link: 'https://pinterest.com/pin/romantic-couple-outdoor',
    palette: ['#6B7A58', '#E9E4DC', '#C4A482', '#3D4133'],
  },
  {
    label: 'Atmospheric Ocean Mist',
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80',
    caption: 'Cinematic wide frame utilizing coastal fog for atmospheric layering.',
    link: 'https://behance.net/gallery/atmospheric-coastal-scenery',
    palette: ['#708090', '#B0C4DE', '#2F4F4F', '#F5F5F0'],
  },
];

export const MoodboardModal: React.FC<MoodboardModalProps> = ({
  isOpen,
  onClose,
  shootId,
  onAddMoodboardItem,
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [category, setCategory] = useState<'Posing' | 'Lighting' | 'Styling' | 'Color/Grade' | 'Location'>('Posing');
  const [colors, setColors] = useState<string[]>(['#C29B7F', '#5E4B3C', '#E2D4C3', '#23201D']);
  const [showPresets, setShowPresets] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyPreset = (preset: typeof PRESET_INSPIRATIONS[0]) => {
    setImageUrl(preset.url);
    setCaption(preset.caption);
    setExternalLink(preset.link);
    setColors(preset.palette);
    setShowPresets(false);
  };

  const handleColorChange = (idx: number, newHex: string) => {
    const next = [...colors];
    next[idx] = newHex;
    setColors(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    const item: MoodboardItem = {
      id: `mb-${Date.now()}`,
      shootId,
      imageUrl: imageUrl.trim(),
      caption: caption.trim() || 'Visual Reference',
      externalLink: externalLink.trim() || undefined,
      colorPalette: colors.filter((c) => c.trim().length > 0),
      category,
      createdAt: new Date().toISOString(),
    };

    onAddMoodboardItem(item);
    onClose();
  };

  return (
    <div
      id="moodboard-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Add Creative Inspiration
            </h3>
            <p className="text-[11px] text-slate-500">
              Reference images, Pinterest boards, posing, and lighting guides
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
          {/* Presets toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Reference Image *
            </span>
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="inline-flex items-center gap-1 text-xs text-[#D45B5B] hover:underline font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{showPresets ? 'Close Presets' : 'Choose Inspiration Preset'}</span>
            </button>
          </div>

          {/* Presets Gallery */}
          {showPresets && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-medium text-slate-600 block">
                Tap to load curated photographer reference:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_INSPIRATIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="group aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-[#F29191] relative focus:outline-none transition-all"
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

          {/* Image preview & upload */}
          <div className="flex items-start gap-3">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center shadow-xs">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Reference preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="url"
                placeholder="Image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
              />

              <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors border border-slate-200">
                <Upload className="w-3.5 h-3.5 text-[#D45B5B]" />
                <span>Upload from Phone / Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Category & Inspiration Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['Posing', 'Lighting', 'Styling', 'Color/Grade', 'Location'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold text-center transition-all ${
                    category === cat
                      ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Caption / Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              Caption / Posing & Lighting Notes *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Turn shoulders 45 degrees, chin slightly down, key light placed high right..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191] resize-none"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
              External Reference URL (Pinterest, Behance, Dropbox)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://pinterest.com/pin/..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
              />
            </div>
          </div>

          {/* Color Palette Swatches */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-mono">
                <Palette className="w-3.5 h-3.5 text-[#D45B5B]" />
                <span>Color Palette Swatches</span>
              </label>
              <span className="text-[10px] text-slate-400">Pick hex colors</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {colors.map((hex, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-1.5"
                >
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-7 h-7 rounded-xl cursor-pointer bg-transparent border-none p-0"
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-full text-[11px] font-mono uppercase bg-transparent text-slate-800 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="moodboard-submit-btn"
              type="submit"
              disabled={!imageUrl.trim()}
              className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#F29191] to-[#F7ADAD] disabled:opacity-40 text-white shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all"
            >
              Add to Moodboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
