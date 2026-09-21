declare module 'exifr' {
  export interface ExifOptions {
    tiff?: boolean;
    xmp?: boolean;
    icc?: boolean;
    iptc?: boolean;
    jfif?: boolean;
    ihdr?: boolean;
    makerNote?: boolean;
    userComment?: boolean;
    translateKeys?: boolean;
    translateValues?: boolean;
    reviveValues?: boolean;
    sanitize?: boolean;
    mergeOutput?: boolean;
    silentErrors?: boolean;
    pick?: string[];
    skip?: string[];
    [key: string]: any;
  }

  export function parse(input: any, options?: ExifOptions): Promise<any>;
  export function thumbnail(input: any): Promise<Uint8Array | undefined>;
  export function tag(input: any, tag: string): Promise<any>;
  export function gps(input: any): Promise<{ latitude: number; longitude: number } | undefined>;
  export function orientation(input: any): Promise<number | undefined>;

  const exifr: {
    parse: typeof parse;
    thumbnail: typeof thumbnail;
    tag: typeof tag;
    gps: typeof gps;
    orientation: typeof orientation;
  };

  export default exifr;
}
