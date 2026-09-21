const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makePng(width, height, colorGen) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  let p = 0;
  for (let y = 0; y < height; y++) {
    raw[p++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorGen(x, y, width, height);
      raw[p++] = r;
      raw[p++] = g;
      raw[p++] = b;
      raw[p++] = a;
    }
  }
  const compressed = zlib.deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const combined = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(combined), 0);
    return Buffer.concat([len, combined, crcBuf]);
  }
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function renderAppIcon(isMaskable) {
  return (x, y, width, height) => {
    // Normalize coordinates -1 to 1
    const nx = (x / width) * 2 - 1;
    const ny = (y / height) * 2 - 1;
    const r = Math.sqrt(nx * nx + ny * ny);

    // Gradient background: Coral Rose (#F29191: 242, 145, 145) to Soft Blush (#F7ADAD: 247, 173, 173)
    const t = (nx + ny + 2) / 4;
    const bgR = Math.round(242 + (247 - 242) * t);
    const bgG = Math.round(145 + (173 - 145) * t);
    const bgB = Math.round(145 + (173 - 145) * t);

    // If not maskable, round corners (squircle / iOS rounded rect)
    if (!isMaskable) {
      const cornerR = 0.22;
      const qx = Math.max(0, Math.abs(nx) - (1 - cornerR));
      const qy = Math.max(0, Math.abs(ny) - (1 - cornerR));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);
      if (cornerDist > cornerR) {
        return [0, 0, 0, 0]; // Transparent outside
      }
    }

    // Camera body outline
    // Main body: centered rect from x: [-0.55, 0.55], y: [-0.25, 0.45]
    const inBodyX = Math.abs(nx) <= 0.52;
    const inBodyY = ny >= -0.22 && ny <= 0.45;
    const inTopBump = Math.abs(nx) <= 0.24 && ny >= -0.42 && ny <= -0.22;

    // Lens circle: center (0, 0.12), radius ~0.26
    const lensDx = nx;
    const lensDy = ny - 0.12;
    const lensDist = Math.sqrt(lensDx * lensDx + lensDy * lensDy);

    // Viewfinder dot: top right (-0.35, -0.32)
    const vfDx = nx - 0.34;
    const vfDy = ny + 0.32;
    const vfDist = Math.sqrt(vfDx * vfDx + vfDy * vfDy);

    // Colors
    // White (#FFFFFF)
    // Seafoam Aqua (#B1E5E6: 177, 229, 230)
    // Luminous Mint (#CCFBFA: 204, 251, 250)
    // Dark slate (#0F172A: 15, 23, 42)

    // Inner lens reflection / aperture:
    if (lensDist <= 0.14) {
      // Core lens glass
      return [15, 23, 42, 255];
    } else if (lensDist <= 0.20) {
      // Luminous Mint inner aperture ring
      return [204, 251, 250, 255];
    } else if (lensDist <= 0.27) {
      // Seafoam Aqua outer bezel ring
      return [177, 229, 230, 255];
    } else if (lensDist <= 0.31) {
      // White rim
      return [255, 255, 255, 255];
    }

    // Viewfinder circle
    if (vfDist <= 0.05) {
      return [204, 251, 250, 255];
    }

    // Camera body silhouette
    if ((inBodyX && inBodyY) || inTopBump) {
      return [255, 255, 255, 240];
    }

    // Return gradient background
    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate apple-touch-icon.png (180x180)
const appleIcon = makePng(180, 180, renderAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);

// 2. Generate pwa-192x192.png
const pwa192 = makePng(192, 192, renderAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// 3. Generate pwa-512x512.png
const pwa512 = makePng(512, 512, renderAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// 4. Generate pwa-maskable-512x512.png (full-bleed background)
const pwaMaskable = makePng(512, 512, renderAppIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// 5. Generate favicon.ico (can be the 180px PNG)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), appleIcon);

console.log('Successfully generated iOS & PWA PNG icons in /public!');
