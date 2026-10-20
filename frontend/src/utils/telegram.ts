// Typed helper for Telegram Mini Apps & WebApp SDK

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        initData?: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
        };
        openTelegramLink?: (url: string) => void;
        openLink?: (url: string) => void;
        themeParams?: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export const tg = {
  get isAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp?.initData);
  },

  get webApp() {
    return typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  },

  get user() {
    return this.webApp?.initDataUnsafe?.user;
  },

  init() {
    const app = this.webApp;
    if (app) {
      app.ready();
      app.expand();
      app.setHeaderColor?.('#FFF6E5');
      app.setBackgroundColor?.('#FFF6E5');
    }
  },

  haptic: {
    impact(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
        // Fallback to navigator.vibrate on mobile browsers
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          const duration = style === 'heavy' ? 30 : style === 'medium' ? 18 : 10;
          navigator.vibrate(duration);
        }
      } catch {
        // Safe no-op
      }
    },

    notification(type: 'error' | 'success' | 'warning' = 'success') {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(type === 'success' ? [20, 40, 20] : [40, 40]);
        }
      } catch {
        // Safe no-op
      }
    },

    selection() {
      try {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(8);
        }
      } catch {
        // Safe no-op
      }
    },
  },

  share(text: string, url: string = 'https://t.me/devgotchi_pet_bot') {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (this.webApp?.openTelegramLink) {
      this.webApp.openTelegramLink(shareUrl);
    } else if (typeof window !== 'undefined') {
      window.open(shareUrl, '_blank');
    }
  },

  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  },
};
