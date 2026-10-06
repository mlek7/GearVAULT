import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Palette, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MoodboardItem } from '../../types';

interface MoodboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  shootId: string;
  onAddMoodboardItem: (item: MoodboardItem) => void;
}

export const MoodboardModal: React.FC<MoodboardModalProps> = ({
  isOpen,
  onClose,
  shootId,
  onAddMoodboardItem,
}) => {
  const [activeSourceTab, setActiveSourceTab] = useState<'link' | 'upload' | 'url'>('link');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [category, setCategory] = useState<'Posing' | 'Lighting' | 'Styling' | 'Color/Grade' | 'Location'>('Posing');
  const [colors, setColors] = useState<string[]>(['#C29B7F', '#5E4B3C', '#E2D4C3', '#23201D']);

  // Link extraction state
  const [linkInput, setLinkInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setExtractError(null);
        setExtractedSuccess('Photo loaded from device');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractFromLink = async () => {
    const trimmed = linkInput.trim();
    if (!trimmed) {
      setExtractError('Please enter a valid Pinterest pin or webpage URL.');
      return;
    }

    setIsExtracting(true);
    setExtractError(null);
    setExtractedSuccess(null);

    try {
      const res = await fetch('/api/extract-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract image from this link.');
      }

      setImageUrl(data.imageUrl);
      setExternalLink(data.sourceUrl || trimmed);
      if (data.title && !caption.trim()) {
        setCaption(data.title);
      }
      setExtractedSuccess('Image successfully imported and saved locally!');
    } catch (err: any) {
      setExtractError(err.message || 'Could not resolve image from link.');
    } finally {
      setIsExtracting(false);
    }
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40">
          <div>
            <h3 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
              Add Creative Inspiration
            </h3>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
              Import Pinterest pins, reference images, posing, and lighting guides
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Tabs - Pulsar Pill Track */}
        <div className="flex border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2] dark:bg-[#121212] px-6 py-2.5 gap-2 text-xs">
          <div className="flex w-full p-1 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] gap-1">
            <button
              type="button"
              onClick={() => setActiveSourceTab('link')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeSourceTab === 'link'
                  ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Link / Pinterest</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSourceTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeSourceTab === 'upload'
                  ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSourceTab('url')}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                activeSourceTab === 'url'
                  ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
                  : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Direct URL</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
          {/* Tab 1: Pinterest & Link Import (Requirement 5) */}
          {activeSourceTab === 'link' && (
            <div className="p-4 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] space-y-3">
              <label className="block text-xs font-medium text-black dark:text-white">
                Paste Pinterest Pin or Webpage Link:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-[#8E8E93] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://pinterest.com/pin/... or https://pin.it/..."
                    value={linkInput}
                    onChange={(e) => {
                      setLinkInput(e.target.value);
                      setExtractError(null);
                      setExtractedSuccess(null);
                      setImageUrl('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExtractFromLink();
                      }
                    }}
                    className="w-full bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-full pl-9 pr-3 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                  />
                </div>
                <button
                  type="button"
                  disabled={isExtracting || !linkInput.trim()}
                  onClick={handleExtractFromLink}
                  className="px-5 py-2.5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white text-xs font-medium disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <span>Extract</span>
                  )}
                </button>
              </div>

              {imageUrl && (
                <div className="p-3 rounded-[18px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] flex items-center gap-3 animate-in fade-in">
                  <div className="w-16 h-16 rounded-[14px] bg-[#EBEBEB] dark:bg-[#1E1E1E] overflow-hidden shrink-0 border border-black/[0.08] dark:border-white/[0.08]">
                    <img
                      src={imageUrl}
                      alt="Extracted Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[#30D158] text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Pin image ready</span>
                    </div>
                    <p className="text-xs font-medium text-black dark:text-white truncate mt-0.5">
                      {caption || 'Image preview resolved'}
                    </p>
                    <p className="text-[10px] text-[#8E8E93] font-mono truncate">
                      {externalLink || linkInput}
                    </p>
                  </div>
                </div>
              )}

              {extractError && (
                <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 text-xs flex items-center gap-2 px-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{extractError}</span>
                </div>
              )}

              {extractedSuccess && (
                <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#30D158] text-xs flex items-center gap-2 px-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{extractedSuccess}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Upload Image */}
          {activeSourceTab === 'upload' && (
            <div className="p-4 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-center">
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-black/[0.08] dark:border-white/[0.08] rounded-[18px] cursor-pointer hover:border-[#FF2D20] transition-colors">
                <Upload className="w-8 h-8 text-[#FF2D20] mb-2" />
                <span className="text-xs font-medium text-black dark:text-white">
                  Select photo from camera or library
                </span>
                <span className="text-[11px] text-[#8E8E93] font-mono mt-0.5">
                  JPEG, PNG, HEIC, WEBP supported
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeSourceTab === 'url' && (
            <div className="p-4 rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] space-y-2">
              <label className="block text-xs font-medium text-black dark:text-white">
                Direct Image Link:
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-4 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
          )}

          {/* Image Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-[18px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08]">
            <div className="w-20 h-20 rounded-[14px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shrink-0 relative flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Reference preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-7 h-7 text-[#8E8E93]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-black dark:text-white truncate">
                {imageUrl ? 'Reference Image Ready' : 'No image loaded yet'}
              </p>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mt-0.5 line-clamp-2">
                {externalLink ? `Source: ${externalLink}` : 'Extract from link or select a file to preview.'}
              </p>
            </div>
          </div>

          {/* Category & Inspiration Type */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['Posing', 'Lighting', 'Styling', 'Color/Grade', 'Location'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 rounded-full text-xs font-medium text-center transition-all ${
                    category === cat
                      ? 'bg-[#FF2D20] text-white'
                      : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Caption / Notes */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              Caption / Posing & Lighting Notes *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Turn shoulders 45 degrees, chin slightly down, key light placed high right..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] resize-none"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="pulsar-section-label block mb-1.5">
              External Reference URL (Pinterest, Behance, Dropbox)
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://pinterest.com/pin/..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full pl-9 pr-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>
          </div>

          {/* Color Palette Swatches */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="pulsar-section-label flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#FF2D20]" />
                <span>Color Palette Swatches</span>
              </label>
              <span className="text-[10px] text-[#8E8E93] font-mono">Pick hex colors</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {colors.map((hex, idx) => (
                <div
                  key={idx}
                  className="p-1.5 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] flex items-center gap-1.5 px-2"
                >
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-none p-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => handleColorChange(idx, e.target.value)}
                    className="w-full text-[11px] font-mono uppercase bg-transparent text-black dark:text-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              id="moodboard-submit-btn"
              type="submit"
              disabled={!imageUrl.trim()}
              className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] disabled:opacity-40 text-white transition-all"
            >
              Add to Moodboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
