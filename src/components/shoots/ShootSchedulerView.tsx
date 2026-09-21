import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Package,
  ChevronRight as ArrowRightIcon,
} from 'lucide-react';
import { Shoot, PackingItem } from '../../types';
import { ShootModal } from './ShootModal';
import { formatShootTime, formatShootDate, formatRelativeTime, isSameDay } from '../../utils/dateUtils';

interface ShootSchedulerViewProps {
  shoots: Shoot[];
  packing: PackingItem[];
  onOpenShoot: (shootId: string) => void;
  onAddShoot: (shoot: Shoot) => void;
  onUpdateShoot: (shoot: Shoot) => void;
  onDeleteShoot: (shootId: string) => void;
}

export const ShootSchedulerView: React.FC<ShootSchedulerViewProps> = ({
  shoots,
  packing,
  onOpenShoot,
  onAddShoot,
  onUpdateShoot,
}) => {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShoot, setEditingShoot] = useState<Shoot | null>(null);

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

  // Shoots by day mapping
  const shootsByDay = useMemo(() => {
    const map = new Map<number, Shoot[]>();
    shoots.forEach((shoot) => {
      const d = new Date(shoot.dateTime);
      if (
        d.getFullYear() === currentMonthDate.getFullYear() &&
        d.getMonth() === currentMonthDate.getMonth()
      ) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push(shoot);
      }
    });
    return map;
  }, [shoots, currentMonthDate]);

  // Selected date shoots (or upcoming if none selected)
  const displayedShoots = useMemo(() => {
    if (selectedDate) {
      return shoots
        .filter((s) => isSameDay(new Date(s.dateTime), selectedDate))
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return shoots
      .slice()
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [shoots, selectedDate]);

  // Packing statistics helper for a shoot
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

  return (
    <div id="shoot-scheduler-view" className="pb-28 pt-3 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D45B5B] font-mono">
            Shoot Scheduler
          </span>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-0.5 font-display">
            Calendar & Bookings
          </h1>
        </div>
        <button
          id="btn-schedule-shoot"
          onClick={() => {
            setEditingShoot(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#F29191] to-[#F7ADAD] hover:brightness-105 text-white font-extrabold text-xs shadow-md shadow-[#F29191]/30 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Shoot</span>
        </button>
      </div>

      {/* Calendar Card with Bright Styling */}
      <div className="rounded-[28px] bright-card p-4.5 mb-5 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-slate-900 font-display">
              {monthLabel} {yearLabel}
            </h2>
            <button
              onClick={resetToToday}
              className="text-[10px] font-extrabold text-[#D45B5B] bg-[#FFF0F0] hover:bg-[#FFE5E5] px-2.5 py-0.5 rounded-full border border-[#F7ADAD]"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Name Headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {dayNames.map((name, i) => (
            <span key={i} className="text-[11px] font-bold text-slate-400 py-1 font-mono">
              {name}
            </span>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Leading empty cells */}
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-10 rounded-2xl" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const thisDate = new Date(
              currentMonthDate.getFullYear(),
              currentMonthDate.getMonth(),
              dayNum
            );
            const isToday = isSameDay(thisDate, new Date());
            const isSelected = selectedDate && isSameDay(thisDate, selectedDate);
            const dayShoots = shootsByDay.get(dayNum) || [];
            const hasShoot = dayShoots.length > 0;

            return (
              <button
                key={`day-${dayNum}`}
                id={`calendar-day-${dayNum}`}
                onClick={() => setSelectedDate(thisDate)}
                className={`relative h-10 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white font-black shadow-sm shadow-[#F29191]/40 scale-105 z-10'
                    : isToday
                    ? 'bg-[#CCFBFA]/70 text-[#0F4E50] font-bold border border-[#B1E5E6]'
                    : hasShoot
                    ? 'bg-slate-50 text-slate-900 hover:bg-slate-100 font-semibold border border-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-xs font-mono">{dayNum}</span>
                {hasShoot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-white' : 'bg-[#F29191]'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 font-display">
              {selectedDate
                ? formatShootDate(selectedDate.toISOString())
                : 'All Scheduled Shoots'}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {displayedShoots.length} {displayedShoots.length === 1 ? 'shoot' : 'shoots'}
          </span>
        </div>

        {/* Empty state for selected date */}
        {displayedShoots.length === 0 && (
          <div className="text-center py-10 px-4 rounded-3xl bright-card">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-800 font-medium">No photoshoot scheduled for this date</p>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
              Tap below to create a booking and gear plan for this day.
            </p>
            <button
              onClick={() => {
                setEditingShoot(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D45B5B]" />
              <span>Book This Date</span>
            </button>
          </div>
        )}

        {/* Shoot Cards */}
        {displayedShoots.map((shoot) => {
          const summary = getShootPackingSummary(shoot.id);
          const rel = formatRelativeTime(shoot.dateTime);
          const isSoon = !rel.isPast && rel.diffMinutes <= 120;

          return (
            <div
              key={shoot.id}
              id={`shoot-card-${shoot.id}`}
              onClick={() => onOpenShoot(shoot.id)}
              className="group cursor-pointer rounded-2xl bright-card p-4 transition-all duration-200 hover:border-[#F7ADAD] shadow-xs active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6] font-mono">
                      {shoot.shootType}
                    </span>
                    {isSoon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                        Starts {rel.text}
                      </span>
                    )}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight mt-1.5 group-hover:text-[#D45B5B] transition-colors font-display">
                    {shoot.title}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium">
                    Client: <span className="text-slate-900">{shoot.clientName}</span>
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#F29191] group-hover:text-white flex items-center justify-center text-slate-400 transition-colors shrink-0">
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Time & Location */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 truncate">
                  <Clock className="w-3.5 h-3.5 text-[#D45B5B] shrink-0" />
                  <span className="truncate">{formatShootTime(shoot.dateTime)}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#D45B5B] shrink-0" />
                  <span className="truncate">{shoot.location}</span>
                </div>
              </div>

              {/* Packing Progress */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Package className="w-3.5 h-3.5 text-[#D45B5B]" />
                    <span>Packing List:</span>
                    <span className="font-bold text-slate-900">
                      {summary.packed}/{summary.total} Packed
                    </span>
                  </div>
                  <span
                    className={`font-bold ${
                      summary.missing > 0
                        ? 'text-rose-600'
                        : summary.percent === 100
                        ? 'text-teal-700'
                        : 'text-[#D45B5B]'
                    }`}
                  >
                    {summary.percent}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#B1E5E6] to-[#167D80] rounded-full transition-all duration-300"
                    style={{ width: `${summary.percent}%` }}
                  />
                  {summary.missing > 0 && (
                    <div
                      className="h-full bg-[#F29191] rounded-full ml-0.5"
                      style={{
                        width: `${Math.round((summary.missing / summary.total) * 100)}%`,
                      }}
                    />
                  )}
                </div>

                {summary.missing > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-rose-600 mt-1.5 font-bold">
                    <AlertCircle className="w-3 h-3" />
                    <span>{summary.missing} item(s) marked as Missing</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shoot Modal */}
      <ShootModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingShoot(null);
        }}
        onSave={(shoot) => {
          if (editingShoot) {
            onUpdateShoot(shoot);
          } else {
            onAddShoot(shoot);
          }
        }}
        initialShoot={editingShoot}
        defaultDate={selectedDate ? selectedDate.toISOString() : undefined}
      />
    </div>
  );
};
