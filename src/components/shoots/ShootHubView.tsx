import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Package,
  Palette,
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Sparkles,
  Maximize2,
  Edit2,
  CheckCheck,
  AlertCircle,
  Copy,
  Check,
  CloudSun,
  Sun,
  Wind,
  Droplets,
  Sunset,
  Sunrise,
  Camera,
  RefreshCw,
} from 'lucide-react';
import {
  Shoot,
  PackingItem,
  GearItem,
  MoodboardItem,
  PackingStatus,
  AppSettings,
  WeatherForecastData,
} from '../../types';
import { formatShootDate, formatShootTime, formatRelativeTime } from '../../utils/dateUtils';
import { PackingSelectorModal } from './PackingSelectorModal';
import { MoodboardModal } from '../moodboard/MoodboardModal';
import { FullscreenImageViewer } from '../moodboard/FullscreenImageViewer';
import { ShootModal } from './ShootModal';
import { playAlertChime } from '../../services/storage';
import { getPhotographyWeather } from '../../services/weatherService';

interface ShootHubViewProps {
  shoot: Shoot;
  gearList: GearItem[];
  packingList: PackingItem[];
  moodboards: MoodboardItem[];
  settings: AppSettings;
  onBack: () => void;
  onUpdateShoot: (shoot: Shoot) => void;
  onDeleteShoot: (shootId: string) => void;
  onUpdatePackingItem: (item: PackingItem) => void;
  onAddPackingItems: (items: PackingItem[]) => void;
  onDeletePackingItem: (id: string) => void;
  onAddMoodboardItem: (item: MoodboardItem) => void;
  onDeleteMoodboardItem: (id: string) => void;
}

export const ShootHubView: React.FC<ShootHubViewProps> = ({
  shoot,
  gearList,
  packingList,
  moodboards,
  settings,
  onBack,
  onUpdateShoot,
  onDeleteShoot,
  onUpdatePackingItem,
  onAddPackingItems,
  onDeletePackingItem,
  onAddMoodboardItem,
  onDeleteMoodboardItem,
}) => {
  const [activeTab, setActiveTab] = useState<'packing' | 'weather' | 'moodboard' | 'details'>('packing');
  const [packingFilter, setPackingFilter] = useState<'all' | PackingStatus>('all');
  const [isGearSelectorOpen, setIsGearSelectorOpen] = useState(false);
  const [isMoodboardModalOpen, setIsMoodboardModalOpen] = useState(false);
  const [isEditShootModalOpen, setIsEditShootModalOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);
  const [copiedLocation, setCopiedLocation] = useState(false);

  // Weather state for shoot
  const [weatherData, setWeatherData] = useState<WeatherForecastData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const loadShootWeather = async () => {
    setLoadingWeather(true);
    try {
      const data = await getPhotographyWeather(shoot.location, shoot.dateTime);
      setWeatherData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    loadShootWeather();
  }, [shoot.location, shoot.dateTime]);

  // Map gear for fast lookup
  const gearMap = useMemo(() => new Map(gearList.map((g) => [g.id, g])), [gearList]);

  // Packing items for this shoot
  const shootPacking = useMemo(
    () => packingList.filter((p) => p.shootId === shoot.id),
    [packingList, shoot.id]
  );

  // Moodboard items for this shoot
  const shootMoodboard = useMemo(
    () => moodboards.filter((m) => m.shootId === shoot.id),
    [moodboards, shoot.id]
  );

  // Packing statistics
  const packingStats = useMemo(() => {
    const total = shootPacking.length;
    const packed = shootPacking.filter((p) => p.status === 'Packed').length;
    const needed = shootPacking.filter((p) => p.status === 'Needed').length;
    const missing = shootPacking.filter((p) => p.status === 'Missing').length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, needed, missing, percent };
  }, [shootPacking]);

  // Relative timing & Conditional 2-Hour Alert check
  const relTime = formatRelativeTime(shoot.dateTime);
  const isWithinTwoHours = !relTime.isPast && relTime.diffMinutes <= 120;
  const hasUnpackedOrMissing = packingStats.needed > 0 || packingStats.missing > 0;
  const showCriticalTwoHourWarning = isWithinTwoHours && hasUnpackedOrMissing;

  // Unpacked/missing items list for alert banner
  const missingOrNeededNames = useMemo(() => {
    return shootPacking
      .filter((p) => p.status === 'Needed' || p.status === 'Missing')
      .map((p) => ({
        name: gearMap.get(p.gearId)?.name || 'Gear Item',
        status: p.status,
      }));
  }, [shootPacking, gearMap]);

  // Status cycle: Needed -> Packed -> Missing -> Needed
  const cycleStatus = (item: PackingItem) => {
    let nextStatus: PackingStatus = 'Needed';
    if (item.status === 'Needed') nextStatus = 'Packed';
    else if (item.status === 'Packed') nextStatus = 'Missing';
    else if (item.status === 'Missing') nextStatus = 'Needed';

    if (nextStatus === 'Packed' && settings.soundEnabled) {
      playAlertChime('shutter');
    }

    onUpdatePackingItem({ ...item, status: nextStatus });
  };

  const setExplicitStatus = (item: PackingItem, newStatus: PackingStatus) => {
    if (newStatus === 'Packed' && settings.soundEnabled) {
      playAlertChime('shutter');
    }
    onUpdatePackingItem({ ...item, status: newStatus });
  };

  const markAllPacked = () => {
    shootPacking.forEach((item) => {
      if (item.status !== 'Packed') {
        onUpdatePackingItem({ ...item, status: 'Packed' });
      }
    });
    if (settings.soundEnabled) {
      playAlertChime('success');
    }
  };

  const handleAddGearFromVault = (gearIds: string[]) => {
    const newItems: PackingItem[] = gearIds.map((gearId) => ({
      id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      shootId: shoot.id,
      gearId,
      status: 'Needed',
    }));
    onAddPackingItems(newItems);
  };

  const filteredPackingItems = shootPacking.filter((item) => {
    if (packingFilter === 'all') return true;
    return item.status === packingFilter;
  });

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(shoot.location);
    setCopiedLocation(true);
    setTimeout(() => setCopiedLocation(false), 2000);
  };

  return (
    <div id="shoot-hub-view" className="pb-28 pt-2 px-4 max-w-lg mx-auto">
      {/* Top Bar with Back Button & Actions */}
      <div className="flex items-center justify-between mb-3">
        <button
          id="btn-shoot-hub-back"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white text-xs font-medium transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="pulsar-tag">
            {shoot.shootType}
          </span>
          <button
            onClick={() => setIsEditShootModalOpen(true)}
            className="p-2 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
            title="Edit shoot details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Shoot Hero Header */}
      <div className="pulsar-card mb-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-medium text-black dark:text-white tracking-tight leading-tight font-sans">
                {shoot.title}
              </h1>
              <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 font-medium">
                Client: <strong className="text-black dark:text-white">{shoot.clientName}</strong>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-full ${
                  relTime.isPast
                    ? 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
                    : isWithinTwoHours
                    ? 'pulsar-badge-status'
                    : 'bg-[#FF2D20]/10 text-[#FF2D20] border border-[#FF2D20]/30'
                }`}
              >
                {relTime.isPast ? relTime.text : `STARTS ${relTime.text.toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* Date, Time & Location Quick Chips */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-black/[0.08] dark:border-white/[0.08] text-xs">
            <div className="flex items-center gap-1.5 truncate text-[#6E6E73] dark:text-[#8E8E93]">
              <div className="p-1 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-[11px] font-mono">
                {formatShootDate(shoot.dateTime, settings.dateFormat)} • {formatShootTime(shoot.dateTime, settings.timeFormat)}
              </span>
            </div>

            <div
              onClick={handleCopyLocation}
              className="flex items-center gap-1.5 truncate cursor-pointer text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
              title="Click to copy address"
            >
              <div className="p-1 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20]">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-[11px] font-mono">{shoot.location}</span>
              {copiedLocation ? (
                <Check className="w-3 h-3 text-[#30D158] shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-[#8E8E93] shrink-0" />
              )}
            </div>
          </div>

          {/* Compact Weather Bar on Hero */}
          {weatherData && (
            <div
              onClick={() => setActiveTab('weather')}
              className="mt-3.5 pt-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#FF2D20]" />
                <span className="text-xs font-medium text-black dark:text-white font-mono">
                  {weatherData.temperatureF}°F
                </span>
                <span className="text-xs text-[#6E6E73] dark:text-[#8E8E93] truncate font-medium">
                  {weatherData.conditionText}
                </span>
              </div>
              <span className="pulsar-bracket-btn">
                GOLDEN HR: {weatherData.goldenHourEvening.split('-')[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2-HOUR CONDITIONAL ALERT BANNER */}
      {showCriticalTwoHourWarning && (
        <div
          id="shoot-hub-critical-alert"
          className="rounded-3xl bg-rose-50 border border-rose-200 p-4 mb-4 shadow-sm animate-pulse-subtle"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  High-Priority Alert
                </span>
                <span className="text-[11px] text-rose-800 font-bold">
                  Shoot starts in {Math.max(0, relTime.diffMinutes)} mins!
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1 font-display">
                Unpacked Gear Detected
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                The following {missingOrNeededNames.length} essential items are NOT marked as
                &quot;Packed&quot;. Verify and stow them into your bag immediately:
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {missingOrNeededNames.map((item, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-xl font-medium border ${
                      item.status === 'Missing'
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {item.name} ({item.status})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shoot Hub Floating Segmented Control: Packing | Weather | Moodboard | Details */}
      <div className="flex items-center p-1 bg-[#EBEBEB] dark:bg-[#1E1E1E] rounded-full border border-black/[0.08] dark:border-white/[0.08] mb-4 gap-1">
        <button
          id="tab-shoot-packing"
          onClick={() => setActiveTab('packing')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-medium transition-all ${
            activeTab === 'packing'
              ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
              : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Packing</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'packing'
                ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white'
                : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
            }`}
          >
            {packingStats.packed}/{packingStats.total}
          </span>
        </button>

        <button
          id="tab-shoot-weather"
          onClick={() => setActiveTab('weather')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-medium transition-all ${
            activeTab === 'weather'
              ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
              : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>Weather</span>
        </button>

        <button
          id="tab-shoot-moodboard"
          onClick={() => setActiveTab('moodboard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-medium transition-all ${
            activeTab === 'moodboard'
              ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
              : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Mood</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'moodboard'
                ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white'
                : 'bg-black/5 dark:bg-white/5 text-[#8E8E93]'
            }`}
          >
            {shootMoodboard.length}
          </span>
        </button>

        <button
          id="tab-shoot-details"
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-medium transition-all ${
            activeTab === 'details'
              ? 'bg-[#FFFFFF] dark:bg-[#3A3A3C] text-black dark:text-white shadow-xs'
              : 'text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DYNAMIC PACKING LISTS */}
      {/* ========================================================================= */}
      {activeTab === 'packing' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Progress & Controls Card */}
          <div className="pulsar-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="pulsar-section-label">
                  Packing Progress
                </span>
                <span className="text-xs font-mono font-medium text-black dark:text-white">
                  {packingStats.packed} of {packingStats.total} Packed
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-[#FF2D20]">
                {packingStats.percent}%
              </span>
            </div>

            {/* Progress Bar: Thin red line */}
            <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex mb-3.5">
              <div
                className="h-full bg-[#FF2D20] rounded-full transition-all duration-300"
                style={{ width: `${packingStats.percent}%` }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-black/[0.08] dark:border-white/[0.08]">
              <button
                id="btn-open-gear-selector"
                onClick={() => setIsGearSelectorOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Select from Gear Vault</span>
              </button>

              {shootPacking.length > 0 && (
                <button
                  id="btn-mark-all-packed"
                  onClick={markAllPacked}
                  className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white text-xs font-medium border border-black/[0.08] dark:border-white/[0.08] active:scale-95 transition-all"
                  title="Mark all items as Packed"
                >
                  <CheckCheck className="w-4 h-4 text-[#30D158]" />
                  <span>Pack All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setPackingFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                packingFilter === 'all'
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              All ({packingStats.total})
            </button>
            <button
              onClick={() => setPackingFilter('Needed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                packingFilter === 'Needed'
                  ? 'bg-[#FF2D20] text-white'
                  : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              Needed ({packingStats.needed})
            </button>
            <button
              onClick={() => setPackingFilter('Packed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                packingFilter === 'Packed'
                  ? 'bg-[#30D158] text-white'
                  : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              Packed ({packingStats.packed})
            </button>
            <button
              onClick={() => setPackingFilter('Missing')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                packingFilter === 'Missing'
                  ? 'bg-[#FFD60A] text-black'
                  : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white'
              }`}
            >
              Missing ({packingStats.missing})
            </button>
          </div>

          {/* Packing Items List */}
          <div className="space-y-2.5">
            {filteredPackingItems.map((item) => {
              const gear = gearMap.get(item.gearId);
              const isPacked = item.status === 'Packed';
              const isMissing = item.status === 'Missing';

              return (
                <div
                  key={item.id}
                  id={`packing-item-${item.id}`}
                  className={`rounded-[20px] border p-4 transition-all duration-200 ${
                    isPacked
                      ? 'bg-[#EBEBEB]/40 dark:bg-[#1E1E1E]/40 border-black/[0.08] dark:border-white/[0.08] text-[#8E8E93]'
                      : isMissing
                      ? 'bg-[#EBEBEB] dark:bg-[#1E1E1E] border-[#FF2D20]/40 text-black dark:text-white'
                      : 'bg-[#EBEBEB] dark:bg-[#1E1E1E] border-black/[0.08] dark:border-white/[0.08] text-black dark:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Interactive Tri-State Cycle Button */}
                    <button
                      id={`btn-cycle-status-${item.id}`}
                      onClick={() => cycleStatus(item)}
                      title={`Current status: ${item.status}. Click to cycle status.`}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all active:scale-90 ${
                        isPacked
                          ? 'bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]'
                          : isMissing
                          ? 'bg-[#FFD60A]/15 border-[#FFD60A]/40 text-[#FFD60A]'
                          : 'bg-black/5 dark:bg-white/5 border-black/[0.08] dark:border-white/[0.08] text-[#8E8E93]'
                      }`}
                    >
                      {isPacked ? (
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      ) : isMissing ? (
                        <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Package className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </button>

                    {/* Gear Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <span className="pulsar-tag text-[9px] mb-1">
                            {gear?.category || 'Custom Gear'}
                          </span>
                          <h4
                            className={`text-sm font-medium tracking-tight leading-snug ${
                              isPacked ? 'line-through text-[#8E8E93]' : 'text-black dark:text-white'
                            }`}
                          >
                            {gear?.name || 'Unknown Gear Item'}
                          </h4>
                        </div>

                        {/* Remove from shoot */}
                        <button
                          onClick={() => onDeletePackingItem(item.id)}
                          className="p-1.5 rounded-full text-[#8E8E93] hover:text-[#FF2D20] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          title="Remove item from shoot packing list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Serial Number & Notes */}
                      {gear?.serialNumber && (
                        <span className="text-[10px] font-mono text-[#8E8E93] block mt-0.5">
                          S/N: {gear.serialNumber}
                        </span>
                      )}

                      {/* Custom Packing Notes */}
                      {item.customNotes && (
                        <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] mt-1 italic">
                          Note: {item.customNotes}
                        </p>
                      )}

                      {/* Explicit Tri-State Selector Pills */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-black/[0.08] dark:border-white/[0.08]">
                        <span className="text-[10px] font-mono text-[#8E8E93] mr-1 uppercase">
                          Status:
                        </span>
                        {(['Needed', 'Packed', 'Missing'] as PackingStatus[]).map((status) => {
                          const isActive = item.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => setExplicitStatus(item, status)}
                              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all active:scale-95 ${
                                isActive
                                  ? status === 'Packed'
                                    ? 'bg-[#30D158] text-white'
                                    : status === 'Missing'
                                    ? 'bg-[#FFD60A] text-black'
                                    : 'bg-[#FF2D20] text-white'
                                  : 'bg-black/5 dark:bg-white/5 text-[#8E8E93] hover:text-black dark:hover:text-white'
                              }`}
                            >
                              {status}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {shootPacking.length === 0 && (
              <div className="text-center py-12 px-4 rounded-[28px] pulsar-card">
                <div className="w-14 h-14 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] text-[#FF2D20] flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-normal text-black dark:text-white font-sans">
                  No gear added to this shoot yet
                </h3>
                <p className="text-xs text-[#6E6E73] dark:text-[#8E8E93] max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                  Select camera bodies, lenses, and lighting from your Gear Vault to create a
                  foolproof packing checklist.
                </p>
                <button
                  onClick={() => setIsGearSelectorOpen(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Select Gear from Vault</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHOOT LOCATION WEATHER FORECAST */}
      {/* ========================================================================= */}
      {activeTab === 'weather' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bright-card-hero rounded-[28px] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#FF2D20] font-mono">
                  Location Meteorology
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  {shoot.location}
                </h3>
              </div>
              <button
                onClick={loadShootWeather}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWeather ? 'animate-spin text-[#FF2D20]' : ''}`} />
              </button>
            </div>

            {weatherData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-4xl font-black text-slate-900 font-display">
                      {weatherData.temperatureF}°F
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">
                      {weatherData.conditionText}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/85 border border-[#B1E5E6] text-center shadow-xs">
                    <Sun className="w-7 h-7 text-[#FF2D20] mx-auto mb-1" />
                    <span className="text-[10px] font-extrabold uppercase text-[#0F4E50] font-mono">
                      {weatherData.lightingQuality}
                    </span>
                  </div>
                </div>

                {/* Golden Hour Ribbon */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
                  <div className="p-2.5 rounded-[18px] bg-white dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08]">
                    <span className="text-[10px] font-mono text-[#FF2D20] block">Evening Golden Hour</span>
                    <span className="text-xs font-mono font-medium text-black dark:text-white">
                      {weatherData.goldenHourEvening}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-[18px] bg-white dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08]">
                    <span className="text-[10px] font-mono text-[#30D158] block">Morning Golden Hour</span>
                    <span className="text-xs font-mono font-medium text-black dark:text-white">
                      {weatherData.goldenHourMorning}
                    </span>
                  </div>
                </div>

                {/* Quick Environmental Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-[18px] bg-white dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-center">
                    <Wind className="w-3.5 h-3.5 text-[#8E8E93] mx-auto mb-1" />
                    <span className="text-[9px] text-[#8E8E93] uppercase font-mono block">Wind</span>
                    <span className="text-xs font-mono font-medium text-black dark:text-white">{weatherData.windSpeedMph} mph</span>
                  </div>
                  <div className="p-2.5 rounded-[18px] bg-white dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-center">
                    <Droplets className="w-3.5 h-3.5 text-[#30D158] mx-auto mb-1" />
                    <span className="text-[9px] text-[#8E8E93] uppercase font-mono block">Rain</span>
                    <span className="text-xs font-mono font-medium text-black dark:text-white">{weatherData.precipitationProb}%</span>
                  </div>
                  <div className="p-2.5 rounded-[18px] bg-white dark:bg-[#1E1E1E] border border-black/[0.08] dark:border-white/[0.08] text-center">
                    <Sun className="w-3.5 h-3.5 text-[#FFD60A] mx-auto mb-1" />
                    <span className="text-[9px] text-[#8E8E93] uppercase font-mono block">UV</span>
                    <span className="text-xs font-mono font-medium text-black dark:text-white">{weatherData.uvIndex}/10</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Loading forecast...</div>
            )}
          </div>

          {/* Field Gear Advisories for Shoot */}
          {weatherData && (
            <div className="bright-card rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#FF2D20]" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Recommended Weather Gear for this Shoot
                </h4>
              </div>
              <div className="space-y-1.5">
                {weatherData.gearRecommendations.map((rec, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CREATIVE MOODBOARDS (Masonry Grid + Lightbox) */}
      {/* ========================================================================= */}
      {activeTab === 'moodboard' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[#FF2D20]">
                Creative Vision
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 font-display">
                Moodboard & Visual References
              </h3>
            </div>
            <button
              id="btn-add-moodboard-item"
              onClick={() => setIsMoodboardModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Inspiration</span>
            </button>
          </div>

          {/* Masonry-Style Photo Grid */}
          {shootMoodboard.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {shootMoodboard.map((item, index) => (
                <div
                  key={item.id}
                  id={`moodboard-item-${item.id}`}
                  className="group relative rounded-[20px] bg-white dark:bg-[#121212] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shadow-xs hover:border-[#FF2D20] transition-all cursor-pointer flex flex-col"
                  onClick={() => setFullscreenImageIndex(index)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl}
                      alt={item.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />

                    {item.category && (
                      <span className="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-full border border-slate-200 shadow-xs">
                        {item.category}
                      </span>
                    )}

                    <div className="absolute top-2.5 right-2.5 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">
                      {item.caption}
                    </p>

                    {item.colorPalette && item.colorPalette.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                        {item.colorPalette.map((hex, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-slate-200 shadow-xs"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2.5 pt-1">
                      {item.externalLink ? (
                        <a
                          href={item.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-[#FF2D20] font-mono uppercase tracking-wider hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this reference from moodboard?')) {
                            onDeleteMoodboardItem(item.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                        title="Delete reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-3xl bright-card">
              <div className="w-14 h-14 rounded-3xl bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6] flex items-center justify-center mx-auto mb-3">
                <Palette className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                No inspiration loaded yet
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                Curate posing references, lighting setups, Pinterest boards, and color palettes for
                this photoshoot.
              </p>
              <button
                onClick={() => setIsMoodboardModalOpen(true)}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Inspiration</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHOOT DETAILS & CALL SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="rounded-3xl bright-card p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 font-display">
              Photoshoot Specifications
            </h3>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Shoot Title
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{shoot.title}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Client / Agency
                </span>
                <p className="text-sm text-slate-900 font-medium mt-0.5">{shoot.clientName}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Shoot Type
                </span>
                <p className="text-sm text-[#FF2D20] font-mono mt-0.5">{shoot.shootType}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Schedule & Countdown
              </span>
              <p className="text-sm text-slate-900 mt-0.5">
                {formatShootDate(shoot.dateTime)} at {formatShootTime(shoot.dateTime)} (
                {relTime.text})
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                Location
              </span>
              <p className="text-sm text-slate-900 mt-0.5">{shoot.location}</p>
            </div>

            {shoot.generalNotes && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Call Sheet & Production Notes
                </span>
                <p className="text-xs text-slate-800 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {shoot.generalNotes}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setIsEditShootModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold border border-slate-200 transition-all shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Shoot Info</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${shoot.title}"?`)) {
                    onDeleteShoot(shoot.id);
                    onBack();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Shoot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <PackingSelectorModal
        isOpen={isGearSelectorOpen}
        onClose={() => setIsGearSelectorOpen(false)}
        gearList={gearList}
        existingGearIds={shootPacking.map((p) => p.gearId)}
        onAddGearItems={handleAddGearFromVault}
      />

      <MoodboardModal
        isOpen={isMoodboardModalOpen}
        onClose={() => setIsMoodboardModalOpen(false)}
        shootId={shoot.id}
        onAddMoodboardItem={onAddMoodboardItem}
      />

      {fullscreenImageIndex !== null && (
        <FullscreenImageViewer
          items={shootMoodboard}
          initialIndex={fullscreenImageIndex}
          onClose={() => setFullscreenImageIndex(null)}
        />
      )}

      <ShootModal
        isOpen={isEditShootModalOpen}
        onClose={() => setIsEditShootModalOpen(false)}
        onSave={(updated) => onUpdateShoot(updated)}
        initialShoot={shoot}
      />
    </div>
  );
};
