/**
 * 🔴 iOS Badge Service
 * Uygulama simgesindeki kırmızı bildirim sayısını yönetir
 */

import { Capacitor } from '@capacitor/core';

interface BadgePlugin {
  setBadge(options: { count: number }): Promise<{ success: boolean; count: number }>;
  getBadge(): Promise<{ count: number }>;
  clearBadge(): Promise<{ success: boolean }>;
}

class BadgeService {
  private badgePlugin: BadgePlugin | null = null;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      // Native Badge plugin'i yükle
      this.badgePlugin = Capacitor.Plugins.Badge as unknown as BadgePlugin;
    }
  }

  /**
   * Badge sayısını ayarla
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.badgePlugin) {
      console.log('📱 Badge: Web platformu - badge desteklenmiyor');
      return;
    }

    try {
      await this.badgePlugin.setBadge({ count });
      console.log(`🔴 iOS Badge ayarlandı: ${count}`);
    } catch (error) {
      console.error('❌ Badge ayarlama hatası:', error);
    }
  }

  /**
   * Badge'i temizle (0 yap)
   */
  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform() || !this.badgePlugin) {
      return;
    }

    try {
      await this.badgePlugin.clearBadge();
      console.log('✅ iOS Badge temizlendi');
    } catch (error) {
      console.error('❌ Badge temizleme hatası:', error);
    }
  }

  /**
   * Mevcut badge sayısını getir
   */
  async getBadgeCount(): Promise<number> {
    if (!Capacitor.isNativePlatform() || !this.badgePlugin) {
      return 0;
    }

    try {
      const result = await this.badgePlugin.getBadge();
      return result.count || 0;
    } catch (error) {
      console.error('❌ Badge okuma hatası:', error);
      return 0;
    }
  }
}

export const badgeService = new BadgeService();

