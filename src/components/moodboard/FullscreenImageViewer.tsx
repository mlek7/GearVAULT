import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink, ZoomIn, ZoomOut, Palette, Share2, Check } from 'lucide-react';
import { MoodboardItem } from '../../types';

interface FullscreenImageViewerProps {
  items: MoodboardItem[];
  initialIndex: number;
  onClose: () => void;
}

export const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({
  items,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const activeItem = items[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length]);

  if (!activeItem) return null;

  const handlePrev = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = () => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  const handleCopyLink = () => {
    if (activeItem.externalLink) {
      navigator.clipboard.writeText(activeItem.externalLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div
      id="fullscreen-moodboard-viewer"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between select-none animate-in fade-in duration-200"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-black/80 z-20 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-white">
          <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#1E1E1E] text-[#FF2D20] border border-white/[0.08]">
            {currentIndex + 1} / {items.length}
          </span>
          {activeItem.category && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-white bg-white/10 px-2.5 py-0.5 rounded-full border border-white/[0.08]">
              {activeItem.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
            title={isZoomed ? 'Zoom Out' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>

          {/* External link if available */}
          {activeItem.externalLink && (
            <a
              href={activeItem.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-[#8E8E93] hover:text-[#FF2D20] hover:bg-white/10 transition-colors inline-flex items-center gap-1"
              title="Open External Reference"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}

          {/* Close */}
          <button
            id="btn-close-fullscreen-viewer"
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-3 sm:p-6">
        {/* Prev button */}
        {items.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-[#121212]/90 hover:bg-[#262626] text-white border border-white/[0.08] transition-all active:scale-95 shadow-xl"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Center image */}
        <div
          className={`relative max-h-full max-w-full flex items-center justify-center transition-transform duration-300 cursor-zoom-in ${
            isZoomed ? 'scale-150 overflow-auto' : 'scale-100'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={activeItem.imageUrl}
            alt={activeItem.caption}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Next button */}
        {items.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-[#121212]/90 hover:bg-[#262626] text-white border border-white/[0.08] transition-all active:scale-95 shadow-xl"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Info Overlay */}
      <div className="bg-gradient-to-t from-black via-black/90 to-transparent p-5 sm:p-6 z-20 space-y-3">
        <div className="max-w-xl mx-auto">
          <p className="text-sm sm:text-base text-white font-normal leading-relaxed">
            {activeItem.caption}
          </p>

          {/* Color Palette Swatches */}
          {activeItem.colorPalette && activeItem.colorPalette.length > 0 && (
            <div className="flex items-center gap-2.5 mt-3 pt-2.5 border-t border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#8E8E93] flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-[#FF2D20]" />
                <span>Harmony:</span>
              </span>
              <div className="flex items-center gap-2">
                {activeItem.colorPalette.map((hex, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                    <span className="text-[10px] font-mono text-[#8E8E93] uppercase">
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External link reference footer */}
          {activeItem.externalLink && (
            <div className="mt-2.5 text-xs flex items-center gap-2 text-[#8E8E93]">
              <span className="truncate font-mono text-[11px]">Ref: {activeItem.externalLink}</span>
              <button
                onClick={handleCopyLink}
                className="text-[#FF2D20] hover:underline shrink-0 text-[11px] font-mono uppercase tracking-wider bracket-action"
              >
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
