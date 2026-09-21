import React, { useState } from 'react';
import {
  X,
  Camera,
  Layers,
  Sparkles,
  Upload,
  Check,
  Search,
  ExternalLink,
  Cpu,
  Eye,
  Disc,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { GearItem } from '../../types';
import {
  ExifToolExtractedData,
  parseEquipmentExif,
  EXIFTOOL_PRESETS,
  ExifToolPreset,
} from '../../services/exiftoolService';

interface ExifToolInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportGear?: (gear: GearItem) => void;
  onImportBoth?: (camera: GearItem, lens: GearItem) => void;
  onAutoFillForm?: (data: ExifToolExtractedData) => void;
  initialData?: ExifToolExtractedData | null;
  mode?: 'vault_scanner' | 'form_autofill';
}

export const ExifToolInspectorModal: React.FC<ExifToolInspectorModalProps> = ({
  isOpen,
  onClose,
  onImportGear,
  onImportBoth,
  onAutoFillForm,
  initialData,
  mode = 'vault_scanner',
}) => {
  const [extractedData, setExtractedData] = useState<ExifToolExtractedData | null>(
    initialData || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [samplePreview, setSamplePreview] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'tags' | 'presets'>('summary');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Process a real uploaded file via ExifTool engine
  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setImportSuccess(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSamplePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const data = await parseEquipmentExif(file);
      setExtractedData(data);
      setActiveTab('summary');
    } catch (err) {
      console.error('Failed to parse EXIF with ExifTool engine:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load one of Phil Harvey ExifTool standard camera test presets
  const handleLoadPreset = (preset: ExifToolPreset) => {
    setIsProcessing(true);
    setSamplePreview(preset.sampleImageUrl);
    setImportSuccess(null);

    setTimeout(() => {
      const cameraNotes = `Firmware: ${preset.firmware} • Shutter Actuations: ${preset.shutterCount.toLocaleString()} • Verified via ExifTool`;
      const lensNotes = `Model: ${preset.lensModel} • Max Aperture: ${preset.aperture} • Focal Length: ${preset.focalLength}`;

      const mockExtracted: ExifToolExtractedData = {
        make: preset.brand,
        model: preset.cameraName,
        lensModel: preset.lensModel,
        lensMake: preset.brand,
        bodySerialNumber: preset.bodySerialNumber,
        lensSerialNumber: preset.lensSerialNumber,
        shutterCount: preset.shutterCount,
        software: preset.firmware,
        focalLength: preset.focalLength,
        fNumber: parseFloat(preset.aperture.replace('f/', '')),
        iso: preset.iso,
        exposureTime: preset.shutterSpeed,
        dateTimeOriginal: new Date().toISOString(),
        rawTags: preset.exifToolDump,
        suggestedGear: {
          camera: {
            name: preset.cameraName,
            brand: preset.brand,
            category: 'Camera Body',
            serialNumber: preset.bodySerialNumber,
            notes: cameraNotes,
          },
          lens: {
            name: preset.lensModel,
            brand: preset.brand,
            category: 'Lens',
            serialNumber: preset.lensSerialNumber,
            notes: lensNotes,
          },
        },
      };

      setExtractedData(mockExtracted);
      setIsProcessing(false);
      setActiveTab('summary');
    }, 250);
  };

  const handleCopyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedTag(key);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Import Camera to Vault
  const handleImportCamera = () => {
    if (!extractedData?.suggestedGear.camera || !onImportGear) return;
    const cam = extractedData.suggestedGear.camera;
    const gearItem: GearItem = {
      id: `gear-${Date.now()}-cam`,
      name: cam.name,
      category: 'Camera Body',
      brand: cam.brand,
      serialNumber: cam.serialNumber || 'SN-UNVERIFIED',
      image: samplePreview || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      notes: cam.notes,
      createdAt: new Date().toISOString(),
      exifMetadata: {
        cameraMake: extractedData.make,
        cameraModel: extractedData.model,
        bodySerialNumber: extractedData.bodySerialNumber,
        shutterCount: extractedData.shutterCount,
        firmwareVersion: extractedData.software,
        rawTags: extractedData.rawTags,
        verifiedAt: new Date().toISOString(),
      },
    };
    onImportGear(gearItem);
    setImportSuccess('Camera body added to Vault!');
    setTimeout(() => setImportSuccess(null), 3000);
  };

  // Import Lens to Vault
  const handleImportLens = () => {
    if (!extractedData?.suggestedGear.lens || !onImportGear) return;
    const lens = extractedData.suggestedGear.lens;
    const gearItem: GearItem = {
      id: `gear-${Date.now()}-lens`,
      name: lens.name,
      category: 'Lens',
      brand: lens.brand,
      serialNumber: lens.serialNumber || 'SN-UNVERIFIED',
      image: samplePreview || 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80',
      notes: lens.notes,
      createdAt: new Date().toISOString(),
      exifMetadata: {
        lensModel: extractedData.lensModel,
        lensSerialNumber: extractedData.lensSerialNumber,
        focalLength: String(extractedData.focalLength || ''),
        maxAperture: extractedData.fNumber ? `f/${extractedData.fNumber}` : undefined,
        rawTags: extractedData.rawTags,
        verifiedAt: new Date().toISOString(),
      },
    };
    onImportGear(gearItem);
    setImportSuccess('Lens added to Vault!');
    setTimeout(() => setImportSuccess(null), 3000);
  };

  // Import Both Camera & Lens
  const handleImportBoth = () => {
    if (
      !extractedData?.suggestedGear.camera ||
      !extractedData?.suggestedGear.lens
    )
      return;

    const cam = extractedData.suggestedGear.camera;
    const lens = extractedData.suggestedGear.lens;

    const camItem: GearItem = {
      id: `gear-${Date.now()}-cam`,
      name: cam.name,
      category: 'Camera Body',
      brand: cam.brand,
      serialNumber: cam.serialNumber || 'SN-UNVERIFIED',
      image: samplePreview || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
      notes: cam.notes,
      createdAt: new Date().toISOString(),
      exifMetadata: {
        cameraMake: extractedData.make,
        cameraModel: extractedData.model,
        bodySerialNumber: extractedData.bodySerialNumber,
        shutterCount: extractedData.shutterCount,
        firmwareVersion: extractedData.software,
        rawTags: extractedData.rawTags,
        verifiedAt: new Date().toISOString(),
      },
    };

    const lensItem: GearItem = {
      id: `gear-${Date.now() + 1}-lens`,
      name: lens.name,
      category: 'Lens',
      brand: lens.brand,
      serialNumber: lens.serialNumber || 'SN-UNVERIFIED',
      image: samplePreview || 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80',
      notes: lens.notes,
      createdAt: new Date().toISOString(),
      exifMetadata: {
        lensModel: extractedData.lensModel,
        lensSerialNumber: extractedData.lensSerialNumber,
        focalLength: String(extractedData.focalLength || ''),
        maxAperture: extractedData.fNumber ? `f/${extractedData.fNumber}` : undefined,
        rawTags: extractedData.rawTags,
        verifiedAt: new Date().toISOString(),
      },
    };

    if (onImportBoth) {
      onImportBoth(camItem, lensItem);
    } else if (onImportGear) {
      onImportGear(camItem);
      onImportGear(lensItem);
    }

    setImportSuccess('Both Camera and Lens imported into Vault!');
    setTimeout(() => {
      setImportSuccess(null);
      onClose();
    }, 1500);
  };

  const handleApplyToForm = () => {
    if (extractedData && onAutoFillForm) {
      onAutoFillForm(extractedData);
      onClose();
    }
  };

  // Filter raw tags
  const rawTagEntries = Object.entries(extractedData?.rawTags || {});
  const filteredTags = rawTagEntries.filter(([k, v]) => {
    if (!tagSearch) return true;
    const q = tagSearch.toLowerCase();
    return k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q);
  });

  return (
    <div
      id="exiftool-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4"
    >
      <div
        id="exiftool-modal-content"
        className="w-full max-w-xl bg-white border border-slate-200 rounded-t-[32px] sm:rounded-[32px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-[#F29191] to-[#F7ADAD] text-white shadow-md shadow-[#F29191]/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-tight font-display">
                  ExifTool Equipment Engine
                </h2>
                <a
                  href="https://exiftool.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[#CCFBFA] font-mono transition-colors"
                  title="Official ExifTool by Phil Harvey"
                >
                  <span>exiftool.org</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <p className="text-[11px] text-slate-300">
                Extract camera body, lens optics, serial numbers & shutter actuations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner if imported */}
        {importSuccess && (
          <div className="bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Extracted Gear Specs
            </button>
            <button
              onClick={() => setActiveTab('tags')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all ${
                activeTab === 'tags'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              Raw ExifTool Tags ({rawTagEntries.length})
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 ${
                activeTab === 'presets'
                  ? 'bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-xs'
                  : 'text-[#D45B5B] hover:bg-[#FFF0F0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample Cameras</span>
            </button>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-[#F29191] text-slate-700 text-[11px] font-bold shadow-xs transition-colors">
            <Upload className="w-3 h-3 text-[#D45B5B]" />
            <span>Scan Photo</span>
            <input
              type="file"
              accept="image/*,.cr2,.cr3,.nef,.arw,.dng,.orf,.raf,.rw2,.tiff"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 scrollbar-none">
          {isProcessing ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <div className="w-10 h-10 border-3 border-[#F29191] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-900">
                  ExifTool Decoding Metadata...
                </p>
                <p className="text-[11px] text-slate-500">
                  Reading TIFF, EXIF, MakerNotes & Composite tags
                </p>
              </div>
            </div>
          ) : activeTab === 'presets' ? (
            /* Presets View */
            <div className="space-y-3">
              <div className="p-3 bg-[#CCFBFA]/40 border border-[#B1E5E6] rounded-2xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0F4E50] shrink-0 mt-0.5" />
                <p className="text-xs text-[#0F4E50] leading-relaxed">
                  Select a flagship camera sample below to inspect its exact ExifTool tag table, serial numbers, optical parameters, and shutter count.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EXIFTOOL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleLoadPreset(preset)}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#F29191] text-left transition-all hover:shadow-md flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <img
                        src={preset.sampleImageUrl}
                        alt={preset.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono uppercase font-bold text-[#D45B5B]">
                          {preset.brand}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {preset.cameraName}
                        </h4>
                        <p className="text-[10px] text-slate-500 truncate">
                          {preset.lensModel}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>SN: {preset.bodySerialNumber}</span>
                      <span className="text-emerald-700 font-bold">
                        {preset.shutterCount.toLocaleString()} acts
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : activeTab === 'tags' ? (
            /* Raw ExifTool Tags */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter ExifTool tags (e.g. Serial, Shutter, Lens, ISO)..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#F29191]"
                />
              </div>

              {filteredTags.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No ExifTool tags matching "{tagSearch}".
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs font-mono max-h-96 overflow-y-auto">
                  {filteredTags.map(([k, v]) => (
                    <div
                      key={k}
                      onClick={() => handleCopyValue(String(v), k)}
                      className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                      title="Click to copy tag value"
                    >
                      <span className="font-bold text-slate-700 truncate mr-3">
                        {k}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-900 font-medium truncate max-w-xs text-right">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                        {copiedTag === k ? (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            Copied!
                          </span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">
                            Copy
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : extractedData ? (
            /* Summary & Hardware Identification */
            <div className="space-y-4">
              {/* Camera Body Card */}
              {extractedData.suggestedGear.camera && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD]">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#D45B5B] font-mono">
                          Camera Body Detected
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {extractedData.suggestedGear.camera.name}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>ExifTool Verified</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Body Serial Number
                      </span>
                      <span className="font-bold text-slate-800">
                        {extractedData.bodySerialNumber || 'None embedded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Shutter Actuations
                      </span>
                      <span className="font-bold text-slate-800">
                        {extractedData.shutterCount
                          ? `${extractedData.shutterCount.toLocaleString()} clicks`
                          : 'Electronic / Unlogged'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Firmware / Software
                      </span>
                      <span className="font-bold text-slate-800 truncate block">
                        {extractedData.software || 'Stock OS'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Exposure / ISO
                      </span>
                      <span className="font-bold text-slate-800">
                        {extractedData.exposureTime || '—'}, ISO {extractedData.iso || '—'}
                      </span>
                    </div>
                  </div>

                  {mode === 'vault_scanner' && onImportGear && (
                    <button
                      onClick={handleImportCamera}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Add Camera Body to Vault
                    </button>
                  )}
                </div>
              )}

              {/* Lens Optics Card */}
              {extractedData.suggestedGear.lens && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#CCFBFA] text-[#0F4E50] border border-[#B1E5E6]">
                        <Disc className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F4E50] font-mono">
                          Lens Optics Detected
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">
                          {extractedData.suggestedGear.lens.name}
                        </h3>
                      </div>
                    </div>

                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold font-mono">
                      Mounted
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Lens Serial Number
                      </span>
                      <span className="font-bold text-slate-800">
                        {extractedData.lensSerialNumber || 'None embedded'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block">
                        Aperture / Focal Length
                      </span>
                      <span className="font-bold text-slate-800">
                        {extractedData.fNumber ? `f/${extractedData.fNumber}` : '—'} @ {extractedData.focalLength || '—'}mm
                      </span>
                    </div>
                  </div>

                  {mode === 'vault_scanner' && onImportGear && (
                    <button
                      onClick={handleImportLens}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Add Lens to Vault
                    </button>
                  )}
                </div>
              )}

              {/* Sample Photo Preview info */}
              {samplePreview && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <img
                    src={samplePreview}
                    alt="Sample test shot"
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-slate-900">Sample Test Image Loaded</p>
                    <p className="text-[11px] text-slate-500">
                      {rawTagEntries.length} ExifTool metadata tags decoded and mapped.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#FFF0F0] text-[#D45B5B] border border-[#F7ADAD] mx-auto flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Scan Camera Test Shot
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Drop a photo from your camera or choose a flagship camera preset. ExifTool will read the camera model, lens, serial numbers, and shutter count.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => handleLoadPreset(EXIFTOOL_PRESETS[0])}
                  className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-bold shadow-xs hover:bg-slate-800 transition-colors"
                >
                  Try Sony A7R V Preset
                </button>
                <button
                  onClick={() => handleLoadPreset(EXIFTOOL_PRESETS[1])}
                  className="px-4 py-2 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Try Canon R5 Preset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ExifTool v13.10 Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>

            {mode === 'form_autofill' && extractedData && (
              <button
                type="button"
                onClick={handleApplyToForm}
                className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                <span>Auto-Fill Gear Form</span>
              </button>
            )}

            {mode === 'vault_scanner' &&
              extractedData?.suggestedGear.camera &&
              extractedData?.suggestedGear.lens && (
                <button
                  type="button"
                  onClick={handleImportBoth}
                  className="px-5 py-2.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-[#F29191] to-[#F7ADAD] text-white shadow-md shadow-[#F29191]/30 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Import Camera & Lens (1-Click)</span>
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
