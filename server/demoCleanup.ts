import fs from 'fs';
import path from 'path';

export const SEED_GEAR_IDS = new Set([
  'gear-1',
  'gear-2',
  'gear-3',
  'gear-4',
  'gear-5',
  'gear-6',
  'gear-7',
  'gear-8',
  'gear-9',
  'gear-10',
  'gear-11',
  'gear-12',
  'gear-13',
]);

export const SEED_SHOOT_IDS = new Set([
  'shoot-1',
  'shoot-2',
  'shoot-3',
  'shoot-4',
  'shoot-5',
]);

export const SEED_PACKING_IDS = new Set([
  'pack-1-1', 'pack-1-2', 'pack-1-3', 'pack-1-4', 'pack-1-5', 'pack-1-6', 'pack-1-7', 'pack-1-8',
  'pack-2-1', 'pack-2-2', 'pack-2-3', 'pack-2-4', 'pack-2-5', 'pack-2-6', 'pack-2-7',
  'pack-3-1', 'pack-3-2', 'pack-3-3',
]);

export const SEED_MOODBOARD_IDS = new Set([
  'mb-1-1',
  'mb-1-2',
  'mb-1-3',
  'mb-1-4',
  'mb-2-1',
  'mb-2-2',
]);

export const SEED_SERIAL_NUMBERS = new Set([
  'SN-S1-904821',
  'SN-FX-339102',
  'SN-GM-771829',
  'SN-GM-449103',
  'SN-GM-501294',
  'SN-PF-882049',
  'SN-GD-200847',
  'SN-DJ-903481',
  'SN-BT-FZ100X4',
  'SN-CF-160TGH',
  'SN-PD-772910',
  'SN-PP-82VND',
]);

export const DEMO_GEAR_NAMES = [
  'Sony Alpha 1 Flagship Mirrorless Body',
  'Sony Alpha 1 Flagship Mirrorless Body (18,420 acts)',
  'Sony FX3 Cinema Line Camera',
  'Sony FX3 Cinema Line Camera (6,140 acts)',
  'Sony FE 24-70mm f/2.8 GM II',
  'Sony FE 70-200mm f/2.8 GM OSS II',
  'Sony FE 50mm f/1.2 GM Prime',
  'Profoto B10X Plus 500Ws AirTTL Monolight',
  'Godox AD200Pro II Pocket Flash Kit',
  'DJI Mic 2 Wireless Microphone (2 TX + 1 RX)',
  'Sennheiser MKE 600 Shotgun Microphone',
  'Sony NP-FZ100 Batteries (Set of 4 + Dual Charger)',
  'Sony TOUGH CFexpress Type A 160GB (x2)',
  'Peak Design Carbon Fiber Travel Tripod',
  'PolarPro PMVND 82mm (2-5 Stop Edition II)',
];

export const DEMO_SHOOT_TITLES = [
  'Autumn Golden Hour Editorial',
  'Elena & Marcus Vineyard Wedding',
  'AeroTech High-Performance Brand Shoot',
  'Studio Portrait Sessions: Founders Cohort',
  'Marin Headlands Elopement',
  'Editorial Lookbook Spring/Summer',
  'Napa Valley Sunset Wedding',
  'Pacific Heights Architecture',
];

export function isDemoGear(item: any): boolean {
  if (!item) return false;
  const name = String(item.name || '').trim().toLowerCase();
  const brand = String(item.brand || '').trim().toLowerCase();
  const serial = String(item.serialNumber || '').trim();

  // CRITICAL: NEVER delete user's X-T3 or fujifilm items!
  if (name.includes('x-t3') || name.includes('fujifil') || brand.includes('fujifil')) {
    return false;
  }

  // If added by user from database search (CineD or Lightbag DB), KEEP IT!
  if ((item.source === 'cined' || item.source === 'lightbag-db') && !SEED_GEAR_IDS.has(item.id)) {
    return false;
  }

  // Match by seed ID
  if (SEED_GEAR_IDS.has(item.id)) {
    return true;
  }

  // Match by seed serial numbers
  if (serial && SEED_SERIAL_NUMBERS.has(serial)) {
    return true;
  }

  // Match by exact or normalized demo name
  for (const demo of DEMO_GEAR_NAMES) {
    const dLower = demo.toLowerCase();
    if (name === dLower || name.startsWith(dLower)) {
      return true;
    }
  }

  return false;
}

export function isDemoShoot(shoot: any): boolean {
  if (!shoot) return false;
  if (SEED_SHOOT_IDS.has(shoot.id)) return true;
  const title = String(shoot.title || '').trim().toLowerCase();
  return DEMO_SHOOT_TITLES.some((d) => {
    const dLower = d.toLowerCase();
    return title === dLower || title.startsWith(dLower);
  });
}

export function isDemoPacking(item: any): boolean {
  if (!item) return false;
  if (SEED_PACKING_IDS.has(item.id)) return true;
  if (SEED_SHOOT_IDS.has(item.shootId)) return true;
  if (SEED_GEAR_IDS.has(item.gearId)) return true;
  return false;
}

export function isDemoMoodboard(item: any): boolean {
  if (!item) return false;
  if (SEED_MOODBOARD_IDS.has(item.id)) return true;
  if (SEED_SHOOT_IDS.has(item.shootId)) return true;
  if (typeof item.id === 'string' && (item.id.startsWith('mb-1-') || item.id.startsWith('mb-2-'))) {
    return true;
  }
  return false;
}

export function sanitizeVaultData(vaultData: any): any {
  if (!vaultData || typeof vaultData !== 'object') return vaultData;

  const cleaned = { ...vaultData };

  if (Array.isArray(cleaned.gear)) {
    cleaned.gear = cleaned.gear.filter((item: any) => !isDemoGear(item));
  } else {
    cleaned.gear = [];
  }

  if (Array.isArray(cleaned.shoots)) {
    cleaned.shoots = cleaned.shoots.filter((shoot: any) => !isDemoShoot(shoot));
  } else {
    cleaned.shoots = [];
  }

  if (Array.isArray(cleaned.packing)) {
    cleaned.packing = cleaned.packing.filter((item: any) => !isDemoPacking(item));
  } else {
    cleaned.packing = [];
  }

  if (Array.isArray(cleaned.moodboards)) {
    cleaned.moodboards = cleaned.moodboards.filter((item: any) => !isDemoMoodboard(item));
  } else {
    cleaned.moodboards = [];
  }

  if (cleaned.settings && typeof cleaned.settings === 'object') {
    const s = { ...cleaned.settings };
    if (s.photographerName === 'Alex Rivera') s.photographerName = '';
    if (s.studioName === 'Lumina Studio SF' || s.studioName === 'Photo Studio Vault') s.studioName = '';
    cleaned.settings = s;
  }

  return cleaned;
}

export function sanitizeAllVaultFilesOnDisk(vaultsDir: string): void {
  try {
    if (!fs.existsSync(vaultsDir)) return;
    const files = fs.readdirSync(vaultsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = path.join(vaultsDir, file);
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const cleaned = sanitizeVaultData(parsed);
        fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf-8');
      } catch (err) {
        console.warn(`Could not sanitize vault file ${file}:`, err);
      }
    }
    console.log(`[DemoCleanup] Completed vault files sanitization on disk (${files.length} checked)`);
  } catch (err) {
    console.error('[DemoCleanup] Error cleaning vaults on disk:', err);
  }
}
