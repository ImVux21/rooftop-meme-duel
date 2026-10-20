// CrazyGames SDK v3 Wrapper with graceful fallback for local development
import { soundFx } from './SoundFx.js';

class CrazyGamesSDKWrapper {
  constructor() {
    this.sdk = null;
    this.isInitialized = false;
    this.hasAdblock = false;
    // CRITICAL: Initialize to session start time to prevent ads in the first 3 minutes
    this.lastAdTime = Date.now();
    this.adCooldownMs = 180000; // Strictly adhere to >= 3min (180s) cooldown
    this.lastRewardedAdTime = 0;
    this.rewardedCooldownMs = 180000; // 3min cooldown between voluntary rewarded ads to prevent spam
    this.isAdPlaying = false;
    this.maxDailyRewardedAds = 5;
  }

  async init() {
    if (this.isInitialized) return;

    if (typeof window !== 'undefined' && window.CrazyGames && window.CrazyGames.SDK) {
      try {
        await window.CrazyGames.SDK.init();
        this.sdk = window.CrazyGames.SDK;
        this.isInitialized = true;
        console.log('[CrazyGames SDK] Successfully initialized v3');

        // Check if environment has adblock
        if (this.sdk.ad && typeof this.sdk.ad.hasAdblock === 'function') {
          this.hasAdblock = await this.sdk.ad.hasAdblock();
        }

        // Listen for CrazyGames toolbar audio mute changes
        if (this.sdk.game && typeof this.sdk.game.addSettingsChangeListener === 'function') {
          this.sdk.game.addSettingsChangeListener((settings) => {
            if (settings?.muteAudio !== undefined) {
              soundFx.setTabMuted(settings.muteAudio);
            }
          });
        }
      } catch (err) {
        console.warn('[CrazyGames SDK] Init error (running in local mode):', err);
        this.sdk = window.CrazyGames.SDK || null;
        this.isInitialized = false;
      }
    } else {
      console.log('[CrazyGames SDK] SDK script not found or running locally. Mocking SDK functions.');
    }
  }

  loadingStart() {
    try {
      if (this.sdk?.game?.loadingStart) {
        this.sdk.game.loadingStart();
      } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.loadingStart) {
        window.CrazyGames.SDK.game.loadingStart();
      }
    } catch (e) {
      console.warn('[CrazyGames] loadingStart error:', e);
    }
  }

  loadingStop() {
    try {
      if (this.sdk?.game?.loadingStop) {
        this.sdk.game.loadingStop();
      } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.loadingStop) {
        window.CrazyGames.SDK.game.loadingStop();
      }
    } catch (e) {
      console.warn('[CrazyGames] loadingStop error:', e);
    }
  }

  gameplayStart() {
    try {
      if (this.sdk?.game?.gameplayStart) {
        this.sdk.game.gameplayStart();
      } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.gameplayStart) {
        window.CrazyGames.SDK.game.gameplayStart();
      }
    } catch (e) {
      console.warn('[CrazyGames] gameplayStart error:', e);
    }
  }

  gameplayStop() {
    try {
      if (this.sdk?.game?.gameplayStop) {
        this.sdk.game.gameplayStop();
      } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.gameplayStop) {
        window.CrazyGames.SDK.game.gameplayStop();
      }
    } catch (e) {
      console.warn('[CrazyGames] gameplayStop error:', e);
    }
  }

  happytime() {
    try {
      if (this.sdk?.game?.happytime) {
        this.sdk.game.happytime();
      } else if (typeof window !== 'undefined' && window.CrazyGames?.SDK?.game?.happytime) {
        window.CrazyGames.SDK.game.happytime();
      }
    } catch (e) {
      console.warn('[CrazyGames] happytime error:', e);
    }
  }

  requestBanner(containerId = 'banner-container', width = 300, height = 250) {
    try {
      if (this.sdk?.banner?.requestBanner) {
        this.sdk.banner.requestBanner({ id: containerId, width, height });
      }
    } catch (e) {
      console.warn('[CrazyGames] requestBanner error:', e);
    }
  }

  clearBanner(containerId = 'banner-container') {
    try {
      if (this.sdk?.banner?.clearBanner) {
        this.sdk.banner.clearBanner(containerId);
      }
    } catch (e) {
      console.warn('[CrazyGames] clearBanner error:', e);
    }
  }

  getRemainingAdCooldown() {
    const elapsed = Date.now() - this.lastAdTime;
    return Math.max(0, Math.ceil((this.adCooldownMs - elapsed) / 1000));
  }

  getRemainingRewardedCooldown() {
    const elapsed = Date.now() - this.lastRewardedAdTime;
    return Math.max(0, Math.ceil((this.rewardedCooldownMs - elapsed) / 1000));
  }

  getDailyRewardedAdsRemaining() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = this.loadData('last_rewarded_date', '');
    if (lastDate !== today) {
      return this.maxDailyRewardedAds;
    }
    const count = this.loadData('rewarded_ad_count_today', 0);
    return Math.max(0, this.maxDailyRewardedAds - count);
  }

  isRewardedAdReady() {
    return this.getRemainingRewardedCooldown() === 0 && this.getDailyRewardedAdsRemaining() > 0;
  }

  recordRewardedAdWatched() {
    const today = new Date().toISOString().slice(0, 10);
    const lastDate = this.loadData('last_rewarded_date', '');
    let count = 0;
    if (lastDate === today) {
      count = this.loadData('rewarded_ad_count_today', 0);
    }
    count += 1;
    this.saveData('last_rewarded_date', today);
    this.saveData('rewarded_ad_count_today', count);
    const remaining = Math.max(0, this.maxDailyRewardedAds - count);
    console.log(`[CrazyGames] Rewarded ad recorded. Watched today: ${count}/${this.maxDailyRewardedAds} (${remaining} remaining)`);
    return remaining;
  }

  requestMidgameAd(callbacks = {}) {
    const { beforeAd, afterAd, error } = callbacks;
    const now = Date.now();

    // Respect strict 3-minute interstitial ad cooldown
    if (now - this.lastAdTime < this.adCooldownMs) {
      const remainingSec = Math.round((this.adCooldownMs - (now - this.lastAdTime)) / 1000);
      console.log(`[CrazyGames] Midgame ad skipped: Cooldown active (${remainingSec}s remaining)`);
      if (afterAd) afterAd();
      return;
    }

    if (this.sdk?.ad?.requestAd) {
      try {
        this.sdk.ad.requestAd('midgame', {
          adStarted: () => {
            this.isAdPlaying = true;
            soundFx.setAdMuted(true);
            this.gameplayStop();
            if (beforeAd) beforeAd();
          },
          adFinished: () => {
            this.isAdPlaying = false;
            this.lastAdTime = Date.now();
            soundFx.setAdMuted(false);
            if (afterAd) afterAd();
          },
          adError: (err) => {
            this.isAdPlaying = false;
            soundFx.setAdMuted(false);
            console.warn('[CrazyGames] Midgame ad error:', err);
            if (error) error(err);
            if (afterAd) afterAd();
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] requestAd call exception:', err);
        soundFx.setAdMuted(false);
        if (error) error(err);
        if (afterAd) afterAd();
      }
    } else {
      // Local development simulation
      console.log('[Mock CrazyGames] Showing mock midgame ad...');
      if (beforeAd) beforeAd();
      soundFx.setAdMuted(true);
      setTimeout(() => {
        soundFx.setAdMuted(false);
        this.lastAdTime = Date.now();
        if (afterAd) afterAd();
      }, 1000);
    }
  }

  requestRewardedAd(callbacks = {}) {
    const { beforeAd, reward, afterAd, error } = callbacks;
    const now = Date.now();

    const remainingAds = this.getDailyRewardedAdsRemaining();
    if (remainingAds <= 0) {
      const msg = `Daily rewarded ad limit of ${this.maxDailyRewardedAds} reached (0 remaining today)`;
      console.log(`[CrazyGames] ${msg}`);
      if (error) error(new Error(msg));
      if (afterAd) afterAd();
      return;
    }

    if (now - this.lastRewardedAdTime < this.rewardedCooldownMs) {
      const remainingSec = Math.round((this.rewardedCooldownMs - (now - this.lastRewardedAdTime)) / 1000);
      console.log(`[CrazyGames] Rewarded ad on cooldown: ${remainingSec}s remaining (${remainingAds} daily ads left)`);
      if (error) error(new Error(`Cooldown active (${remainingSec}s)`));
      if (afterAd) afterAd();
      return;
    }

    if (this.sdk?.ad?.requestAd) {
      try {
        this.sdk.ad.requestAd('rewarded', {
          adStarted: () => {
            this.isAdPlaying = true;
            soundFx.setAdMuted(true);
            this.gameplayStop();
            if (beforeAd) beforeAd();
          },
          adFinished: () => {
            this.isAdPlaying = false;
            this.lastRewardedAdTime = Date.now();
            this.lastAdTime = Date.now();
            this.recordRewardedAdWatched();
            soundFx.setAdMuted(false);
            if (reward) reward();
            if (afterAd) afterAd();
          },
          adError: (err) => {
            this.isAdPlaying = false;
            soundFx.setAdMuted(false);
            console.warn('[CrazyGames] Rewarded ad cancelled or failed:', err);
            if (error) error(err);
            if (afterAd) afterAd();
          }
        });
      } catch (err) {
        console.warn('[CrazyGames] Rewarded requestAd call exception:', err);
        soundFx.setAdMuted(false);
        if (error) error(err);
        if (afterAd) afterAd();
      }
    } else {
      // Local development simulation
      console.log('[Mock CrazyGames] Playing mock rewarded ad (1.2s)...');
      if (beforeAd) beforeAd();
      soundFx.setAdMuted(true);
      setTimeout(() => {
        soundFx.setAdMuted(false);
        this.lastRewardedAdTime = Date.now();
        this.lastAdTime = Date.now();
        this.recordRewardedAdWatched();
        if (reward) reward();
        if (afterAd) afterAd();
      }, 1200);
    }
  }

  saveData(key, value) {
    try {
      localStorage.setItem(`rooftop_duel_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  loadData(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(`rooftop_duel_${key}`);
      return val ? JSON.parse(val) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  incrementMissionProgress(missionId, amount = 1) {
    const missions = this.loadData('daily_missions', []);
    let modified = false;
    missions.forEach(m => {
      if (m.id === missionId && !m.claimed) {
        m.progress = Math.min(m.target, (m.progress || 0) + amount);
        modified = true;
      }
    });
    if (modified) {
      this.saveData('daily_missions', missions);
    }
    return missions;
  }

  claimMissionReward(missionId) {
    const missions = this.loadData('daily_missions', []);
    let rewardClaimed = 0;
    missions.forEach(m => {
      if (m.id === missionId && !m.claimed && m.progress >= m.target) {
        m.claimed = true;
        rewardClaimed = m.reward;
      }
    });
    if (rewardClaimed > 0) {
      this.saveData('daily_missions', missions);
      const currentCoins = this.loadData('coins', 150);
      this.saveData('coins', currentCoins + rewardClaimed);
    }
    return rewardClaimed;
  }
}

export const crazyGamesSDK = new CrazyGamesSDKWrapper();
