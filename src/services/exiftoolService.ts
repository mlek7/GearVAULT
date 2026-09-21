import exifr from 'exifr';

export interface ExifToolExtractedData {
  make?: string;
  model?: string;
  lensModel?: string;
  lensMake?: string;
  bodySerialNumber?: string;
  lensSerialNumber?: string;
  shutterCount?: number;
  software?: string; // Firmware
  focalLength?: string | number;
  focalLengthIn35mm?: number;
  fNumber?: number;
  iso?: number;
  exposureTime?: string | number;
  dateTimeOriginal?: string;
  exposureProgram?: string;
  meteringMode?: string;
  whiteBalance?: string;
  colorSpace?: string;
  ownerName?: string;
  rawTags: Record<string, any>;
  suggestedGear: {
    camera?: {
      name: string;
      brand: string;
      category: 'Camera Body';
      serialNumber: string;
      notes: string;
    };
    lens?: {
      name: string;
      brand: string;
      category: 'Lens';
      serialNumber: string;
      notes: string;
    };
  };
}

/**
 * Parses image metadata following ExifTool standard tag conventions (exiftool.org).
 * Extracts Camera Body, Lens, Serial Numbers, Shutter Count, and Optical Specs.
 */
export async function parseEquipmentExif(
  fileOrUrl: File | Blob | string
): Promise<ExifToolExtractedData> {
  let raw: Record<string, any> = {};

  try {
    // Attempt parsing using exifr with standard ExifTool tag sets
    const parsed = await exifr.parse(fileOrUrl, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      makerNote: true,
      translateKeys: true,
      translateValues: true,
      mergeOutput: true,
      silentErrors: true,
    });

    if (parsed && typeof parsed === 'object') {
      raw = parsed;
    }
  } catch (err) {
    console.warn('ExifTool parser warning (falling back to tag scanner):', err);
  }

  // If exifr found tags, or if fallback is needed, map to ExifTool standards
  const make = raw.Make || raw.make || raw['ExifTool:Make'];
  const model = raw.Model || raw.model || raw['ExifTool:Model'];
  const lensModel =
    raw.LensModel ||
    raw.Lens ||
    raw.lensModel ||
    raw['ExifTool:LensModel'] ||
    raw['Aux:Lens'] ||
    raw['LensType'];
  const lensMake = raw.LensMake || raw.lensMake || raw['ExifTool:LensMake'] || make;

  // Serial number detection (Cameras record this under different standard ExifTool tags)
  const bodySerialNumber =
    raw.BodySerialNumber ||
    raw.SerialNumber ||
    raw.CameraSerialNumber ||
    raw.InternalSerialNumber ||
    raw['ExifTool:SerialNumber'] ||
    raw['ExifTool:BodySerialNumber'] ||
    raw['Aux:SerialNumber'] ||
    '';

  const lensSerialNumber =
    raw.LensSerialNumber ||
    raw['ExifTool:LensSerialNumber'] ||
    raw['Aux:LensSerialNumber'] ||
    '';

  // Shutter count from MakerNotes or Composite tags
  const shutterCount =
    typeof raw.ShutterCount === 'number'
      ? raw.ShutterCount
      : typeof raw.ImageCount === 'number'
      ? raw.ImageCount
      : typeof raw.ShutterActuations === 'number'
      ? raw.ShutterActuations
      : undefined;

  const software = raw.Software || raw.FirmwareVersion || raw['ExifTool:Software'] || '';
  const focalLength = raw.FocalLength || raw['ExifTool:FocalLength'];
  const focalLengthIn35mm = raw.FocalLengthIn35mmFormat || raw.FocalLength35efl;
  const fNumber = raw.FNumber || raw.ApertureValue;
  const iso = raw.ISO || raw.ISOSpeedRatings;

  let exposureTime: string | number | undefined = raw.ExposureTime;
  if (typeof exposureTime === 'number' && exposureTime > 0 && exposureTime < 1) {
    exposureTime = `1/${Math.round(1 / exposureTime)}s`;
  } else if (exposureTime) {
    exposureTime = `${exposureTime}s`;
  }

  const dateTimeOriginal = raw.DateTimeOriginal
    ? raw.DateTimeOriginal instanceof Date
      ? raw.DateTimeOriginal.toISOString()
      : String(raw.DateTimeOriginal)
    : undefined;

  const ownerName = raw.CameraOwnerName || raw.Artist || raw.OwnerName || '';

  // Construct suggested gear items
  const cleanBrand = make ? String(make).trim() : 'Professional';
  const cleanModel = model ? String(model).trim() : 'Digital Camera Body';

  const cameraNotes = [
    software ? `Firmware: ${software}` : '',
    shutterCount ? `Shutter Actuations: ${shutterCount.toLocaleString()}` : '',
    ownerName ? `Registered Owner: ${ownerName}` : '',
    dateTimeOriginal ? `Verified with sample shot taken on ${new Date(dateTimeOriginal).toLocaleDateString()}` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const lensNotes = [
    lensModel ? `Model: ${lensModel}` : '',
    fNumber ? `Max Aperture: f/${fNumber}` : '',
    focalLength ? `Focal Length: ${focalLength}mm` : '',
    focalLengthIn35mm ? `35mm Equivalent: ${focalLengthIn35mm}mm` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const result: ExifToolExtractedData = {
    make: make ? String(make).trim() : undefined,
    model: model ? String(model).trim() : undefined,
    lensModel: lensModel ? String(lensModel).trim() : undefined,
    lensMake: lensMake ? String(lensMake).trim() : undefined,
    bodySerialNumber: bodySerialNumber ? String(bodySerialNumber).trim() : undefined,
    lensSerialNumber: lensSerialNumber ? String(lensSerialNumber).trim() : undefined,
    shutterCount,
    software: software ? String(software).trim() : undefined,
    focalLength,
    focalLengthIn35mm,
    fNumber: typeof fNumber === 'number' ? fNumber : undefined,
    iso: typeof iso === 'number' ? iso : undefined,
    exposureTime,
    dateTimeOriginal,
    ownerName: ownerName ? String(ownerName).trim() : undefined,
    rawTags: raw,
    suggestedGear: {
      camera: cleanModel
        ? {
            name: cleanModel.toLowerCase().includes(cleanBrand.toLowerCase())
              ? cleanModel
              : `${cleanBrand} ${cleanModel}`,
            brand: cleanBrand,
            category: 'Camera Body',
            serialNumber: String(bodySerialNumber || '').trim(),
            notes: cameraNotes || 'Imported via ExifTool metadata inspection.',
          }
        : undefined,
      lens: lensModel
        ? {
            name: String(lensModel).trim(),
            brand: lensMake ? String(lensMake).trim() : cleanBrand,
            category: 'Lens',
            serialNumber: String(lensSerialNumber || '').trim(),
            notes: lensNotes || 'Imported via ExifTool optical inspection.',
          }
        : undefined,
    },
  };

  return result;
}

/**
 * Realistic ExifTool test presets matching Phil Harvey's ExifTool standard tag dumps
 * for instant testing without needing an actual high-res RAW camera file.
 */
export interface ExifToolPreset {
  id: string;
  name: string;
  sampleImageUrl: string;
  cameraName: string;
  brand: string;
  category: 'Camera Body' | 'Lens';
  bodySerialNumber: string;
  lensModel: string;
  lensSerialNumber: string;
  shutterCount: number;
  firmware: string;
  focalLength: string;
  aperture: string;
  iso: number;
  shutterSpeed: string;
  exifToolDump: Record<string, any>;
}

export const EXIFTOOL_PRESETS: ExifToolPreset[] = [
  {
    id: 'sony-a7rv',
    name: 'Sony Alpha 7R V + FE 24-70mm GM II',
    sampleImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    cameraName: 'Sony ILCE-7RM5 (Alpha 7R V)',
    brand: 'Sony',
    category: 'Camera Body',
    bodySerialNumber: 'SN-4820194',
    lensModel: 'Sony FE 24-70mm F2.8 GM II (SEL2470GM2)',
    lensSerialNumber: 'L-1903821',
    shutterCount: 14280,
    firmware: 'Ver. 2.01',
    focalLength: '50mm',
    aperture: 'f/2.8',
    iso: 100,
    shutterSpeed: '1/250s',
    exifToolDump: {
      'ExifTool:VersionNumber': 13.10,
      'File:FileType': 'JPEG',
      'File:MIMEType': 'image/jpeg',
      'EXIF:Make': 'Sony',
      'EXIF:Model': 'ILCE-7RM5',
      'EXIF:Software': 'ILCE-7RM5 v2.01',
      'EXIF:BodySerialNumber': '4820194',
      'EXIF:LensModel': 'FE 24-70mm F2.8 GM II',
      'EXIF:LensSerialNumber': '1903821',
      'MakerNotes:SonyShutterCount': 14280,
      'EXIF:ExposureTime': '1/250',
      'EXIF:FNumber': 2.8,
      'EXIF:ISO': 100,
      'EXIF:FocalLength': '50.0 mm',
      'EXIF:FocalLengthIn35mmFormat': '50 mm',
      'Composite:Aperture': 2.8,
      'Composite:ShutterSpeed': '1/250',
      'Composite:LightValue': 11.0,
      'EXIF:ExposureProgram': 'Manual',
      'EXIF:MeteringMode': 'Multi-segment',
      'EXIF:WhiteBalance': 'Daylight',
      'MakerNotes:FocusMode': 'AF-C',
      'MakerNotes:SonyImageQuality': 'RAW + Extra Fine JPEG',
      'MakerNotes:AntiBlur': '5-axis SteadyShot Active',
    },
  },
  {
    id: 'canon-r5',
    name: 'Canon EOS R5 + RF 50mm F1.2 L USM',
    sampleImageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80',
    cameraName: 'Canon EOS R5',
    brand: 'Canon',
    category: 'Camera Body',
    bodySerialNumber: 'CN-0938201103',
    lensModel: 'Canon RF 50mm F1.2 L USM',
    lensSerialNumber: 'RF-8829104',
    shutterCount: 8940,
    firmware: 'Firmware Version 1.9.0',
    focalLength: '50mm',
    aperture: 'f/1.2',
    iso: 200,
    shutterSpeed: '1/1000s',
    exifToolDump: {
      'ExifTool:VersionNumber': 13.10,
      'File:FileType': 'CR3',
      'EXIF:Make': 'Canon',
      'EXIF:Model': 'Canon EOS R5',
      'EXIF:SerialNumber': '0938201103',
      'EXIF:LensModel': 'RF50mm F1.2 L USM',
      'EXIF:LensSerialNumber': '8829104',
      'MakerNotes:CanonFirmwareVersion': '1.9.0',
      'MakerNotes:ShutterCount': 8940,
      'EXIF:ExposureTime': '1/1000',
      'EXIF:FNumber': 1.2,
      'EXIF:ISO': 200,
      'EXIF:FocalLength': '50.0 mm',
      'Composite:CircleOfConfusion': '0.030 mm',
      'Composite:FOV': '39.6 deg',
      'Composite:HyperfocalDistance': '69.4 m',
      'MakerNotes:AFPointSelected': 'Eye Detection AF',
      'MakerNotes:DualPixelRAW': 'Enabled',
    },
  },
  {
    id: 'nikon-z8',
    name: 'Nikon Z 8 + NIKKOR Z 85mm f/1.2 S',
    sampleImageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
    cameraName: 'Nikon Z 8',
    brand: 'Nikon',
    category: 'Camera Body',
    bodySerialNumber: 'NK-6003921',
    lensModel: 'NIKKOR Z 85mm f/1.2 S',
    lensSerialNumber: 'NZ-2009418',
    shutterCount: 5120,
    firmware: 'C:2.00',
    focalLength: '85mm',
    aperture: 'f/1.2',
    iso: 64,
    shutterSpeed: '1/1600s',
    exifToolDump: {
      'ExifTool:VersionNumber': 13.10,
      'File:FileType': 'NEF',
      'EXIF:Make': 'NIKON CORPORATION',
      'EXIF:Model': 'NIKON Z 8',
      'EXIF:SerialNumber': '6003921',
      'EXIF:LensModel': 'NIKKOR Z 85mm f/1.2 S',
      'EXIF:LensSerialNumber': '2009418',
      'MakerNotes:ShutterCount': 5120,
      'EXIF:Software': 'Z 8 Ver.02.00',
      'EXIF:ExposureTime': '1/1600',
      'EXIF:FNumber': 1.2,
      'EXIF:ISO': 64,
      'EXIF:FocalLength': '85.0 mm',
      'MakerNotes:ShootingMode': 'Electronic Shutter Only (Sensor Shield Closed at Off)',
      'MakerNotes:ColorSpace': 'sRGB',
      'MakerNotes:VibrationReduction': 'Normal (Synchro VR)',
    },
  },
  {
    id: 'fujifilm-xt5',
    name: 'Fujifilm X-T5 + XF 56mm f/1.2 R WR',
    sampleImageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80',
    cameraName: 'FUJIFILM X-T5',
    brand: 'Fujifilm',
    category: 'Camera Body',
    bodySerialNumber: 'FJ-2DA03912',
    lensModel: 'XF56mmF1.2 R WR',
    lensSerialNumber: 'XF-701923',
    shutterCount: 3410,
    firmware: 'Ver. 3.01',
    focalLength: '56mm',
    aperture: 'f/1.2',
    iso: 125,
    shutterSpeed: '1/500s',
    exifToolDump: {
      'ExifTool:VersionNumber': 13.10,
      'File:FileType': 'RAF',
      'EXIF:Make': 'FUJIFILM',
      'EXIF:Model': 'X-T5',
      'EXIF:InternalSerialNumber': '2DA03912',
      'EXIF:LensModel': 'XF56mmF1.2 R WR',
      'EXIF:LensSerialNumber': '701923',
      'MakerNotes:ImageCount': 3410,
      'EXIF:Software': 'Digital Camera X-T5 Ver3.01',
      'EXIF:FNumber': 1.2,
      'EXIF:ExposureTime': '1/500',
      'EXIF:ISO': 125,
      'EXIF:FocalLength': '56.0 mm',
      'MakerNotes:FilmMode': 'Classic Chrome',
      'MakerNotes:DynamicRange': 'Standard (100%)',
    },
  },
];
