import React, { useState, useMemo } from 'react';
import { Plus, Palette, ExternalLink, Trash2, Image as ImageIcon, Sparkles, Filter } from 'lucide-react';
import { Shoot, MoodboardItem } from '../../types';
import { MoodboardModal } from './MoodboardModal';
import { FullscreenImageViewer } from './FullscreenImageViewer';

interface MoodboardsViewProps {
  shoots: Shoot[];
  moodboards: MoodboardItem[];
  onAddMoodboardItem: (item: MoodboardItem) => void;
  onDeleteMoodboardItem: (id: string) => void;
  onOpenShoot?: (shootId: string) => void;
}

export const MoodboardsView: React.FC<MoodboardsViewProps> = ({
  shoots,
  moodboards,
  onAddMoodboardItem,
  onDeleteMoodboardItem,
  onOpenShoot,
}) => {
  const [selectedShootId, setSelectedShootId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  // Map shoot IDs to shoot titles for badges
  const shootMap = useMemo(() => new Map(shoots.map((s) => [s.id, s])), [shoots]);

  const filteredItems = useMemo(() => {
    if (selectedShootId === 'all') return moodboards;
    return moodboards.filter((m) => m.shootId === selectedShootId);
  }, [moodboards, selectedShootId]);

  const defaultShootId = selectedShootId !== 'all' ? selectedShootId : shoots[0]?.id || 'general';

  return (
    <div id="moodboards-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93]">
            Visual direction & styling
          </span>
          <h1 className="text-2xl font-normal tracking-[-0.03em] text-black dark:text-white mt-0.5">
            Moodboards
          </h1>
        </div>

        <button
          id="btn-add-moodboard-image"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 min-h-[44px] py-2.5 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Image</span>
        </button>
      </div>

      {/* Shoot Filter Pills */}
      <div className="relative mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pr-6">
          <button
            onClick={() => setSelectedShootId('all')}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selectedShootId === 'all'
                ? 'bg-black dark:bg-[#3A3A3C] text-white'
                : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
            }`}
          >
            All References ({moodboards.length})
          </button>

          {shoots.map((shoot) => {
            const count = moodboards.filter((m) => m.shootId === shoot.id).length;
            const isSelected = selectedShootId === shoot.id;
            return (
              <button
                key={shoot.id}
                onClick={() => setSelectedShootId(shoot.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer truncate max-w-[200px] ${
                  isSelected
                    ? 'bg-[#FF2D20] text-white'
                    : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                {shoot.title} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Moodboard Grid - 8px gaps and black background for cinematic feel */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-[28px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="w-14 h-14 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20] flex items-center justify-center mx-auto mb-3">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-base font-normal tracking-[-0.03em] text-black dark:text-white">
            No moodboard images yet
          </h3>
          <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
            Curate visual references, poses, lighting set-ups, and color grading inspirations for your shoots.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Image</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-black p-2 rounded-[28px]">
          {filteredItems.map((item, index) => {
            const parentShoot = shootMap.get(item.shootId);

            return (
              <div
                key={item.id}
                className="group relative rounded-[20px] overflow-hidden bg-[#FFFFFF] dark:bg-[#121212] transition-all duration-200 flex flex-col"
              >
                {/* Image Thumbnail - 20px radius, no border */}
                <div
                  onClick={() => setFullscreenIndex(index)}
                  className="aspect-4/3 w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] overflow-hidden relative cursor-pointer rounded-[20px]"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.caption || 'Moodboard inspiration'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-[20px]"
                    referrerPolicy="no-referrer"
                  />

                  {/* Category Pill */}
                  {item.category && (
                    <span className="absolute top-2 left-2 text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-black/75 text-white backdrop-blur-xs">
                      {item.category}
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Remove this moodboard reference image?')) {
                        onDeleteMoodboardItem(item.id);
                      }
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/75 hover:bg-[#FF2D20] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Delete image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    {parentShoot && (
                      <button
                        type="button"
                        onClick={() => onOpenShoot && onOpenShoot(parentShoot.id)}
                        className="text-[10px] font-mono text-[#FF2D20] hover:underline truncate cursor-pointer text-left block w-full uppercase tracking-wider"
                      >
                        {parentShoot.title}
                      </button>
                    )}
                    <p className="text-xs text-black dark:text-white font-normal line-clamp-2 mt-0.5">
                      {item.caption || 'Reference visual'}
                    </p>
                  </div>

                  {/* Color Palette Dots */}
                  {item.colorPalette && item.colorPalette.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      {item.colorPalette.slice(0, 4).map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Moodboard Add Modal */}
      <MoodboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        shootId={defaultShootId}
        onAddMoodboardItem={onAddMoodboardItem}
      />

      {/* Fullscreen Viewer */}
      {fullscreenIndex !== null && (
        <FullscreenImageViewer
          items={filteredItems}
          initialIndex={fullscreenIndex}
          onClose={() => setFullscreenIndex(null)}
        />
      )}
    </div>
  );
};
