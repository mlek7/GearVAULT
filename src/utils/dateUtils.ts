import { Shoot, PackingItem, GearItem, AlertNotification, AppSettings, DateFormat, TimeFormat } from '../types';

/**
 * Format a date according to user preference.
 * Defaults to 'dd/mm/yyyy' as required.
 */
export function formatShootDate(
  isoString: string,
  format: DateFormat = 'dd/mm/yyyy'
): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });

    if (format === 'mm/dd/yyyy') {
      return `${weekday}, ${month}/${day}/${year}`;
    }
    if (format === 'yyyy-mm-dd') {
      return `${weekday}, ${year}-${month}-${day}`;
    }
    // Default: dd/mm/yyyy
    return `${weekday}, ${day}/${month}/${year}`;
  } catch {
    return isoString;
  }
}

/**
 * Format time according to user preference.
 * Defaults to 24h ('24h') as required.
 */
export function formatShootTime(
  isoString: string,
  timeFormat: TimeFormat = '24h'
): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';

    if (timeFormat === '12h') {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    // Default 24h format: HH:mm
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/**
 * Calculate relative date label:
 * - Future shoots: "Today", "Tomorrow", "in 3d", "in Xd"
 * - Past shoots: "3d ago", "1d ago", "Today" (if earlier today)
 */
export function formatRelativeDateLabel(isoString: string, now: Date = new Date()): {
  text: string;
  isPast: boolean;
  diffDays: number;
} {
  try {
    const target = new Date(isoString);
    if (isNaN(target.getTime())) {
      return { text: isoString, isPast: false, diffDays: 0 };
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
    const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));
    const isPast = target.getTime() < now.getTime();

    if (isPast) {
      if (diffDays === 0) {
        return { text: 'Today', isPast: true, diffDays: 0 };
      }
      const absDays = Math.max(1, Math.abs(diffDays));
      return { text: `${absDays}d ago`, isPast: true, diffDays };
    }

    // Future shoots
    if (diffDays === 0) {
      return { text: 'Today', isPast: false, diffDays: 0 };
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow', isPast: false, diffDays: 1 };
    }
    return { text: `in ${diffDays}d`, isPast: false, diffDays };
  } catch {
    return { text: isoString, isPast: false, diffDays: 0 };
  }
}

// Backward compatible helper with exact requirement specifications
export function formatRelativeTime(isoString: string): { text: string; isPast: boolean; diffMinutes: number } {
  try {
    const shootTime = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = shootTime - now;
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const isPast = diffMs < 0;

    const rel = formatRelativeDateLabel(isoString);
    return {
      text: rel.text,
      isPast,
      diffMinutes,
    };
  } catch {
    return { text: isoString, isPast: false, diffMinutes: 0 };
  }
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Filter shoots whose date/time is in the future (date >= now), sorted ascending.
 */
export function getUpcomingShoots(shoots: Shoot[], now: Date = new Date()): Shoot[] {
  const nowMs = now.getTime();
  return shoots
    .filter((s) => new Date(s.dateTime).getTime() >= nowMs)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
}

/**
 * Filter past shoots whose date/time is in the past (date < now), sorted descending (most recent first).
 */
export function getPastShoots(shoots: Shoot[], now: Date = new Date()): Shoot[] {
  const nowMs = now.getTime();
  return shoots
    .filter((s) => new Date(s.dateTime).getTime() < nowMs)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

/**
 * Check if a shoot date is more than 14 days in the future.
 */
export function isMoreThan14DaysAway(isoString: string, now: Date = new Date()): boolean {
  try {
    const shootTime = new Date(isoString).getTime();
    const diffDays = (shootTime - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 14;
  } catch {
    return false;
  }
}

// Evaluate alerts based on Shoot and Packing List status
export function evaluateShootAlerts(
  shoots: Shoot[],
  packingList: PackingItem[],
  gearList: GearItem[],
  settings: AppSettings
): AlertNotification[] {
  const alerts: AlertNotification[] = [];
  const now = new Date();
  const gearMap = new Map(gearList.map((g) => [g.id, g]));

  // Only evaluate alerts for upcoming or current day shoots
  const upcomingShoots = shoots.filter((s) => {
    const sDate = new Date(s.dateTime);
    return sDate.getTime() >= now.getTime() - 2 * 60 * 60 * 1000;
  });

  upcomingShoots.forEach((shoot) => {
    const shootDate = new Date(shoot.dateTime);
    const shootPacking = packingList.filter((p) => p.shootId === shoot.id);
    const missingOrNeeded = shootPacking.filter(
      (p) => p.status === 'Needed' || p.status === 'Missing'
    );
    const missingNames = missingOrNeeded
      .map((p) => gearMap.get(p.gearId)?.name || 'Gear Item')
      .slice(0, 5);

    const diffMinutes = Math.round((shootDate.getTime() - now.getTime()) / (1000 * 60));

    // 1. Two-Hour Critical Alert: Shoot starts within 2 hours (120 mins) and has unpacked/missing items
    if (
      settings.enableTwoHourCriticalAlert &&
      diffMinutes > -60 &&
      diffMinutes <= 120 &&
      missingOrNeeded.length > 0
    ) {
      alerts.push({
        id: `alert-critical-${shoot.id}`,
        shootId: shoot.id,
        shootTitle: shoot.title,
        type: 'two_hour_critical',
        priority: 'critical',
        title: `CRITICAL GEAR ALERT: Shoot in ${Math.max(0, diffMinutes)}m`,
        message: `${missingOrNeeded.length} item(s) are NOT packed yet for "${shoot.title}". Pack immediately!`,
        missingItems: missingNames,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    // 2. Day-of-Shoot Morning Review Alert (if today is shoot day)
    if (settings.enableMorningAlerts && isSameDay(now, shootDate)) {
      alerts.push({
        id: `alert-morning-${shoot.id}`,
        shootId: shoot.id,
        shootTitle: shoot.title,
        type: 'morning_review',
        priority: 'high',
        title: `Morning Call: "${shoot.title}" Today`,
        message: `Your shoot with ${shoot.clientName} is today at ${formatShootTime(shoot.dateTime, settings.timeFormat)}. Review and finalize your gear packing list.`,
        missingItems: missingNames,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  return alerts;
}
