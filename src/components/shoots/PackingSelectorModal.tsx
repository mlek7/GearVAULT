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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Select Gear from Vault
            </h3>
            <p className="text-[11px] text-slate-500">
              Added gear automatically defaults to &quot;Needed&quot; status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category filter */}
        <div className="p-4.5 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gear inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All ({gearList.length})
            </button>
            {GEAR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Selection bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 flex items-center justify-between border-b border-slate-200 text-xs">
          <span className="text-slate-600 font-medium">
            <strong className="text-slate-900">{selectedIds.size}</strong> item(s) selected
          </span>
          <button
            onClick={selectAllAvailable}
            className="text-[#D45B5B] hover:underline font-bold text-xs"
          >
            Select All Available
          </button>
        </div>

        {/* List of Gear */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-none divide-y divide-slate-100">
          {filteredGear.map((item) => {
            const isAlreadyAdded = existingGearIds.includes(item.id);
            const isSelected = selectedIds.has(item.id);

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (!isAlreadyAdded) toggleSelect(item.id);
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  isAlreadyAdded
                    ? 'opacity-40 cursor-not-allowed bg-slate-100'
                    : isSelected
                    ? 'bg-[#FFF0F0] border border-[#F7ADAD] cursor-pointer shadow-xs'
                    : 'hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {/* Selection indicator */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                    isAlreadyAdded
                      ? 'bg-slate-200 border-slate-300 text-slate-400'
                      : isSelected
                      ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] border-[#F29191] text-white'
                      : 'border-slate-300 hover:border-[#F29191]'
                  }`}
                >
                  {isAlreadyAdded ? (
                    <Check className="w-3 h-3" />
                  ) : isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : null}
                </div>

                {/* Thumb */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-xs">
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
                    <span className="text-[10px] uppercase font-bold text-[#D45B5B] tracking-wider font-mono">
                      {item.category}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                        In Shoot
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate font-display">
                    {item.name}
                  </h4>
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {filteredGear.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              No gear found matching your filter
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-add-to-packing"
            disabled={selectedIds.size === 0}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#F29191] to-[#F7ADAD] disabled:opacity-40 disabled:pointer-events-none text-white shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all"
          >
            Add {selectedIds.size > 0 ? `${selectedIds.size} Items` : 'Items'} (Status: Needed)
          </button>
        </div>
      </div>
    </div>
  );
};
