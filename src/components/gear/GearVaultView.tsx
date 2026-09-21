import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Copy,
  Check,
  Edit2,
  Trash2,
  Camera,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Cpu,
  ShieldCheck,
  ExternalLink,
  Zap,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isExifScannerOpen, setIsExifScannerOpen] = useState(false);
  const [inspectedExifData, setInspectedExifData] = useState<ExifToolExtractedData | null>(null);

  // Copy serial number
  const handleCopySerial = (serial: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(serial);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D45B5B] font-mono">
              Equipment Inventory
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono">
              {gear.length} items
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5 font-display">
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
            className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors"
            title="Scan camera sample shot using ExifTool"
          >
            <Cpu className="w-3.5 h-3.5 text-[#F29191]" />
            <span>ExifTool</span>
          </button>
          <button
            id="btn-add-gear"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Gear</span>
          </button>
        </div>
      </div>

      {/* ExifTool Equipment Engine Banner */}
      <div className="mb-3.5 p-3.5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-[#F29191] to-[#F7ADAD] text-white shrink-0 shadow-md shadow-[#F29191]/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFBFA]">
                  ExifTool Integration
                </span>
                <a
                  href="https://exiftool.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-mono text-slate-400 hover:text-white inline-flex items-center gap-0.5"
                >
                  <span>exiftool.org</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-xs font-semibold text-slate-200 truncate">
                Scan photo EXIF to auto-detect camera, optics & actuations
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setInspectedExifData(null);
              setIsExifScannerOpen(true);
            }}
            className="shrink-0 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF3E1] text-[11px] font-bold transition-all border border-white/10 inline-flex items-center gap-1.5 active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-[#F29191]" />
            <span>Scan Shot</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3.5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="gear-vault-search"
          type="text"
          placeholder="Search items, serial numbers, brands, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-14 py-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191] transition-colors shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
        <button
          id="filter-cat-all"
          onClick={() => setSelectedCategory('All')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Categories ({gear.length})
        </button>
        {GEAR_CATEGORIES.map((cat) => {
          const count = gear.filter((g) => g.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`filter-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGear.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bright-card mt-4">
          <div className="w-14 h-14 rounded-3xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]/60 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 font-display">No equipment found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
            {searchQuery
              ? `No gear matched "${searchQuery}". Try a different term or clear filters.`
              : 'Add your camera bodies, lenses, strobes, and accessories to your gear database.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add First Equipment</span>
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
              className="rounded-3xl bright-card overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategoryCollapse(category)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors border-b border-slate-100 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD]" />
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight font-display">
                    {category}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
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

              {/* Items List */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      id={`gear-card-${item.id}`}
                      className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-start gap-3.5"
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group shadow-xs">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug font-display">
                            {item.name}
                          </h3>
                        </div>

                        {/* Brand badge & Serial Number */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.brand && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                              {item.brand}
                            </span>
                          )}

                          {item.serialNumber && (
                            <button
                              onClick={(e) => handleCopySerial(item.serialNumber, item.id, e)}
                              className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 hover:text-[#D45B5B] transition-colors bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"
                              title="Click to copy serial number"
                            >
                              {copiedId === item.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 text-[10px] font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 text-slate-400" />
                                  <span>{item.serialNumber}</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* ExifTool Verified Badges */}
                          {item.exifMetadata && (
                            <>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>ExifTool Verified</span>
                              </span>

                              {item.exifMetadata.shutterCount && (
                                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                                  {item.exifMetadata.shutterCount.toLocaleString()} acts
                                </span>
                              )}

                              {item.exifMetadata.firmwareVersion && (
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {item.exifMetadata.firmwareVersion}
                                </span>
                              )}

                              {(item.exifMetadata.maxAperture || item.exifMetadata.focalLength) && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-semibold">
                                  {item.exifMetadata.maxAperture}{' '}
                                  {item.exifMetadata.focalLength ? `@ ${item.exifMetadata.focalLength}` : ''}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            {item.notes}
                          </p>
                        )}

                        {/* Quick actions */}
                        <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-slate-100">
                          {item.exifMetadata && (
                            <button
                              id={`btn-exif-tags-${item.id}`}
                              onClick={() => handleInspectItemExif(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-700 transition-colors"
                              title="Inspect raw ExifTool metadata tags"
                            >
                              <Cpu className="w-3 h-3 text-emerald-600" />
                              <span>Exif Tags</span>
                            </button>
                          )}

                          <button
                            id={`btn-edit-gear-${item.id}`}
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#D45B5B] transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            id={`btn-delete-gear-${item.id}`}
                            onClick={() => {
                              if (confirm(`Remove "${item.name}" from your Gear Vault?`)) {
                                onDeleteGear(item.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
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
        }}
        initialItem={editingItem}
      />

      {/* ExifTool Inspector / Scanner Modal */}
      <ExifToolInspectorModal
        isOpen={isExifScannerOpen}
        onClose={() => {
          setIsExifScannerOpen(false);
          setInspectedExifData(null);
        }}
        initialData={inspectedExifData}
        mode="vault_scanner"
        onImportGear={(newGear) => {
          onAddGear(newGear);
        }}
        onImportBoth={(cam, lens) => {
          onAddGear(cam);
          onAddGear(lens);
        }}
      />
    </div>
  );
};
