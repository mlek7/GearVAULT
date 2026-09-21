import { Shoot, PackingItem, GearItem, AlertNotification, AppSettings } from '../types';

export function formatShootDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatShootTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

export function formatRelativeTime(isoString: string): { text: string; isPast: boolean; diffMinutes: number } {
  try {
    const shootTime = new Date(isoString).getTime();
    const now = Date.now();
    const diffMs = shootTime - now;
    const diffMinutes = Math.round(diffMs / (1000 * 60));

    if (diffMinutes < 0) {
      const absMin = Math.abs(diffMinutes);
      if (absMin < 60) return { text: `${absMin}m ago`, isPast: true, diffMinutes };
      const hours = Math.floor(absMin / 60);
      if (hours < 24) return { text: `${hours}h ago`, isPast: true, diffMinutes };
      const days = Math.floor(hours / 24);
      return { text: `${days}d ago`, isPast: true, diffMinutes };
    }

    if (diffMinutes < 60) return { text: `in ${diffMinutes}m`, isPast: false, diffMinutes };
    const hours = Math.floor(diffMinutes / 60);
    const remMinutes = diffMinutes % 60;
    if (hours < 24) {
      return {
        text: remMinutes > 0 ? `in ${hours}h ${remMinutes}m` : `in ${hours}h`,
        isPast: false,
        diffMinutes,
      };
    }
    const days = Math.floor(hours / 24);
    return { text: `in ${days} days`, isPast: false, diffMinutes };
  } catch {
    return { text: isoString, isPast: false, diffMinutes: 9999 };
  }
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
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

  shoots.forEach((shoot) => {
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
        message: `Your shoot with ${shoot.clientName} is today at ${formatShootTime(shoot.dateTime)}. Review and finalize your gear packing list.`,
        missingItems: missingNames,
        timestamp: new Date().toISOString(),
        read: false,
      });
    }
  });

  return alerts;
}
