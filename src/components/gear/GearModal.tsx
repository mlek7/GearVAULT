import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  Layers,
  Search,
  Loader2,
  ExternalLink,
  ChevronLeft,
  Check,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Sun,
  Mic,
  Monitor,
  Compass,
  RotateCw,
  Navigation,
} from 'lucide-react';
import {
  GearItem,
  GearCategory,
  GEAR_CATEGORIES,
  GearExifMetadata,
  GearSpecs,
  GearDbSearchResult,
} from '../../types';

interface GearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: GearItem) => void;
  initialItem?: GearItem | null;
}

const GEAR_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'camera', label: 'Cameras' },
  { id: 'lens', label: 'Lenses' },
  { id: 'light', label: 'Lights' },
  { id: 'audio', label: 'Audio' },
  { id: 'monitor', label: 'Monitors' },
  { id: 'tripod', label: 'Tripods' },
  { id: 'gimbal', label: 'Gimbals' },
  { id: 'drone', label: 'Drones' },
] as const;

type GearChipId = (typeof GEAR_CHIPS)[number]['id'];

const POPULAR_SEARCHES = [
  'Sony FX3',
  'Canon 24-70',
  'Aputure 600d',
  'DJI Mic 2',
  'Ninja V',
  'DJI RS 4',
  'Mini 4 Pro',
  'Peak Design Tripod',
];

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Camera Body': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  'Lens': 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80',
  'Lighting': 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=600&q=80',
  'Audio': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80',
  'Monitor': 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=600&q=80',
  'Tripod': 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=600&q=80',
  'Gimbal': 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
  'Drone': 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=600&q=80',
  'Accessories': 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=600&q=80',
};

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
    label: 'Carbon Tripod',
    url: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?auto=format&fit=crop&w=600&q=80',
    category: 'Accessories',
  },
];

function getCategoryIcon(cat: GearCategory | string, className = 'w-4 h-4 text-[#8E8E93]') {
  switch (cat) {
    case 'Camera Body':
    case 'camera':
      return <Camera className={className} />;
    case 'Lens':
    case 'lens':
      return <Layers className={className} />;
    case 'Lighting':
    case 'light':
      return <Sun className={className} />;
    case 'Audio':
    case 'audio':
      return <Mic className={className} />;
    case 'Monitor':
    case 'monitor':
      return <Monitor className={className} />;
    case 'Tripod':
    case 'tripod':
      return <Compass className={className} />;
    case 'Gimbal':
    case 'gimbal':
      return <RotateCw className={className} />;
    case 'Drone':
    case 'drone':
      return <Navigation className={className} />;
    default:
      return <Camera className={className} />;
  }
}

function getSearchResultMetaLine(item: GearDbSearchResult): string {
  if (item.source === 'cined') {
    if (item.type === 'camera') {
      return (
        [
          item.sensor,
          item.mounts?.length ? `${item.mounts.join('/')} mount` : null,
          item.weightG ? `${item.weightG}g` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Camera Body'
      );
    } else {
      return (
        [
          item.focalLength,
          item.aperture,
          item.mounts?.length ? `${item.mounts.join('/')} mount` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'Optical Lens'
      );
    }
  } else {
    // Lightbag DB
    const parts: string[] = [];
    if (item.subcategory) parts.push(item.subcategory);
    if (item.keySpecs) {
      if (item.keySpecs.power) parts.push(String(item.keySpecs.power));
      if (item.keySpecs.cct) parts.push(String(item.keySpecs.cct));
      if (item.keySpecs.type && !item.subcategory) parts.push(String(item.keySpecs.type));
      if (item.keySpecs.screenSize) parts.push(String(item.keySpecs.screenSize));
      if (item.keySpecs.maxPayload) parts.push(`Payload: ${item.keySpecs.maxPayload}`);
      if (item.keySpecs.maxFlightTime) parts.push(String(item.keySpecs.maxFlightTime));
      if (item.keySpecs.polarPattern) parts.push(String(item.keySpecs.polarPattern));
    }
    if (item.weight) parts.push(String(item.weight));
    return parts.filter(Boolean).slice(0, 3).join(' · ') || item.category;
  }
}

export const GearModal: React.FC<GearModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const isEditing = !!initialItem;

  // Unified Gear Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<GearChipId>('all');
  const [searchResults, setSearchResults] = useState<GearDbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedGearItem, setSelectedGearItem] = useState<GearDbSearchResult | null>(null);
  const [downloadedPhoto, setDownloadedPhoto] = useState<string>('');
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);

  // Optional personal fields for Add Flow
  const [addSerialNumber, setAddSerialNumber] = useState('');
  const [addPersonalNotes, setAddPersonalNotes] = useState('');

  // Edit Mode States (for editing existing saved gear)
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<GearCategory>('Camera Body');
  const [editBrand, setEditBrand] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editShowPresets, setEditShowPresets] = useState(false);
  const [editExifMetadata, setEditExifMetadata] = useState<GearExifMetadata | undefined>(undefined);
  const [editSpecs, setEditSpecs] = useState<GearSpecs | undefined>(undefined);
  const [editKeySpecs, setEditKeySpecs] = useState<Record<string, any> | undefined>(undefined);
  const [editSource, setEditSource] = useState<'cined' | 'lightbag-db' | 'manual' | 'exif' | undefined>(undefined);
  const [editSourceId, setEditSourceId] = useState<string | undefined>(undefined);
  const [editSourceUrl, setEditSourceUrl] = useState<string | undefined>(undefined);
  const [editOfficialUrl, setEditOfficialUrl] = useState<string | undefined>(undefined);

  // Reset/Initialize modal state
  useEffect(() => {
    if (!isOpen) return;

    if (initialItem) {
      // Initialize edit state
      setEditName(initialItem.name);
      setEditCategory(initialItem.category);
      setEditBrand(initialItem.brand || '');
      setEditSerialNumber(initialItem.serialNumber || '');
      setEditImage(initialItem.image || '');
      setEditNotes(initialItem.notes || '');
      setEditExifMetadata(initialItem.exifMetadata);
      setEditSpecs(initialItem.specs);
      setEditKeySpecs(initialItem.keySpecs);
      setEditSource(initialItem.source);
      setEditSourceId(initialItem.sourceId);
      setEditSourceUrl(initialItem.sourceUrl);
      setEditOfficialUrl(initialItem.officialUrl);
      setEditShowPresets(false);
    } else {
      // Reset Add state
      setSearchQuery('');
      setSearchCategory('all');
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      setSelectedGearItem(null);
      setDownloadedPhoto('');
      setIsDownloadingPhoto(false);
      setAddSerialNumber('');
      setAddPersonalNotes('');
    }
  }, [initialItem, isOpen]);

  // 250ms debounced database search
  useEffect(() => {
    if (isEditing) return;

    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const res = await fetch(
          `/api/gear-db/search?q=${encodeURIComponent(q)}&category=${searchCategory}&limit=20`
        );
        if (!res.ok) {
          throw new Error('Database search failed');
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setSearchResults(data.items);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('Gear database search failed:', err);
        setSearchError('Database unavailable, try a different search');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchCategory, isEditing]);

  if (!isOpen) return null;

  // Handle selecting a search result in Add mode
  const handleSelectGearItem = async (item: GearDbSearchResult) => {
    setSelectedGearItem(item);
    setDownloadedPhoto('');

    // Pre-download photo if available (from CineD proxy or valid URL)
    if (item.imageUrl) {
      setIsDownloadingPhoto(true);
      try {
        const fetchUrl =
          item.source === 'cined'
            ? `/api/gear-db/image?url=${encodeURIComponent(item.imageUrl)}`
            : item.imageUrl;

        const res = await fetch(fetchUrl);
        if (res.ok) {
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setDownloadedPhoto(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        }
      } catch (err) {
        console.warn('Failed to pre-download photo:', err);
      } finally {
        setIsDownloadingPhoto(false);
      }
    }
  };

  // Confirm and Add item to Vault
  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGearItem) return;

    // Build specs summary notes
    const specLines: string[] = [];
    if (selectedGearItem.source === 'cined') {
      if (selectedGearItem.type === 'camera') {
        if (selectedGearItem.sensor) specLines.push(`Sensor: ${selectedGearItem.sensor}`);
        if (selectedGearItem.mounts?.length) specLines.push(`Mount: ${selectedGearItem.mounts.join(', ')}`);
        if (selectedGearItem.weightG) specLines.push(`Weight: ${selectedGearItem.weightG}g`);
        if (selectedGearItem.dimensions) specLines.push(`Dimensions: ${selectedGearItem.dimensions}`);
        if (selectedGearItem.releaseDate) specLines.push(`Released: ${selectedGearItem.releaseDate}`);
      } else {
        if (selectedGearItem.focalLength) specLines.push(`Focal Length: ${selectedGearItem.focalLength}`);
        if (selectedGearItem.aperture) specLines.push(`Max Aperture: ${selectedGearItem.aperture}`);
        if (selectedGearItem.mounts?.length) specLines.push(`Mount: ${selectedGearItem.mounts.join(', ')}`);
        if (selectedGearItem.weightG) specLines.push(`Weight: ${selectedGearItem.weightG}g`);
        if (selectedGearItem.filterThread) specLines.push(`Filter Thread: ${selectedGearItem.filterThread}`);
        if (selectedGearItem.dimensions) specLines.push(`Length: ${selectedGearItem.dimensions}`);
      }
    } else {
      // Lightbag DB
      if (selectedGearItem.subcategory) specLines.push(`Category: ${selectedGearItem.subcategory}`);
      if (selectedGearItem.keySpecs) {
        Object.entries(selectedGearItem.keySpecs).forEach(([k, v]) => {
          const label = k.replace(/([A-Z])/g, ' $1').trim();
          specLines.push(`${label.charAt(0).toUpperCase() + label.slice(1)}: ${v}`);
        });
      }
      if (selectedGearItem.weight) specLines.push(`Weight: ${selectedGearItem.weight}`);
    }

    const headerNote =
      selectedGearItem.source === 'cined'
        ? '-- CineD Specs --'
        : '-- Lightbag Specs --';

    const finalNotes = addPersonalNotes.trim()
      ? `${addPersonalNotes.trim()}\n\n${headerNote}\n${specLines.join('\n')}`
      : specLines.join('\n');

    const defaultFallbackImage =
      CATEGORY_FALLBACK_IMAGES[selectedGearItem.category] ||
      CATEGORY_FALLBACK_IMAGES['Camera Body'];

    const finalImage =
      downloadedPhoto ||
      (selectedGearItem.imageUrl
        ? selectedGearItem.source === 'cined'
          ? `/api/gear-db/image?url=${encodeURIComponent(selectedGearItem.imageUrl)}`
          : selectedGearItem.imageUrl
        : defaultFallbackImage);

    const newItem: GearItem = {
      id: `gear-${Date.now()}`,
      name: selectedGearItem.model,
      category: selectedGearItem.category,
      subcategory: selectedGearItem.subcategory,
      serialNumber: addSerialNumber.trim(),
      image: finalImage,
      notes: finalNotes,
      brand: selectedGearItem.brand,
      createdAt: new Date().toISOString(),
      specs:
        selectedGearItem.source === 'cined'
          ? {
              sensor: selectedGearItem.sensor || null,
              mounts: selectedGearItem.mounts || [],
              focalLength: selectedGearItem.focalLength || null,
              aperture: selectedGearItem.aperture || null,
              weightG: selectedGearItem.weightG || null,
              dimensions: selectedGearItem.dimensions || null,
              filterThread: selectedGearItem.filterThread || null,
              releaseDate: selectedGearItem.releaseDate || null,
            }
          : {
              ...(selectedGearItem.keySpecs || {}),
              weight: selectedGearItem.weight,
              subcategory: selectedGearItem.subcategory,
            },
      keySpecs: selectedGearItem.keySpecs,
      source: selectedGearItem.source,
      sourceId: selectedGearItem.id,
      sourceUrl: selectedGearItem.sourceUrl || selectedGearItem.officialUrl,
      officialUrl: selectedGearItem.officialUrl || selectedGearItem.sourceUrl,
    };

    onSave(newItem);
    onClose();
  };

  // Handle saving edits on an existing gear item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialItem || !editName.trim()) return;

    const updatedItem: GearItem = {
      ...initialItem,
      name: editName.trim(),
      category: editCategory,
      serialNumber: editSerialNumber.trim(),
      image:
        editImage ||
        CATEGORY_FALLBACK_IMAGES[editCategory] ||
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      notes: editNotes.trim(),
      brand: editBrand.trim() || undefined,
      exifMetadata: editExifMetadata,
      specs: editSpecs,
      keySpecs: editKeySpecs,
      source: editSource,
      sourceId: editSourceId,
      sourceUrl: editSourceUrl,
      officialUrl: editOfficialUrl,
    };

    onSave(updatedItem);
    onClose();
  };

  const handleEditFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      id="gear-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        id="gear-modal-content"
        className="w-full max-w-lg bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] rounded-t-[28px] sm:rounded-[28px] max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-[#F2F2F2]/60 dark:bg-[#1E1E1E]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-normal text-black dark:text-white font-sans tracking-tight">
                {isEditing ? 'Edit Equipment' : 'Add Gear'}
              </h2>
              <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                {isEditing
                  ? 'Update serial number, notes & equipment details'
                  : 'Search cameras, lenses, lights, audio and more'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODE 1: ADD GEAR (UNIFIED DATABASE SEARCH ONLY)          */}
        {/* ======================================================== */}
        {!isEditing && (
          <div className="flex-1 overflow-y-auto scrollbar-none flex flex-col">
            {!selectedGearItem ? (
              /* Phase 1: Search & Results */
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                {/* Search Header, Scrollable Chips & Search Bar */}
                <div className="space-y-3">
                  {/* Scrollable Category Chip Row */}
                  <div className="relative">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {GEAR_CHIPS.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setSearchCategory(chip.id)}
                          className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                            searchCategory === chip.id
                              ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                              : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white border border-black/[0.04] dark:border-white/[0.04]'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Input Field */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                    <input
                      id="cined-gear-search"
                      type="text"
                      autoFocus
                      placeholder="Search cameras, lenses, lights, audio, gimbals..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full pl-9.5 pr-8 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] transition-colors"
                    />
                    {isSearching ? (
                      <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FF2D20] animate-spin" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#8E8E93] hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Search Body State */}
                <div className="flex-1 min-h-[260px] flex flex-col justify-start">
                  {searchError ? (
                    <div className="p-8 text-center rounded-[20px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 my-auto">
                      {searchError}
                    </div>
                  ) : isSearching ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-2.5 text-xs text-[#8E8E93] my-auto">
                      <Loader2 className="w-6 h-6 animate-spin text-[#FF2D20]" />
                      <span>Searching gear database...</span>
                    </div>
                  ) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
                    /* Friendly Empty State */
                    <div className="p-8 text-center rounded-[24px] bg-[#EBEBEB]/50 dark:bg-[#1E1E1E]/50 border border-black/[0.06] dark:border-white/[0.06] my-auto">
                      <div className="w-12 h-12 rounded-full bg-black/5 dark:bg-white/5 text-[#8E8E93] flex items-center justify-center mx-auto mb-3">
                        <Search className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-medium text-black dark:text-white mb-1.5">
                        No matches in the database — try a different search
                      </h4>
                      <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-xs mx-auto leading-relaxed">
                        Try searching by brand (Sony, Aputure, DJI, Rode, Atomos, Manfrotto) or model name.
                      </p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    /* Results List */
                    <div className="flex-1 flex flex-col rounded-[20px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
                      <div className="max-h-[360px] overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04] scrollbar-none flex-1">
                        {searchResults.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectGearItem(item)}
                            className="w-full min-h-[44px] px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-black/[0.05] dark:hover:bg-white/[0.05] active:bg-black/[0.08] dark:active:bg-white/[0.08] transition-colors cursor-pointer group"
                          >
                            {/* Thumbnail */}
                            <div className="w-10 h-10 rounded-[10px] bg-white dark:bg-[#121212] flex items-center justify-center shrink-0 overflow-hidden border border-black/[0.06] dark:border-white/[0.06]">
                              {item.imageUrl ? (
                                <img
                                  src={
                                    item.source === 'cined'
                                      ? `/api/gear-db/image?url=${encodeURIComponent(item.imageUrl)}`
                                      : item.imageUrl
                                  }
                                  alt={item.model}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              ) : (
                                getCategoryIcon(item.category)
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-black dark:text-white truncate">
                                  {item.model}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#6E6E73] dark:text-[#8E8E93] font-mono shrink-0">
                                  {item.brand}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF2D20]/10 text-[#FF2D20] font-mono shrink-0">
                                  {item.category}
                                </span>
                              </div>
                              {/* Mono meta line */}
                              <p className="text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93] truncate mt-0.5">
                                {getSearchResultMetaLine(item)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Results Attribution Bar */}
                      <div className="px-4 py-2 bg-black/[0.03] dark:bg-white/[0.03] border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
                        <span>
                          {searchCategory === 'camera' || searchCategory === 'lens'
                            ? 'Data: CineD Camera & Lens Database'
                            : searchCategory === 'all'
                            ? 'Data: CineD & Lightbag Databases'
                            : 'Data: Lightbag Gear Database'}
                        </span>
                        <span>{searchResults.length} matches</span>
                      </div>
                    </div>
                  ) : (
                    /* Initial Prompt / Popular Tags */
                    <div className="p-6 rounded-[24px] bg-[#EBEBEB]/50 dark:bg-[#1E1E1E]/50 border border-black/[0.06] dark:border-white/[0.06] text-center my-auto">
                      <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 text-[#FF2D20] flex items-center justify-center mx-auto mb-2.5">
                        <Search className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-black dark:text-white mb-1">
                        Search verified gear across cameras, lights, audio & accessories
                      </p>
                      <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mb-3.5">
                        Tap any popular item to look up specifications:
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {POPULAR_SEARCHES.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setSearchQuery(tag)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white dark:bg-[#1E1E1E] text-black dark:text-white border border-black/[0.08] dark:border-white/[0.08] hover:border-[#FF2D20] active:scale-[0.97] transition-all cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] text-[10px] font-mono text-[#8E8E93]">
                        Data: CineD Database (Cameras/Lenses) & Lightbag Database (Lighting/Audio/Accessories)
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Cancel */}
                <div className="pt-2 flex items-center justify-end border-t border-black/[0.08] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Phase 2: Read-Only Selected Item Preview & Confirm */
              <form onSubmit={handleConfirmAdd} className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Back to search button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedGearItem(null)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back to search results</span>
                    </button>
                    <span className="text-[10px] font-mono uppercase tracking-[0.08em] px-2 py-0.5 rounded-full bg-emerald-500/10 text-[#30D158] border border-emerald-500/20">
                      {selectedGearItem.source === 'cined' ? 'Verified CineD Record' : 'Lightbag Database'}
                    </span>
                  </div>

                  {/* Read-Only Product Preview Card */}
                  <div className="p-4 rounded-[22px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] space-y-3.5">
                    <div className="flex items-start gap-3.5">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-[14px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center">
                        {downloadedPhoto ? (
                          <img
                            src={downloadedPhoto}
                            alt={selectedGearItem.model}
                            className="w-full h-full object-cover"
                          />
                        ) : selectedGearItem.imageUrl ? (
                          <img
                            src={
                              selectedGearItem.source === 'cined'
                                ? `/api/gear-db/image?url=${encodeURIComponent(selectedGearItem.imageUrl)}`
                                : selectedGearItem.imageUrl
                            }
                            alt={selectedGearItem.model}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getCategoryIcon(selectedGearItem.category, 'w-7 h-7 text-[#8E8E93]')
                        )}
                      </div>

                      {/* Header details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
                            {selectedGearItem.brand}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[#FF2D20]/10 text-[11px] font-mono text-[#FF2D20]">
                            {selectedGearItem.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-black dark:text-white tracking-tight truncate">
                          {selectedGearItem.model}
                        </h3>
                        {selectedGearItem.source === 'cined' && selectedGearItem.sourceUrl ? (
                          <a
                            href={selectedGearItem.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FF2D20] hover:underline mt-1"
                          >
                            <span>View on CineD database</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (selectedGearItem.officialUrl || selectedGearItem.sourceUrl) ? (
                          <a
                            href={selectedGearItem.officialUrl || selectedGearItem.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#FF2D20] hover:underline mt-1"
                          >
                            <span>Official product page</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    {/* Key Specs Read-Only Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                      {selectedGearItem.source === 'cined' ? (
                        selectedGearItem.type === 'camera' ? (
                          <>
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                SENSOR
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {selectedGearItem.sensor || 'Standard'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                LENS MOUNT
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {selectedGearItem.mounts?.join(', ') || 'Native'}
                              </span>
                            </div>
                            {selectedGearItem.weightG && (
                              <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                  WEIGHT
                                </span>
                                <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                  {selectedGearItem.weightG} g
                                </span>
                              </div>
                            )}
                            {selectedGearItem.releaseDate && (
                              <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                  RELEASE DATE
                                </span>
                                <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                  {selectedGearItem.releaseDate}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                FOCAL LENGTH
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {selectedGearItem.focalLength || 'Fixed'}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                MAX APERTURE
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {selectedGearItem.aperture || 'N/A'}
                              </span>
                            </div>
                            {selectedGearItem.mounts && selectedGearItem.mounts.length > 0 && (
                              <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                  MOUNT
                                </span>
                                <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                  {selectedGearItem.mounts.join(', ')}
                                </span>
                              </div>
                            )}
                            {selectedGearItem.filterThread && (
                              <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                                <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                  FILTER THREAD
                                </span>
                                <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                  {selectedGearItem.filterThread}
                                </span>
                              </div>
                            )}
                          </>
                        )
                      ) : (
                        /* Lightbag DB Specs Grid */
                        <>
                          {selectedGearItem.subcategory && (
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                TYPE
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {selectedGearItem.subcategory}
                              </span>
                            </div>
                          )}
                          {selectedGearItem.weight && (
                            <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]">
                              <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] block">
                                WEIGHT
                              </span>
                              <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                {String(selectedGearItem.weight)}
                              </span>
                            </div>
                          )}
                          {selectedGearItem.keySpecs &&
                            Object.entries(selectedGearItem.keySpecs).map(([key, val]) => (
                              <div
                                key={key}
                                className="p-2.5 rounded-[12px] bg-white dark:bg-[#121212] border border-black/[0.04] dark:border-white/[0.04]"
                              >
                                <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#8E8E93] uppercase block truncate">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span className="text-xs font-medium text-black dark:text-white truncate block mt-0.5">
                                  {String(val)}
                                </span>
                              </div>
                            ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Optional Personal Fields */}
                  <div className="space-y-3 pt-1">
                    <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block">
                      Personal Inventory Details (Optional)
                    </span>

                    {/* Serial Number */}
                    <div>
                      <label className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] block mb-1">
                        Unit Serial Number
                      </label>
                      <input
                        id="add-cined-serial"
                        type="text"
                        placeholder="e.g., SN-8823901"
                        value={addSerialNumber}
                        onChange={(e) => setAddSerialNumber(e.target.value)}
                        className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[16px] px-3.5 py-2.5 text-xs text-black dark:text-white font-mono placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                      />
                    </div>

                    {/* Personal Notes / Condition */}
                    <div>
                      <label className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] block mb-1">
                        Personal Notes / Unit Condition
                      </label>
                      <textarea
                        id="add-cined-notes"
                        rows={2}
                        placeholder="e.g., Mint condition, purchased 2024, backup kit..."
                        value={addPersonalNotes}
                        onChange={(e) => setAddPersonalNotes(e.target.value)}
                        className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[16px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Confirm Actions */}
                <div className="pt-3 flex items-center justify-between border-t border-black/[0.08] dark:border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setSelectedGearItem(null)}
                    className="px-4 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Change Selection
                  </button>

                  <button
                    id="gear-submit-btn"
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] text-white active:scale-[0.97] transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Vault</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODE 2: EDIT EXISTING SAVED GEAR                         */}
        {/* ======================================================== */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-none">
            {/* Equipment Name */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block mb-1.5">
                Item Name *
              </label>
              <input
                id="gear-input-name"
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-4 py-3 text-sm text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
              />
            </div>

            {/* Category Select Pills */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GEAR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditCategory(cat)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all text-center truncate cursor-pointer ${
                      editCategory === cat
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
                <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block mb-1.5">
                  Brand / Make
                </label>
                <input
                  id="gear-input-brand"
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block mb-1.5">
                  Serial Number
                </label>
                <input
                  id="gear-input-serial"
                  type="text"
                  value={editSerialNumber}
                  onChange={(e) => setEditSerialNumber(e.target.value)}
                  className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white font-mono placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                />
              </div>
            </div>

            {/* Image Upload & Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93]">
                  Photo Thumbnail
                </label>
                <button
                  type="button"
                  onClick={() => setEditShowPresets(!editShowPresets)}
                  className="pulsar-bracket-btn"
                >
                  <Sparkles className="w-3 h-3 text-[#FF2D20]" />
                  <span>{editShowPresets ? 'HIDE PRESETS' : 'PRESETS'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-[14px] bg-[#FFFFFF] dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shrink-0 flex items-center justify-center">
                  {editImage ? (
                    <img
                      src={editImage}
                      alt="Gear preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#8E8E93]" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    id="gear-input-image-url"
                    type="url"
                    placeholder="Image URL (https://...)"
                    value={editImage}
                    onChange={(e) => setEditImage(e.target.value)}
                    className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-full px-4 py-2 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20]"
                  />

                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white rounded-full text-xs font-medium cursor-pointer transition-colors border border-black/[0.08] dark:border-white/[0.08]">
                    <Upload className="w-3.5 h-3.5 text-[#FF2D20]" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Presets Gallery for Editing */}
              {editShowPresets && (
                <div className="mt-3 p-3 bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[20px]">
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#8E8E93] mb-2 font-mono">
                    Select preset photo:
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setEditImage(preset.url);
                          setEditShowPresets(false);
                        }}
                        className="aspect-square rounded-[10px] overflow-hidden border border-black/[0.08] dark:border-white/[0.08] hover:border-[#FF2D20] transition-all cursor-pointer"
                        title={preset.label}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-full h-full object-cover"
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
              <label className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#6E6E73] dark:text-[#8E8E93] block mb-1.5">
                Notes & Technical Details
              </label>
              <textarea
                id="gear-input-notes"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] rounded-[18px] px-3.5 py-2.5 text-xs text-black dark:text-white placeholder:text-[#8E8E93] focus:outline-none focus:border-[#FF2D20] resize-none"
              />
            </div>

            {/* Source Badge if item was originally from CineD or Lightbag DB */}
            {editSource && editSource !== 'manual' && editSource !== 'exif' && (
              <div className="p-3 rounded-[16px] bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs">
                <span className="font-mono text-[11px] text-[#6E6E73] dark:text-[#8E8E93]">
                  Source: {editSource === 'cined' ? 'CineD Database' : 'Lightbag Gear Database'}
                </span>
                {(editOfficialUrl || editSourceUrl) && (
                  <a
                    href={editOfficialUrl || editSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-[#FF2D20] hover:underline"
                  >
                    <span>{editSource === 'cined' ? 'View CineD Page' : 'Official Page'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Edit Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-black/[0.08] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-xs font-medium text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="gear-submit-btn"
                type="submit"
                className="px-6 py-2.5 rounded-full text-xs font-medium bg-[#FF2D20] hover:bg-[#E02619] text-white active:scale-[0.97] transition-all cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
