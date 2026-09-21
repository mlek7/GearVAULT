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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs">
            {shoot.shootType}
          </span>
          <button
            onClick={() => setIsEditShootModalOpen(true)}
            className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs"
            title="Edit shoot details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Shoot Hero Header with Bright Styling */}
      <div className="rounded-[28px] p-5 mb-4 relative overflow-hidden bright-card-hero">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#CCFBFA]/45 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-[#F7ADAD]/25 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight font-display">
                {shoot.title}
              </h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Client: <strong className="text-slate-900">{shoot.clientName}</strong>
              </p>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  relTime.isPast
                    ? 'bg-slate-100 text-slate-500'
                    : isWithinTwoHours
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                    : 'bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6]'
                }`}
              >
                {relTime.isPast ? relTime.text : `Starts ${relTime.text}`}
              </span>
            </div>
          </div>

          {/* Date, Time & Location Quick Chips */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-[#F7ADAD]/40 text-xs">
            <div className="flex items-center gap-1.5 truncate text-slate-700">
              <div className="p-1 rounded-lg bg-[#FFF0F0] text-[#D45B5B] shadow-xs">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-[11px] font-medium">
                {formatShootDate(shoot.dateTime)} • {formatShootTime(shoot.dateTime)}
              </span>
            </div>

            <div
              onClick={handleCopyLocation}
              className="flex items-center gap-1.5 truncate cursor-pointer text-slate-700 hover:text-[#D45B5B] transition-colors"
              title="Click to copy address"
            >
              <div className="p-1 rounded-lg bg-[#FFF0F0] text-[#D45B5B] shadow-xs">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="truncate text-[11px] font-medium">{shoot.location}</span>
              {copiedLocation ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Compact Weather Bar on Hero */}
          {weatherData && (
            <div
              onClick={() => setActiveTab('weather')}
              className="mt-3.5 pt-3 border-t border-[#F7ADAD]/40 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D45B5B]" />
                <span className="text-xs font-black text-slate-900 font-mono">
                  {weatherData.temperatureF}°F
                </span>
                <span className="text-xs text-slate-600 truncate font-medium">
                  {weatherData.conditionText}
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#D45B5B] group-hover:underline flex items-center gap-1 font-mono">
                Golden Hr: {weatherData.goldenHourEvening.split('-')[0]} →
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
      <div className="flex items-center p-1 bg-white rounded-full border border-slate-200 mb-4 shadow-xs">
        <button
          id="tab-shoot-packing"
          onClick={() => setActiveTab('packing')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'packing'
              ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Packing</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'packing'
                ? 'bg-white/25 text-white font-extrabold'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {packingStats.packed}/{packingStats.total}
          </span>
        </button>

        <button
          id="tab-shoot-weather"
          onClick={() => setActiveTab('weather')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'weather'
              ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>Weather</span>
        </button>

        <button
          id="tab-shoot-moodboard"
          onClick={() => setActiveTab('moodboard')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'moodboard'
              ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Mood</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'moodboard'
                ? 'bg-white/25 text-white font-extrabold'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {shootMoodboard.length}
          </span>
        </button>

        <button
          id="tab-shoot-details"
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-full text-xs font-bold transition-all ${
            activeTab === 'details'
              ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
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
          <div className="rounded-3xl bright-card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Packing Progress
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {packingStats.packed} of {packingStats.total} Packed
                </span>
              </div>
              <span
                className={`text-xs font-black ${
                  packingStats.percent === 100
                    ? 'text-teal-700'
                    : packingStats.missing > 0
                    ? 'text-[#D45B5B]'
                    : 'text-[#D45B5B]'
                }`}
              >
                {packingStats.percent}%
              </span>
            </div>

            {/* Progress Bar with Color Hunt palette */}
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 mb-3.5">
              <div
                className="h-full bg-gradient-to-r from-[#B1E5E6] to-[#167D80] rounded-full transition-all duration-300"
                style={{ width: `${packingStats.percent}%` }}
              />
              {packingStats.missing > 0 && (
                <div
                  className="h-full bg-[#F29191] rounded-full ml-0.5 transition-all duration-300"
                  style={{
                    width: `${Math.round((packingStats.missing / packingStats.total) * 100)}%`,
                  }}
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
              <button
                id="btn-open-gear-selector"
                onClick={() => setIsGearSelectorOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Select from Gear Vault</span>
              </button>

              {shootPacking.length > 0 && (
                <button
                  id="btn-mark-all-packed"
                  onClick={markAllPacked}
                  className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 active:scale-95 transition-all shadow-xs"
                  title="Mark all items as Packed"
                >
                  <CheckCheck className="w-4 h-4 text-teal-600" />
                  <span>Pack All</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setPackingFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                packingFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              All ({packingStats.total})
            </button>
            <button
              onClick={() => setPackingFilter('Needed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                packingFilter === 'Needed'
                  ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Needed ({packingStats.needed})
            </button>
            <button
              onClick={() => setPackingFilter('Packed')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                packingFilter === 'Packed'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              Packed ({packingStats.packed})
            </button>
            <button
              onClick={() => setPackingFilter('Missing')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                packingFilter === 'Missing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
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
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    isPacked
                      ? 'bg-teal-50/40 border-teal-200/80 text-slate-600'
                      : isMissing
                      ? 'bg-rose-50/80 border-rose-300 text-slate-900 shadow-sm'
                      : 'bright-card text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Interactive Tri-State Cycle Button */}
                    <button
                      id={`btn-cycle-status-${item.id}`}
                      onClick={() => cycleStatus(item)}
                      title={`Current status: ${item.status}. Click to cycle status.`}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all active:scale-90 shadow-xs ${
                        isPacked
                          ? 'bg-teal-100 border-teal-300 text-teal-800'
                          : isMissing
                          ? 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse'
                          : 'bg-[#FFF0F0] border-[#F7ADAD] text-[#D45B5B]'
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
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D45B5B] block font-mono">
                            {gear?.category || 'Custom Gear'}
                          </span>
                          <h4
                            className={`text-sm font-bold tracking-tight leading-snug font-display ${
                              isPacked ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {gear?.name || 'Unknown Gear Item'}
                          </h4>
                        </div>

                        {/* Remove from shoot */}
                        <button
                          onClick={() => onDeletePackingItem(item.id)}
                          className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-black/5 transition-colors"
                          title="Remove item from shoot packing list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Serial Number & Notes */}
                      {gear?.serialNumber && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          S/N: {gear.serialNumber}
                        </span>
                      )}

                      {/* Custom Packing Notes */}
                      {item.customNotes && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          Note: {item.customNotes}
                        </p>
                      )}

                      {/* Explicit Tri-State Selector Pills */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 mr-1">
                          Status:
                        </span>
                        {(['Needed', 'Packed', 'Missing'] as PackingStatus[]).map((status) => {
                          const isActive = item.status === status;
                          return (
                            <button
                              key={status}
                              onClick={() => setExplicitStatus(item, status)}
                              className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all active:scale-95 ${
                                isActive
                                  ? status === 'Packed'
                                    ? 'bg-teal-700 text-white shadow-xs'
                                    : status === 'Missing'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-[#F29191] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
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
              <div className="text-center py-12 px-4 rounded-3xl bright-card">
                <div className="w-14 h-14 rounded-3xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]/60 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  No gear added to this shoot yet
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 mb-4 leading-relaxed">
                  Select camera bodies, lenses, and lighting from your Gear Vault to create a
                  foolproof packing checklist.
                </p>
                <button
                  onClick={() => setIsGearSelectorOpen(true)}
                  className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30"
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
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D45B5B] font-mono">
                  Location Meteorology
                </span>
                <h3 className="text-base font-extrabold text-slate-900 font-display">
                  {shoot.location}
                </h3>
              </div>
              <button
                onClick={loadShootWeather}
                className="p-2 rounded-full hover:bg-[#FFF0F0] text-slate-600 transition-colors"
                title="Refresh weather"
              >
                <RefreshCw className={`w-4 h-4 ${loadingWeather ? 'animate-spin text-[#D45B5B]' : ''}`} />
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
                    <Sun className="w-7 h-7 text-[#D45B5B] mx-auto mb-1" />
                    <span className="text-[10px] font-extrabold uppercase text-[#0F4E50] font-mono">
                      {weatherData.lightingQuality}
                    </span>
                  </div>
                </div>

                {/* Golden Hour Ribbon */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F7ADAD]/40">
                  <div className="p-2.5 rounded-xl bg-white/85 border border-[#F7ADAD]/60">
                    <span className="text-[10px] font-bold text-[#D45B5B] block">Evening Golden Hour</span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {weatherData.goldenHourEvening}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/85 border border-[#B1E5E6]">
                    <span className="text-[10px] font-bold text-[#0F4E50] block">Morning Golden Hour</span>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      {weatherData.goldenHourMorning}
                    </span>
                  </div>
                </div>

                {/* Quick Environmental Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/85 border border-[#B1E5E6] text-center">
                    <Wind className="w-3.5 h-3.5 text-[#167D80] mx-auto mb-1" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Wind</span>
                    <span className="text-xs font-black text-slate-900 font-mono">{weatherData.windSpeedMph} mph</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/85 border border-[#B1E5E6] text-center">
                    <Droplets className="w-3.5 h-3.5 text-sky-600 mx-auto mb-1" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Rain</span>
                    <span className="text-xs font-black text-slate-900 font-mono">{weatherData.precipitationProb}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/85 border border-[#F7ADAD]/60 text-center">
                    <Sun className="w-3.5 h-3.5 text-[#D45B5B] mx-auto mb-1" />
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">UV</span>
                    <span className="text-xs font-black text-slate-900 font-mono">{weatherData.uvIndex}/10</span>
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
                <Camera className="w-4 h-4 text-[#D45B5B]" />
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
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D45B5B] font-mono">
                Creative Vision
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 font-display">
                Moodboard & Visual References
              </h3>
            </div>
            <button
              id="btn-add-moodboard-item"
              onClick={() => setIsMoodboardModalOpen(true)}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
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
                  className="group relative rounded-2xl bright-card overflow-hidden shadow-xs hover:border-[#F7ADAD] transition-all cursor-pointer flex flex-col"
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
                          className="inline-flex items-center gap-1 text-[11px] text-[#D45B5B] font-bold hover:underline"
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
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Shoot Type
                </span>
                <p className="text-sm text-[#D45B5B] font-bold mt-0.5">{shoot.shootType}</p>
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
