import Phaser from 'phaser';
import { soundFx } from '../utils/SoundFx.js';
import { crazyGamesSDK } from '../utils/CrazyGamesSDK.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background Gradient Sky
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a2a6c, 0x1a2a6c, 0xb21f1f, 0xfdbb2d, 1);
    bg.fillRect(0, 0, width, height);

    // City Skyline silhouette in background
    const skyline = this.add.graphics();
    skyline.fillStyle(0x0b1021, 0.7);
    const buildings = [
      { x: 50, w: 100, h: 280 },
      { x: 180, w: 140, h: 360 },
      { x: 350, w: 120, h: 220 },
      { x: 500, w: 160, h: 420 },
      { x: 700, w: 130, h: 310 },
      { x: 860, w: 150, h: 380 },
      { x: 1040, w: 180, h: 260 }
    ];
    buildings.forEach(b => {
      skyline.fillRect(b.x, height - b.h, b.w, b.h);
    });

    // Floating stars/particles
    for (let i = 0; i < 40; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height * 0.6),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.3, 0.9)
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.2, to: 1 },
        duration: Phaser.Math.Between(800, 2000),
        yoyo: true,
        repeat: -1
      });
    }

    // Top Bar: Round Icon Buttons (Kenney CC0) + Sleek Coin Badge
    this.muteBtn = this.createKenneyRoundButton(55, 38, soundFx.isUserMuted ? 'icon_audio_off' : 'icon_audio_on', 'blue', () => {
      soundFx.isMuted = !soundFx.isUserMuted;
      this.muteBtn.icon.setTexture(soundFx.isUserMuted ? 'icon_audio_off' : 'icon_audio_on');
      soundFx.playClick();
    });

    this.helpBtn = this.createKenneyRoundButton(115, 38, 'icon_help', 'blue', () => {
      soundFx.playClick();
      this.showHowToPlayModal(width, height);
    });

    this.fsBtn = this.createKenneyRoundButton(175, 38, 'icon_fullscreen', 'grey', () => {
      soundFx.playClick();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    // Coin Display Header (Top Right)
    this.coins = crazyGamesSDK.loadData('coins', 150);
    this.coinContainer = this.add.container(width - 120, 38);
    const coinBg = this.add.graphics();
    coinBg.fillStyle(0x0b1021, 0.85);
    coinBg.fillRoundedRect(-75, -20, 150, 40, 20);
    coinBg.lineStyle(2, 0xf1c40f, 0.9);
    coinBg.strokeRoundedRect(-75, -20, 150, 40, 20);

    const coinIcon = this.add.image(-45, 0, 'coin_icon').setScale(1.2);
    this.coinText = this.add.text(-20, 0, `${this.coins}`, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black'",
      fontSize: '22px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0, 0.5);
    this.coinContainer.add([coinBg, coinIcon, this.coinText]);

    // Title: ROOFTOP MEME DUEL (Lilita One Font & 3D styling)
    const titleText = this.add.text(width / 2, 86, 'ROOFTOP MEME DUEL', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '56px',
      color: '#ffdd33',
      stroke: '#000000',
      strokeThickness: 10,
      align: 'center',
      shadow: { offsetX: 3, offsetY: 5, color: '#e74c3c', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titleText,
      y: 82,
      scaleX: { from: 1.0, to: 1.02 },
      scaleY: { from: 1.0, to: 1.02 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Subtitle Badge
    const subBadge = this.add.graphics();
    subBadge.fillStyle(0x000000, 0.5);
    subBadge.fillRoundedRect(width / 2 - 210, 124, 420, 28, 14);
    this.add.text(width / 2, 138, '⚡ WACKY 2-PLAYER RAGDOLL SHOWDOWN ⚡', {
      fontFamily: "'Fredoka', 'Arial Black', sans-serif",
      fontSize: '15px',
      color: '#ecf0f1',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // NEXT SKIN Graphical Progress Bar
    this.createNextSkinProgressBar(width, 175);

    // Win Streak Display if active
    const streak = crazyGamesSDK.loadData('win_streak', 0);
    if (streak > 0) {
      const streakBg = this.add.graphics();
      streakBg.fillStyle(0xe67e22, 0.95);
      streakBg.fillRoundedRect(width / 2 - 130, 204, 260, 28, 10);
      streakBg.lineStyle(2, 0xffffff, 0.8);
      streakBg.strokeRoundedRect(width / 2 - 130, 204, 260, 28, 10);
      this.add.text(width / 2, 218, `🔥 WIN STREAK: ${streak} 🔥`, {
        fontFamily: "'Lilita One', 'Fredoka', Arial",
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);
    }

    // Menu Buttons array for keyboard navigation
    this.buttons = [];
    this.focusedButtonIdx = 0;

    const startY = streak > 0 ? 256 : 238;

    // TIER 1: HERO PLAY BUTTONS (Big 3D Buttons)
    // 1. 1P Mode (Hero CTA - Green 3D Button)
    const btn1 = this.createKenneyButton(width / 2, startY, '⚡ PLAY NOW: 1 PLAYER (VS CPU) ⚡', 'green', 420, 60, () => {
      soundFx.playClick();
      this.scene.start('GameScene', { mode: '1P' });
    });
    this.buttons.push(btn1);

    // Dynamic pulsing animation on Hero Button for maximum Conversion to Gameplay
    this.tweens.add({
      targets: btn1,
      scaleX: { from: 1.0, to: 1.04 },
      scaleY: { from: 1.0, to: 1.04 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 2. 2P Mode (Red 3D Button)
    const btn2 = this.createKenneyButton(width / 2, startY + 66, '🥊 2 PLAYERS (LOCAL PVP)', 'red', 400, 58, () => {
      soundFx.playClick();
      this.scene.start('GameScene', { mode: '2P' });
    });
    this.buttons.push(btn2);

    // TIER 2: SECONDARY ACTION HUB (Grid of 4 Kenney buttons)
    const hubY1 = startY + 134;
    const hubY2 = startY + 188;
    const colLeft = width / 2 - 145;
    const colRight = width / 2 + 145;
    const subBtnW = 270;
    const subBtnH = 48;

    // 3. Meme Tower Gauntlet
    const btn3 = this.createKenneyButton(colLeft, hubY1, '🏯 MEME TOWER', 'blue', subBtnW, subBtnH, () => {
      soundFx.playClick();
      this.scene.start('MemeTowerScene');
    });
    this.buttons.push(btn3);

    // 4. Daily Missions
    const missions = crazyGamesSDK.loadData('daily_missions', []);
    const completedCount = missions.filter(m => m.claimed).length;
    const readyCount = missions.filter(m => !m.claimed && m.progress >= m.target).length;
    const missionsLabel = readyCount > 0 ? '🎯 MISSIONS (🎁 CLAIM!)' : `🎯 MISSIONS (${completedCount}/3)`;
    this.missionBtn = this.createKenneyButton(colRight, hubY1, missionsLabel, readyCount > 0 ? 'yellow' : 'blue', subBtnW, subBtnH, () => {
      soundFx.playClick();
      this.showDailyMissionsModal(width, height);
    });
    this.buttons.push(this.missionBtn);

    // 5. Meme Skin Shop
    const btn5 = this.createKenneyButton(colLeft, hubY2, '🛒 SKIN SHOP', 'blue', subBtnW, subBtnH, () => {
      soundFx.playClick();
      this.scene.start('ShopScene');
    });
    this.buttons.push(btn5);

    // 6. Rewarded Ad Free Coins Button
    this.adBtn = this.createKenneyButton(colRight, hubY2, '🎁 WATCH AD (+100 🟡)', 'yellow', subBtnW, subBtnH, () => {
      if (!crazyGamesSDK.isRewardedAdReady()) {
        const remainingAds = crazyGamesSDK.getDailyRewardedAdsRemaining();
        if (remainingAds <= 0) {
          this.showToast('Daily ad limit reached (0/5 left today)');
        } else {
          const remaining = crazyGamesSDK.getRemainingRewardedCooldown();
          this.showToast(`Ad cooldown active (${remaining}s remaining)`);
        }
        soundFx.playClick();
        return;
      }

      soundFx.playClick();
      this.updateAdButtonState(true);

      crazyGamesSDK.requestRewardedAd({
        reward: () => {
          this.coins += 100;
          crazyGamesSDK.saveData('coins', this.coins);
          this.coinText.setText(`${this.coins}`);
          soundFx.playCoin();
          this.showToast('Claimed +100 Coins! 🟡');
          this.refreshNextSkinProgressBar();
        },
        afterAd: () => {
          this.updateAdButtonState(false);
        },
        error: () => {
          this.updateAdButtonState(false);
          this.showToast('Ad unavailable, please try again later');
        }
      });
    });
    this.buttons.push(this.adBtn);

    // Refresh ad button label periodically
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateAdButtonState(crazyGamesSDK.isAdPlaying)
    });

    // Bottom Controls Guide Box with Kenney Input Prompts (CC0)
    const controlsBox = this.add.container(width / 2, height - 44);
    const boxBg = this.add.graphics();
    boxBg.fillStyle(0x0b1021, 0.85);
    boxBg.fillRoundedRect(-480, -32, 960, 64, 16);
    boxBg.lineStyle(2, 0x34495e, 0.9);
    boxBg.strokeRoundedRect(-480, -32, 960, 64, 16);
    controlsBox.add(boxBg);

    // Player 1 (Blue) Badge & Prompts
    const p1Label = this.add.text(-455, 0, 'P1 [BLUE]:', {
      fontFamily: "'Lilita One', 'Fredoka', Arial",
      fontSize: '15px',
      color: '#3498db'
    }).setOrigin(0, 0.5);

    const keyW = this.add.image(-365, 0, 'key_w').setDisplaySize(28, 28);
    const keySpace = this.add.image(-320, 0, 'key_space').setDisplaySize(48, 28);
    const p1JumpTxt = this.add.text(-285, 0, 'JUMP/LEAN', {
      fontFamily: "'Fredoka', Arial",
      fontSize: '13px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    const keyE = this.add.image(-195, 0, 'key_e').setDisplaySize(28, 28);
    const p1ShootTxt = this.add.text(-175, 0, 'SHOOT', {
      fontFamily: "'Fredoka', Arial",
      fontSize: '13px',
      color: '#f1c40f'
    }).setOrigin(0, 0.5);

    // Divider
    const vsTxt = this.add.text(0, 0, '⚡ VS ⚡', {
      fontFamily: "'Lilita One', 'Fredoka', Arial",
      fontSize: '16px',
      color: '#e67e22'
    }).setOrigin(0.5);

    // Player 2 (Red) Badge & Prompts
    const p2Label = this.add.text(55, 0, 'P2 [RED/CPU]:', {
      fontFamily: "'Lilita One', 'Fredoka', Arial",
      fontSize: '15px',
      color: '#e74c3c'
    }).setOrigin(0, 0.5);

    const keyUp = this.add.image(175, 0, 'key_up').setDisplaySize(28, 28);
    const p2JumpTxt = this.add.text(195, 0, 'JUMP/LEAN', {
      fontFamily: "'Fredoka', Arial",
      fontSize: '13px',
      color: '#ecf0f1'
    }).setOrigin(0, 0.5);

    const keyEnter = this.add.image(295, 0, 'key_enter').setDisplaySize(44, 28);
    const p2ShootTxt = this.add.text(325, 0, 'SHOOT', {
      fontFamily: "'Fredoka', Arial",
      fontSize: '13px',
      color: '#f1c40f'
    }).setOrigin(0, 0.5);

    controlsBox.add([p1Label, keyW, keySpace, p1JumpTxt, keyE, p1ShootTxt, vsTxt, p2Label, keyUp, p2JumpTxt, keyEnter, p2ShootTxt]);

    // Keyboard Menu Navigation (W / S / Up / Down / Enter)
    this.setupKeyboardNavigation();

    // Check for Pending Daily Login Bonus Modal
    const pendingBonus = crazyGamesSDK.loadData('daily_bonus_pending', null);
    if (pendingBonus) {
      this.showDailyRewardModal(width, height, pendingBonus);
      crazyGamesSDK.saveData('daily_bonus_pending', null);
    }
  }

  createNextSkinProgressBar(width, y) {
    if (this.nextSkinContainer) {
      this.nextSkinContainer.destroy();
    }

    const container = this.add.container(width / 2, y);
    this.nextSkinContainer = container;

    const shopSkins = [
      { id: 'capybara', name: 'Chill Capybara', cost: 100 },
      { id: 'cat', name: 'Banana Cat', cost: 200 },
      { id: 'doge', name: 'Much Doge', cost: 300 },
      { id: 'noob', name: 'Cyber Noob', cost: 400 },
      { id: 'golden', name: 'Sigma Golden', cost: 500 }
    ];

    const unlockedSkins = crazyGamesSDK.loadData('unlocked_skins', ['default']);
    const nextSkin = shopSkins.find(s => !unlockedSkins.includes(s.id));

    const barBg = this.add.graphics();
    barBg.fillStyle(0x0b1021, 0.85);
    barBg.fillRoundedRect(-270, -18, 540, 36, 18);
    barBg.lineStyle(2, 0x34495e, 0.9);
    barBg.strokeRoundedRect(-270, -18, 540, 36, 18);
    container.add(barBg);

    if (nextSkin) {
      const progress = Math.min(1, this.coins / nextSkin.cost);
      const pct = Math.floor(progress * 100);

      // Mini Avatar preview
      const avatar = this.add.image(-235, 0, `head_${nextSkin.id}`).setScale(0.7);

      // Real Graphical Progress Bar Track & Fill
      const trackW = 160;
      const trackH = 14;
      const trackX = 0;
      const trackY = 0;

      const track = this.add.graphics();
      track.fillStyle(0x1a252f, 1);
      track.fillRoundedRect(trackX - trackW / 2, trackY - trackH / 2, trackW, trackH, 7);
      track.lineStyle(1, 0x34495e, 1);
      track.strokeRoundedRect(trackX - trackW / 2, trackY - trackH / 2, trackW, trackH, 7);

      const fillW = Math.max(8, trackW * progress);
      const fill = this.add.graphics();
      fill.fillStyle(progress >= 1 ? 0x2ecc71 : 0xf1c40f, 1);
      fill.fillRoundedRect(trackX - trackW / 2, trackY - trackH / 2, fillW, trackH, 7);
      // Shine line
      fill.fillStyle(0xffffff, 0.35);
      fill.fillRoundedRect(trackX - trackW / 2, trackY - trackH / 2, fillW, 5, 3);

      const titleTxt = this.add.text(-195, 0, `${nextSkin.name}:`, {
        fontFamily: "'Lilita One', 'Fredoka', Arial",
        fontSize: '15px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      const numTxt = this.add.text(trackX + trackW / 2 + 15, 0, `${this.coins}/${nextSkin.cost} (${pct}%)`, {
        fontFamily: "'Fredoka', Arial",
        fontSize: '14px',
        color: progress >= 1 ? '#2ecc71' : '#f1c40f'
      }).setOrigin(0, 0.5);

      container.add([avatar, titleTxt, track, fill, numTxt]);

      container.setSize(540, 36).setInteractive({ useHandCursor: true });
      container.on('pointerdown', () => {
        soundFx.playMemeStinger(nextSkin.id);
        this.tweens.add({
          targets: avatar,
          scale: 0.95,
          duration: 120,
          yoyo: true
        });
      });
    } else {
      const label = this.add.text(0, 0, '👑 ALL SKINS UNLOCKED! MASTER COLLECTION COMPLETE! 👑', {
        fontFamily: "'Lilita One', 'Fredoka', Arial",
        fontSize: '15px',
        color: '#f1c40f',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);
      container.add(label);
    }
  }

  refreshNextSkinProgressBar() {
    const { width } = this.scale;
    this.createNextSkinProgressBar(width, 175);
  }

  showDailyMissionsModal(width, height) {
    const modal = this.add.container(width / 2, height / 2).setDepth(350);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const dialog = this.add.graphics();
    dialog.fillStyle(0x131d2e, 0.98);
    dialog.fillRoundedRect(-300, -220, 600, 440, 24);
    dialog.lineStyle(4, 0x06b6d4, 1);
    dialog.strokeRoundedRect(-300, -220, 600, 440, 24);

    const title = this.add.text(0, -170, '🎯 DAILY MISSIONS', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const sub = this.add.text(0, -135, 'Complete daily tasks to earn bonus meme coins!', {
      fontFamily: 'Arial',
      fontSize: '15px',
      color: '#cbd5e1'
    }).setOrigin(0.5);

    const missionsListContainer = this.add.container(0, 0);

    const renderMissions = () => {
      missionsListContainer.removeAll(true);
      const missions = crazyGamesSDK.loadData('daily_missions', []);
      const startY = -85;
      const rowGap = 82;

      missions.forEach((m, idx) => {
        const y = startY + idx * rowGap;
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x1e293b, 0.9);
        rowBg.fillRoundedRect(-270, y - 28, 540, 70, 14);
        rowBg.lineStyle(2, m.claimed ? 0x059669 : (m.progress >= m.target ? 0xf59e0b : 0x334155), 0.9);
        rowBg.strokeRoundedRect(-270, y - 28, 540, 70, 14);

        // Mission Title & Target
        const mTitle = this.add.text(-250, y - 16, m.title, {
          fontFamily: 'Arial Black',
          fontSize: '16px',
          color: '#ffffff'
        });

        // Progress Text
        const progTxt = this.add.text(-250, y + 10, `Progress: ${m.progress}/${m.target}`, {
          fontFamily: 'Arial',
          fontSize: '13px',
          color: m.progress >= m.target ? '#4ade80' : '#94a3b8'
        });

        // Progress Fill Bar
        const barWidth = 240;
        const barHeight = 8;
        const barX = -130;
        const barY = y + 12;

        const pBarBg = this.add.graphics();
        pBarBg.fillStyle(0x334155, 1);
        pBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 4);

        const ratio = Math.min(1, m.progress / m.target);
        if (ratio > 0) {
          pBarBg.fillStyle(m.progress >= m.target ? 0x22c55e : 0x38bdf8, 1);
          pBarBg.fillRoundedRect(barX, barY, Math.max(8, barWidth * ratio), barHeight, 4);
        }

        // Reward Text
        const rewTxt = this.add.text(125, y - 14, `+${m.reward} 🟡`, {
          fontFamily: 'Arial Black',
          fontSize: '14px',
          color: '#fbbf24'
        }).setOrigin(0.5);

        // Action Button
        const actBtn = this.add.container(200, y + 2);
        const actBg = this.add.graphics();

        let btnLabel = 'IN PROGRESS';
        let btnColor = 0x475569;
        let canClaim = false;

        if (m.claimed) {
          btnLabel = 'CLAIMED ✅';
          btnColor = 0x065f46;
        } else if (m.progress >= m.target) {
          btnLabel = 'CLAIM! 🎁';
          btnColor = 0x16a34a;
          canClaim = true;
        }

        actBg.fillStyle(btnColor, 1);
        actBg.fillRoundedRect(-58, -18, 116, 36, 10);
        if (canClaim) {
          actBg.lineStyle(2, 0xfacc15, 1);
          actBg.strokeRoundedRect(-58, -18, 116, 36, 10);
        }

        const actTxt = this.add.text(0, 0, btnLabel, {
          fontFamily: 'Arial Black',
          fontSize: '12px',
          color: '#ffffff'
        }).setOrigin(0.5);

        actBtn.add([actBg, actTxt]);

        if (canClaim) {
          actBtn.setSize(116, 36).setInteractive({ useHandCursor: true });
          actBtn.on('pointerdown', () => {
            const reward = crazyGamesSDK.claimMissionReward(m.id);
            if (reward > 0) {
              soundFx.playCoin();
              soundFx.playScore();
              this.coins = crazyGamesSDK.loadData('coins', 150);
              this.coinText.setText(`${this.coins}`);
              this.refreshNextSkinProgressBar();

              // Update Menu Mission Button Label
              const updatedMissions = crazyGamesSDK.loadData('daily_missions', []);
              const updatedReady = updatedMissions.filter(um => !um.claimed && um.progress >= um.target).length;
              const updatedClaimed = updatedMissions.filter(um => um.claimed).length;
              if (this.missionBtn && this.missionBtn.label) {
                this.missionBtn.label.setText(updatedReady > 0 ? '🎯 DAILY MISSIONS (🎁 CLAIM!)' : `🎯 DAILY MISSIONS (${updatedClaimed}/3)`);
              }

              this.showToast(`Claimed +${reward} Coins! 🟡`);
              renderMissions();
            }
          });
        }

        missionsListContainer.add([rowBg, mTitle, progTxt, pBarBg, rewTxt, actBtn]);
      });
    };

    renderMissions();

    // Close Modal Button
    const closeBtn = this.add.container(0, 175);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xe11d48, 1);
    closeBg.fillRoundedRect(-100, -22, 200, 44, 12);
    closeBg.lineStyle(2, 0xffffff, 0.8);
    closeBg.strokeRoundedRect(-100, -22, 200, 44, 12);

    const closeTxt = this.add.text(0, 0, 'CLOSE ✖', {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setSize(200, 44).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundFx.playClick();
      modal.destroy();
    });

    modal.add([overlay, dialog, title, sub, missionsListContainer, closeBtn]);
    modal.setScale(0.8);
    this.tweens.add({
      targets: modal,
      scale: 1.0,
      duration: 200,
      ease: 'Back.out'
    });
  }

  setupKeyboardNavigation() {
    this.input.keyboard.on('keydown-UP', () => this.navigateButtons(-1));
    this.input.keyboard.on('keydown-W', () => this.navigateButtons(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.navigateButtons(1));
    this.input.keyboard.on('keydown-S', () => this.navigateButtons(1));
    this.input.keyboard.on('keydown-ENTER', () => this.triggerFocusedButton());
    this.input.keyboard.on('keydown-SPACE', () => this.triggerFocusedButton());
  }

  navigateButtons(direction) {
    soundFx.playClick();
    this.buttons[this.focusedButtonIdx].setScale(1.0);
    this.focusedButtonIdx = (this.focusedButtonIdx + direction + this.buttons.length) % this.buttons.length;
    this.buttons[this.focusedButtonIdx].setScale(1.04);
  }

  triggerFocusedButton() {
    if (this.buttons[this.focusedButtonIdx] && this.buttons[this.focusedButtonIdx].actionCallback) {
      this.buttons[this.focusedButtonIdx].actionCallback();
    }
  }

  updateAdButtonState(isBusy) {
    if (!this.adBtn || !this.adBtn.label) return;
    const remaining = crazyGamesSDK.getRemainingRewardedCooldown();
    const dailyRemaining = crazyGamesSDK.getDailyRewardedAdsRemaining();

    if (isBusy) {
      this.adBtn.label.setText('⏳ LOADING AD...');
      this.adBtn.bg.setTexture('btn_grey');
    } else if (dailyRemaining <= 0) {
      this.adBtn.label.setText('🎁 DAILY LIMIT (0/5)');
      this.adBtn.bg.setTexture('btn_grey');
    } else if (remaining > 0) {
      this.adBtn.label.setText(`⏳ COOLDOWN (${remaining}s)`);
      this.adBtn.bg.setTexture('btn_grey');
    } else {
      this.adBtn.label.setText(`🎁 +100 COINS (${dailyRemaining}/5)`);
      this.adBtn.bg.setTexture('btn_yellow');
    }
  }

  createKenneyButton(x, y, text, style, width, height, callback) {
    const container = this.add.container(x, y);

    const normalTexture = `btn_${style}`;
    const pressedTexture = `btn_${style}_pressed`;

    const bg = this.add.image(0, 0, normalTexture);
    bg.setDisplaySize(width, height);

    const label = this.add.text(0, -2, text, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: width > 300 ? '20px' : '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.bg = bg;
    container.label = label;
    container.actionCallback = callback;
    container.style = style;
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      container.setScale(1.03);
    });
    container.on('pointerout', () => {
      container.setScale(1.0);
      bg.setTexture(normalTexture);
      label.setY(-2);
    });
    container.on('pointerdown', () => {
      bg.setTexture(pressedTexture);
      label.setY(1);
    });
    container.on('pointerup', () => {
      bg.setTexture(normalTexture);
      label.setY(-2);
      callback();
    });

    return container;
  }

  createKenneyRoundButton(x, y, iconKey, style, callback) {
    const container = this.add.container(x, y);
    const bg = this.add.image(0, 0, `btn_round_${style}`);
    bg.setDisplaySize(44, 44);

    const icon = this.add.image(0, -2, iconKey).setScale(0.85);

    container.add([bg, icon]);
    container.bg = bg;
    container.icon = icon;
    container.setSize(44, 44);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.08));
    container.on('pointerout', () => {
      container.setScale(1.0);
      bg.setTexture(`btn_round_${style}`);
      icon.setY(-2);
    });
    container.on('pointerdown', () => {
      bg.setTexture(`btn_round_${style}_pressed`);
      icon.setY(1);
    });
    container.on('pointerup', () => {
      bg.setTexture(`btn_round_${style}`);
      icon.setY(-2);
      callback();
    });

    return container;
  }

  showToast(message) {
    const { width, height } = this.scale;
    const toast = this.add.container(width / 2, height - 120).setDepth(400);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(-180, -22, 360, 44, 12);
    bg.lineStyle(2, 0xf1c40f, 1);
    bg.strokeRoundedRect(-180, -22, 360, 44, 12);

    const txt = this.add.text(0, 0, message, {
      fontFamily: 'Arial Black',
      fontSize: '16px',
      color: '#f1c40f'
    }).setOrigin(0.5);

    toast.add([bg, txt]);
    this.tweens.add({
      targets: toast,
      y: height - 140,
      alpha: { from: 1, to: 0 },
      duration: 1800,
      ease: 'Cubic.out',
      onComplete: () => toast.destroy()
    });
  }

  showHowToPlayModal(width, height) {
    const modal = this.add.container(width / 2, height / 2).setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const dialog = this.add.graphics();
    dialog.fillStyle(0x1a252f, 0.98);
    dialog.fillRoundedRect(-290, -230, 580, 460, 24);
    dialog.lineStyle(4, 0x3498db, 1);
    dialog.strokeRoundedRect(-290, -230, 580, 460, 24);

    const title = this.add.text(0, -180, '📖 HOW TO DUEL & WIN', {
      fontFamily: 'Arial Black',
      fontSize: '32px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const instructions = [
      '1. 🕹️ LEAN & JUMP: Hold [W] / [I] to lean back and jump!',
      '   Release the key to automatically stand upright.',
      '',
      '2. 🔫 WEAPONS & RECOIL: Press [E] / [O] to shoot.',
      '   Firing pushes your character backward — use recoil to position!',
      '',
      '3. 🏆 VICTORY: First player to score points wins the match.',
      '   Knock rival off the ledge into the abyss!',
      '',
      '4. 🔥 SUDDEN DEATH: If a round lasts >20s, lava rises from below!'
    ];

    const bodyText = this.add.text(0, -30, instructions.join('\n'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '17px',
      color: '#ecf0f1',
      stroke: '#000',
      strokeThickness: 2,
      lineSpacing: 4,
      align: 'left'
    }).setOrigin(0.5);

    const closeBtn = this.add.container(0, 165);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x27ae60, 1);
    closeBg.fillRoundedRect(-110, -24, 220, 48, 14);
    const closeTxt = this.add.text(0, 0, 'GOT IT! 👍', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setSize(220, 48).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      soundFx.playClick();
      modal.destroy();
    });

    modal.add([overlay, dialog, title, bodyText, closeBtn]);
    modal.setScale(0.8);
    this.tweens.add({
      targets: modal,
      scale: 1.0,
      duration: 250,
      ease: 'Back.out'
    });
  }

  showDailyRewardModal(width, height, rewardData) {
    const modal = this.add.container(width / 2, height / 2).setDepth(350);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const dialog = this.add.graphics();
    dialog.fillStyle(0x1a252f, 0.98);
    dialog.fillRoundedRect(-250, -180, 500, 360, 24);
    dialog.lineStyle(4, 0xf1c40f, 1);
    dialog.strokeRoundedRect(-250, -180, 500, 360, 24);

    const title = this.add.text(0, -120, '🎁 DAILY LOGIN BONUS!', {
      fontFamily: 'Arial Black',
      fontSize: '30px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const streakTxt = this.add.text(0, -70, `Day ${rewardData.day} Streak Reward`, {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const amountTxt = this.add.text(0, -10, `+${rewardData.coins} COINS 🟡`, {
      fontFamily: 'Arial Black',
      fontSize: '36px',
      color: '#2ecc71',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const claimBtn = this.add.container(0, 80);
    const claimBg = this.add.graphics();
    claimBg.fillStyle(0xf39c12, 1);
    claimBg.fillRoundedRect(-120, -26, 240, 52, 16);
    const claimTxt = this.add.text(0, 0, 'CLAIM REWARD! 🌟', {
      fontFamily: 'Arial Black',
      fontSize: '20px',
      color: '#ffffff'
    }).setOrigin(0.5);
    claimBtn.add([claimBg, claimTxt]);
    claimBtn.setSize(240, 52).setInteractive({ useHandCursor: true });

    claimBtn.on('pointerdown', () => {
      soundFx.playCoin();
      this.coins = crazyGamesSDK.loadData('coins', 150);
      this.coinText.setText(`${this.coins}`);
      this.refreshNextSkinProgressBar();
      modal.destroy();
    });

    modal.add([overlay, dialog, title, streakTxt, amountTxt, claimBtn]);
    soundFx.playScore();

    // Spawn falling confetti
    for (let i = 0; i < 30; i++) {
      const confetti = this.add.image(
        Phaser.Math.Between(width * 0.3, width * 0.7),
        Phaser.Math.Between(height * 0.2, height * 0.8),
        'particle_confetti'
      ).setDepth(360);
      confetti.setTint(Phaser.Utils.Array.GetRandom([0xf1c40f, 0xe74c3c, 0x3498db, 0x2ecc71, 0x9b59b6]));
      this.tweens.add({
        targets: confetti,
        y: confetti.y + Phaser.Math.Between(50, 150),
        angle: Phaser.Math.Between(0, 360),
        alpha: 0,
        duration: 1200,
        onComplete: () => confetti.destroy()
      });
    }
  }
}
