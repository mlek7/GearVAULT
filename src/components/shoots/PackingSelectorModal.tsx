import React, { useState } from 'react';
import { X, Search, Check, Plus, Camera, Layers } from 'lucide-react';
import { GearItem, GearCategory, GEAR_CATEGORIES } from '../../types';

interface PackingSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gearList: GearItem[];
  existingGearIds: string[];
  onAddGearItems: (gearIds: string[]) => void;
}

export const PackingSelectorModal: React.FC<PackingSelectorModalProps> = ({
  isOpen,
  onClose,
  gearList,
  existingGearIds,
  onAddGearItems,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | 'All'>('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllAvailable = () => {
    const available = filteredGear.filter((g) => !existingGearIds.includes(g.id));
    setSelectedIds(new Set(available.map((g) => g.id)));
  };

  const handleConfirm = () => {
    if (selectedIds.size > 0) {
      onAddGearItems(Array.from(selectedIds));
      setSelectedIds(new Set());
      onClose();
    }
  };

  const filteredGear = gearList.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      (item.brand && item.brand.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  return (
    <div
      id="packing-selector-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40">
          <div>
            <h3 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
              Select Gear from Vault
            </h3>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
              Added gear automatically defaults to &quot;Needed&quot; status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category filter */}
        <div className="p-4.5 border-b border-black/[0.08] dark:border-white/[0.08] space-y-3 bg-[#F2F2F2]/40 dark:bg-[#121212]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E8E93] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gear inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full pl-10 pr-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === 'All'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              All ({gearList.length})
            </button>
            {GEAR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#FF2D20] text-white'
                    : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selection bar */}
        <div className="px-5 py-2.5 bg-[#EBEBEB]/70 dark:bg-[#1E1E1E]/60 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] text-xs">
          <span className="text-[#6E6E73] dark:text-[#8E8E93] font-medium font-mono text-[11px]">
            <strong className="text-black dark:text-white">{selectedIds.size}</strong> item(s) selected
          </span>
          <button
            onClick={selectAllAvailable}
            className="pulsar-bracket-btn"
          >
            SELECT ALL AVAILABLE
          </button>
        </div>

        {/* List of Gear */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-none">
          {filteredGear.map((item) => {
            const isAlreadyAdded = existingGearIds.includes(item.id);
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isAlreadyAdded) toggleSelect(item.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-[18px] transition-all ${
                  isAlreadyAdded
                    ? 'opacity-40 cursor-not-allowed bg-[#EBEBEB]/40 dark:bg-[#1E1E1E]/40'
                    : isSelected
                    ? 'bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-[#FF2D20]/40 cursor-pointer'
                    : 'hover:bg-[#EBEBEB]/60 dark:hover:bg-[#1E1E1E]/60 cursor-pointer border border-transparent'
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isAlreadyAdded
                      ? 'bg-black/10 dark:bg-white/10 border-black/20 dark:border-white/20 text-[#8E8E93]'
                      : isSelected
                      ? 'bg-[#FF2D20] border-[#FF2D20] text-white'
                      : 'border-black/20 dark:border-white/20 hover:border-[#FF2D20]'
                  }`}
                >
                  {isAlreadyAdded ? (
                    <Check className="w-3 h-3" />
                  ) : isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : null}
                </div>

                {/* Thumb */}
                <div className="w-12 h-12 rounded-[14px] bg-[#FFFFFF] dark:bg-[#121212] overflow-hidden shrink-0 border border-black/[0.08] dark:border-white/[0.08]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="pulsar-tag text-[10px]">
                      {item.category}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-[9px] bg-black/10 dark:bg-white/10 text-[#6E6E73] dark:text-[#8E8E93] px-2 py-0.5 rounded-full font-mono">
                        IN SHOOT
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-black dark:text-white truncate mt-1">
                    {item.name}
                  </h4>
                  {item.notes && (
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] truncate mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {filteredGear.length === 0 && (
            <div className="text-center py-8 text-[#8E8E93] text-xs font-mono">
              No gear found matching your filter
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-add-to-packing"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] disabled:opacity-40 disabled:pointer-events-none text-white transition-all"
          >
            Add {selectedIds.size > 0 ? `${selectedIds.size} Items` : 'Items'} (Status: Needed)
          </button>
        </div>
      </div>
    </div>
  );
};
