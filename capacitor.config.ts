export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  ios?: {
    contentInset?: 'automatic' | 'never' | 'always';
    backgroundColor?: string;
    preferredContentMode?: 'mobile' | 'desktop';
  };
  server?: {
    url?: string;
    cleartext?: boolean;
  };
}

const config: CapacitorConfig = {
  appId: 'com.photogearvault.app',
  appName: 'Photo Gear Vault',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FAFDFD',
    preferredContentMode: 'mobile',
  },
};

export default config;
