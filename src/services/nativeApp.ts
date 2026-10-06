import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const NativeApp = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),

  /**
   * Initialize native device capabilities on app boot.
   */
  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // 1. Hide splash screen smoothly after app hydration
      await SplashScreen.hide().catch(() => {});

      // 2. Configure keyboard
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
      await Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {});
    } catch (err) {
      console.warn('NativeApp init note:', err);
    }
  },

  /**
   * Update Status Bar appearance to match the current theme mode.
   */
  async updateTheme(isDark: boolean): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      }).catch(() => {});

      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({
          color: isDark ? '#000000' : '#FAFDFD',
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('StatusBar update note:', err);
    }
  },

  /**
   * Trigger native tactile haptic feedback.
   */
  async triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' = 'light'): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (type === 'selection') {
        await Haptics.selectionChanged();
      } else if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      }
    } catch {
      // Haptics not supported or disabled on device
    }
  },

  /**
   * Listen to Android hardware back button.
   */
  onBackButton(handler: () => boolean | void): () => void {
    if (!Capacitor.isNativePlatform()) return () => {};

    const handle = CapApp.addListener('backButton', ({ canGoBack }) => {
      const handled = handler();
      if (!handled && canGoBack) {
        window.history.back();
      }
    });

    return () => {
      handle.then((h) => h.remove()).catch(() => {});
    };
  },

  /**
   * Capture or pick photo via native device camera / photo library.
   */
  async capturePhoto(source: 'camera' | 'photos' | 'prompt' = 'prompt'): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
      const capSource =
        source === 'camera'
          ? CameraSource.Camera
          : source === 'photos'
          ? CameraSource.Photos
          : CameraSource.Prompt;

      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: capSource,
      });

      return photo.dataUrl || null;
    } catch (err) {
      // User cancelled or camera denied
      return null;
    }
  },
};
