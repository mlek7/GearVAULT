import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Package,
  ChevronRight as ArrowRightIcon,
  CheckCircle,
  History,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Shoot, PackingItem, AppSettings } from '../../types';
import { ShootModal } from './ShootModal';
import {
  formatShootTime,
  formatShootDate,
  formatRelativeDateLabel,
  getUpcomingShoots,
  getPastShoots,
  isSameDay,
} from '../../utils/dateUtils';

interface ShootSchedulerViewProps {
  shoots: Shoot[];
  packing: PackingItem[];
  settings?: AppSettings;
  onOpenShoot: (shootId: string) => void;
  onAddShoot: (shoot: Shoot) => void;
  onUpdateShoot: (shoot: Shoot) => void;
  onDeleteShoot: (shootId: string) => void;
}

export const ShootSchedulerView: React.FC<ShootSchedulerViewProps> = ({
  shoots,
  packing,
  settings,
  onOpenShoot,
  onAddShoot,
  onUpdateShoot,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false); // Collapsed to week strip by default (Requirement 14)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);
  const [isPastExpanded, setIsPastExpanded] = useState(false);

  // Month navigation
  const prevMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonthDate(
      new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
    );
  };

  const resetToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  // Build Calendar grid
  const { daysInMonth, startDayOffset, monthLabel, yearLabel } = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInM = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const monthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long' });

    return {
      daysInMonth: daysInM,
      startDayOffset: firstDay,
      monthLabel: monthName,
      yearLabel: year,
    };
  }, [currentMonthDate]);

  // Shoots by date string (YYYY-MM-DD) mapping for calendar dots
  const shootsByDateStr = useMemo(() => {
    const map = new Map<string, Shoot[]>();
    shoots.forEach((shoot) => {
      const key = shoot.dateTime.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shoot);
    });
    return map;
  }, [shoots]);

  // Week strip calculation (Requirement 14: 7 days around selected date or today)
  const weekDays = useMemo(() => {
    const baseDate = selectedDate || new Date();
    const currentDayOfWeek = baseDate.getDay(); // 0 is Sunday
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - currentDayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  // Partition shoots into Upcoming (date >= now, sorted asc) and Past (date < now, sorted desc)
  const upcomingShoots = useMemo(() => {
    const upcoming = getUpcomingShoots(shoots);
    if (selectedDate) {
      return upcoming.filter((s) => isSameDay(new Date(s.dateTime), selectedDate));
    }
    return upcoming;
  }, [shoots, selectedDate]);

  const pastShoots = useMemo(() => {
    const past = getPastShoots(shoots);
    if (selectedDate) {
      return past.filter((s) => isSameDay(new Date(s.dateTime), selectedDate));
    }
    return past;
  }, [shoots, selectedDate]);

  // Packing statistics helper for a shoot (division by zero guarded)
  const getShootPackingSummary = (shootId: string) => {
    const shootItems = packing.filter((p) => p.shootId === shootId);
    const total = shootItems.length;
    const packed = shootItems.filter((p) => p.status === 'Packed').length;
    const missing = shootItems.filter((p) => p.status === 'Missing').length;
    const needed = shootItems.filter((p) => p.status === 'Needed').length;
    const percent = total > 0 ? Math.round((packed / total) * 100) : 0;
    return { total, packed, missing, needed, percent };
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const handleDayClick = (dateObj: Date) => {
    if (selectedDate && isSameDay(selectedDate, dateObj)) {
      // Toggle off
      setSelectedDate(null);
    } else {
      setSelectedDate(dateObj);
      // Sync month view if outside current month
      if (
        dateObj.getMonth() !== currentMonthDate.getMonth() ||
        dateObj.getFullYear() !== currentMonthDate.getFullYear()
      ) {
        setCurrentMonthDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), 1));
      }
    }
  };

  const toDateIsoKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <div id="shoot-scheduler-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Bookings & calendar
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 font-display">
            Shoots
          </h1>
        </div>

        {/* Primary Action Button (Single red per screen) */}
        <button
          id="btn-schedule-shoot"
          onClick={() => {
            setEditingShoot(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 min-h-[44px] py-2.5 px-5 rounded-full bg-[#FF2D20] hover:bg-[#E02619] text-white font-medium text-xs active:scale-[0.97] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Shoot</span>
        </button>
      </div>

      {/* Calendar Card: Collapsed to Week Strip by default, Tap to expand (Requirement 14) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 mb-4 shadow-sm">
        {/* Calendar Header with Expand/Collapse toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white font-display">
              {monthLabel} {yearLabel}
            </span>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full cursor-pointer"
              >
                <span>Clear filter</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              className="px-2.5 py-1 min-h-[36px] rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{isCalendarExpanded ? 'Week' : 'Month'}</span>
              {isCalendarExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {isCalendarExpanded && (
              <>
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* MODE A: Week Strip (Default collapsed view) */}
        {!isCalendarExpanded ? (
          <div>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {weekDays.map((d, idx) => {
                const isSelected = selectedDate && isSameDay(selectedDate, d);
                const isToday = isSameDay(d, new Date());
                const key = toDateIsoKey(d);
                const hasShoots = shootsByDateStr.has(key);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDayClick(d)}
                    className={`min-h-[58px] py-2 rounded-full flex flex-col items-center justify-between transition-all cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#FF2D20] text-white font-medium shadow-xs'
                        : isToday
                        ? 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white font-medium'
                        : 'text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                      {dayNames[d.getDay()]}
                    </span>
                    <span className="text-sm font-bold font-mono">{d.getDate()}</span>
                    {/* Shoot indicator dot */}
                    <div className="h-1.5 flex items-center justify-center">
                      {hasShoots ? (
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : 'bg-[#FF2D20]'
                          }`}
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* MODE B: Full Month Grid (Expanded) */
          <div>
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {dayNames.map((name, i) => (
                <div
                  key={i}
                  className="text-[11px] font-medium text-slate-400 py-1"
                >
                  {name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading offsets */}
              {Array.from({ length: startDayOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="h-10" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dObj = new Date(
                  currentMonthDate.getFullYear(),
                  currentMonthDate.getMonth(),
                  dayNum
                );
                const isSelected = selectedDate && isSameDay(selectedDate, dObj);
                const isToday = isSameDay(dObj, new Date());
                const key = toDateIsoKey(dObj);
                const hasShoots = shootsByDateStr.has(key);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleDayClick(dObj)}
                    className={`h-11 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer active:scale-[0.97] ${
                      isSelected
                        ? 'bg-[#FF2D20] text-white font-medium shadow-xs'
                        : isToday
                        ? 'bg-[#EBEBEB] dark:bg-[#1E1E1E] text-black dark:text-white font-medium'
                        : 'text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xs font-mono">{dayNum}</span>
                    <div className="h-1 flex items-center justify-center">
                      {hasShoots ? (
                        <div
                          className={`w-1 h-1 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : 'bg-[#FF2D20]'
                          }`}
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter notice if day is selected */}
      {selectedDate && (
        <div className="flex items-center justify-between mb-3 px-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>
            Filtering by{' '}
            <strong className="text-slate-900 dark:text-white">
              {formatShootDate(selectedDate.toISOString(), settings?.dateFormat)}
            </strong>
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-slate-700 dark:text-slate-200 hover:underline font-semibold"
          >
            Show all dates
          </button>
        </div>
      )}

      {/* SECTION 1: UPCOMING SHOOTS (date >= now, sorted asc) */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Upcoming sessions ({upcomingShoots.length})
          </span>
        </div>

        {upcomingShoots.length === 0 ? (
          <div className="rounded-3xl p-6 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {selectedDate ? 'No sessions on this date' : 'No upcoming shoots'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              {selectedDate
                ? 'No photoshoot booked for this specific day.'
                : 'Schedule a photoshoot to organize gear and check forecasts.'}
            </p>
            <button
              onClick={() => {
                setEditingShoot(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 min-h-[44px] py-2 px-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Shoot</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingShoots.map((shoot) => {
              const summary = getShootPackingSummary(shoot.id);
              const rel = formatRelativeDateLabel(shoot.dateTime);

              return (
                <div
                  key={shoot.id}
                  id={`shoot-card-${shoot.id}`}
                  onClick={() => onOpenShoot(shoot.id)}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer active:scale-[0.99] group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {shoot.shootType}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {rel.text}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 font-display truncate group-hover:text-slate-600 dark:group-hover:text-slate-200">
                        {shoot.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Client: {shoot.clientName}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors shrink-0">
                      <ArrowRightIcon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Shoot Metadata Details */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {formatShootDate(shoot.dateTime, settings?.dateFormat)} •{' '}
                        {formatShootTime(shoot.dateTime, settings?.timeFormat)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{shoot.location}</span>
                    </div>
                  </div>

                  {/* Packing Progress Status */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      {summary.total === 0 ? (
                        <span className="font-medium text-slate-600 dark:text-slate-400">
                          No gear list yet –{' '}
                          <span className="text-slate-900 dark:text-white font-semibold underline">
                            Add gear
                          </span>
                        </span>
                      ) : (
                        <span>
                          {summary.packed}/{summary.total} Packed
                        </span>
                      )}
                    </div>

                    {summary.total > 0 && (
                      <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                        {summary.percent}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: PAST / COMPLETED SHOOTS (date < now, sorted desc) */}
      {pastShoots.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setIsPastExpanded(!isPastExpanded)}
            className="w-full flex items-center justify-between py-2 px-1 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Past / Completed Sessions ({pastShoots.length})
              </span>
            </div>
            {isPastExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {isPastExpanded && (
            <div className="space-y-2 mt-2">
              {pastShoots.map((shoot) => {
                const rel = formatRelativeDateLabel(shoot.dateTime);
                return (
                  <div
                    key={shoot.id}
                    onClick={() => onOpenShoot(shoot.id)}
                    className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {shoot.shootType}
                        </span>
                        <span className="text-[11px] text-slate-400">{rel.text}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
                        {shoot.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {shoot.clientName} •{' '}
                        {formatShootDate(shoot.dateTime, settings?.dateFormat)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
                      <CheckCircle className="w-4 h-4 text-slate-400" />
                      <span>Completed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <ShootModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingShoot(null);
        }}
        onSave={(saved) => {
          if (editingShoot) {
            onUpdateShoot(saved);
          } else {
            onAddShoot(saved);
          }
          setIsModalOpen(false);
          setEditingShoot(null);
        }}
        initialShoot={editingShoot || undefined}
      />
    </div>
  );
};
