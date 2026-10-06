import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Camera,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  X,
  Copy,
  Check,
  Edit2,
  Trash2,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GearItem, GearCategory, GEAR_CATEGORIES } from '../../types';
import { GearModal } from './GearModal';
import { ExifToolInspectorModal } from './ExifToolInspectorModal';
import { ExifToolExtractedData } from '../../services/exiftoolService';

interface GearVaultViewProps {
  gear: GearItem[];
  onAddGear: (item: GearItem) => void;
  onUpdateGear: (item: GearItem) => void;
  onDeleteGear: (gearId: string) => void;
}

export const GearVaultView: React.FC<GearVaultViewProps> = ({
  gear,
  onAddGear,
  onUpdateGear,
  onDeleteGear,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isExifScannerOpen, setIsExifScannerOpen] = useState(false);
  const [inspectedExifData, setInspectedExifData] = useState<ExifToolExtractedData | null>(null);

  // Detail Sheet state
  const [detailItem, setDetailItem] = useState<GearItem | null>(null);
  // Quick action menu state (item id -> boolean)
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  // Copied serial feedback
  const [copiedSerial, setCopiedSerial] = useState(false);
  // Delete confirm dialog
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<GearItem | null>(null);

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleCopySerial = (serial: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(serial);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleInspectItemExif = (item: GearItem) => {
    if (!item.exifMetadata) return;
    const meta = item.exifMetadata;
    const extracted: ExifToolExtractedData = {
      make: meta.cameraMake || item.brand,
      model: meta.cameraModel || item.name,
      lensModel: meta.lensModel,
      bodySerialNumber: meta.bodySerialNumber || item.serialNumber,
      lensSerialNumber: meta.lensSerialNumber,
      shutterCount: meta.shutterCount,
      software: meta.firmwareVersion,
      focalLength: meta.focalLength,
      rawTags: meta.rawTags || {
        'ExifTool:Model': meta.cameraModel || item.name,
        'ExifTool:Make': meta.cameraMake || item.brand,
        'EXIF:SerialNumber': item.serialNumber,
        'MakerNotes:ShutterCount': meta.shutterCount,
        'EXIF:Software': meta.firmwareVersion,
      },
      suggestedGear: {
        camera:
          item.category === 'Camera Body'
            ? {
                name: item.name,
                brand: item.brand || 'Camera',
                category: 'Camera Body',
                serialNumber: item.serialNumber,
                notes: item.notes,
              }
            : undefined,
        lens:
          item.category === 'Lens'
            ? {
                name: item.name,
                brand: item.brand || 'Optics',
                category: 'Lens',
                serialNumber: item.serialNumber,
                notes: item.notes,
              }
            : undefined,
      },
    };
    setInspectedExifData(extracted);
    setIsExifScannerOpen(true);
  };

  // Filtered gear items
  const filteredGear = useMemo(() => {
    return gear.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [gear, selectedCategory, searchQuery]);

  // Grouped by category
  const groupedGear = useMemo(() => {
    const groups: { category: GearCategory; items: GearItem[] }[] = [];
    GEAR_CATEGORIES.forEach((cat) => {
      if (selectedCategory === 'All' || selectedCategory === cat) {
        const items = filteredGear.filter((g) => g.category === cat);
        if (items.length > 0 || (selectedCategory === cat && filteredGear.length === 0)) {
          groups.push({ category: cat, items });
        }
      }
    });
    return groups;
  }, [filteredGear, selectedCategory]);

  return (
    <div id="gear-vault-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header with High-Contrast Titles */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Equipment Inventory • {gear.length} items
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 font-display">
            The Gear Vault
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-exiftool-scanner"
            onClick={() => {
              setInspectedExifData(null);
              setIsExifScannerOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97] transition-all cursor-pointer"
            title="Import metadata from image"
            aria-label="Scan image metadata"
          >
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          {/* Primary Action Button */}
          <button
            id="btn-add-gear"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 min-h-[44px] py-2.5 px-5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Gear</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="gear-vault-search"
          type="text"
          placeholder="Search gear, brand, serial..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-14 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills - Consistent Dark Surface Pills (Requirement 5) */}
      <div className="relative mb-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="filter-cat-all"
            onClick={() => setSelectedCategory('All')}
            className={`shrink-0 px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.97] ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All ({gear.length})
          </button>
          {GEAR_CATEGORIES.map((cat) => {
            const count = gear.filter((g) => g.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                id={`filter-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold transition-all cursor-pointer active:scale-[0.97] ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredGear.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm mt-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">No equipment found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
            {searchQuery
              ? `No gear matched "${searchQuery}". Clear search to view all.`
              : 'Add your camera bodies, lenses, strobes, and accessories to your gear vault.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 min-h-[44px] py-2.5 px-6 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Equipment</span>
          </button>
        </div>
      )}

      {/* Grouped by Category List View */}
      <div className="space-y-4">
        {groupedGear.map(({ category, items }) => {
          const isCollapsed = collapsedCategories[category] || false;
          return (
            <div
              key={category}
              id={`gear-group-${category.replace(/\s+/g, '-').toLowerCase()}`}
              className="rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
            >
              {/* Category Header: Dark surface with clear text, not a light grey band (Requirement 5) */}
              <button
                onClick={() => toggleCategoryCollapse(category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-slate-700 text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300" />
                  <h2 className="text-sm font-semibold tracking-tight">
                    {category}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                    {items.length}
                  </span>
                </div>
                <div className="text-slate-400">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {/* Simplified Items List (Requirement 6): photo, name, brand, shutter count only */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {items.map((item) => {
                    const shutter = item.exifMetadata?.shutterCount;
                    return (
                      <div
                        key={item.id}
                        id={`gear-card-${item.id}`}
                        onClick={() => setDetailItem(item)}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                      >
                        {/* Photo + Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Name + Brand + Shutter Count */}
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.brand && <span>{item.brand}</span>}
                              {item.brand && shutter && <span>•</span>}
                              {shutter ? (
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                  {shutter.toLocaleString()} acts
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Action '...' Menu Button (Min 44x44px tap target) */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === item.id ? null : item.id);
                            }}
                            className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            aria-label="Gear options"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {/* Popover Menu */}
                          {actionMenuId === item.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-11 z-30 w-44 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs animate-in fade-in"
                            >
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setDetailItem(item);
                                }}
                                className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                <span>View Details</span>
                              </button>
                              {item.exifMetadata && (
                                <button
                                  onClick={() => {
                                    setActionMenuId(null);
                                    handleInspectItemExif(item);
                                  }}
                                  className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2 cursor-pointer"
                                >
                                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Exif Metadata</span>
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setEditingItem(item);
                                  setIsModalOpen(true);
                                }}
                                className="w-full px-3.5 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>Edit Equipment</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuId(null);
                                  setDeleteConfirmItem(item);
                                }}
                                className="w-full px-3.5 py-2.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Item</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gear Detail Bottom Sheet (Requirement 6: serial, firmware, EXIF verified, notes) */}
      {detailItem && (
        <div
          id="gear-detail-bottom-sheet-backdrop"
          onClick={() => setDetailItem(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
        >
          <div
            id="gear-detail-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-200 dark:border-slate-800 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Grab handle */}
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                  <img
                    src={detailItem.image}
                    alt={detailItem.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {detailItem.category} {detailItem.brand ? `• ${detailItem.brand}` : ''}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                    {detailItem.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setDetailItem(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Specifications list (iOS inset group) */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 text-xs mb-4">
              {/* Serial number */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Serial Number</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {detailItem.serialNumber || 'None'}
                  </span>
                  {detailItem.serialNumber && (
                    <button
                      onClick={(e) => handleCopySerial(detailItem.serialNumber, e)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      title="Copy serial"
                    >
                      {copiedSerial ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Shutter count */}
              {detailItem.exifMetadata?.shutterCount !== undefined && (
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Actuations / Shutter Count</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {detailItem.exifMetadata.shutterCount.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Firmware */}
              {detailItem.exifMetadata?.firmwareVersion && (
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Firmware Version</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {detailItem.exifMetadata.firmwareVersion}
                  </span>
                </div>
              )}

              {/* Lens / Optical Specs */}
              {(detailItem.exifMetadata?.maxAperture || detailItem.exifMetadata?.focalLength) && (
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Optical Specs</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {detailItem.exifMetadata.maxAperture}{' '}
                    {detailItem.exifMetadata.focalLength ? `@ ${detailItem.exifMetadata.focalLength}` : ''}
                  </span>
                </div>
              )}

              {/* EXIF Verified status */}
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Verification</span>
                {detailItem.exifMetadata ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>EXIF Verified</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Manual Entry</span>
                )}
              </div>
            </div>

            {/* Notes */}
            {detailItem.notes && (
              <div className="mb-4">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Item Notes
                </span>
                <p className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {detailItem.notes}
                </p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  const toEdit = detailItem;
                  setDetailItem(null);
                  setEditingItem(toEdit);
                  setIsModalOpen(true);
                }}
                className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.97] transition-all cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-slate-500" />
                <span>Edit Item</span>
              </button>

              <button
                onClick={() => {
                  const toDelete = detailItem;
                  setDetailItem(null);
                  setDeleteConfirmItem(toDelete);
                }}
                className="min-h-[44px] py-2.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-[0.97] transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-2xl text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete "{deleteConfirmItem.name}"?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              This will remove the item from your inventory and any packing lists.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="min-h-[44px] py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold active:scale-[0.97] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteGear(deleteConfirmItem.id);
                  setDeleteConfirmItem(null);
                }}
                className="min-h-[44px] py-2.5 rounded-xl bg-rose-600 text-white text-xs font-semibold active:scale-[0.97] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <GearModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={(item) => {
          if (editingItem) {
            onUpdateGear(item);
          } else {
            onAddGear(item);
          }
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        initialItem={editingItem || undefined}
      />

      <ExifToolInspectorModal
        isOpen={isExifScannerOpen}
        onClose={() => {
          setIsExifScannerOpen(false);
          setInspectedExifData(null);
        }}
        onImportGear={(newGear) => {
          onAddGear(newGear);
          setIsExifScannerOpen(false);
        }}
        initialData={inspectedExifData}
      />
    </div>
  );
};
