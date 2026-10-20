import Phaser from 'phaser';
import { soundFx } from '../utils/SoundFx.js';
import { crazyGamesSDK } from '../utils/CrazyGamesSDK.js';

export default class MemeTowerScene extends Phaser.Scene {
  constructor() {
    super('MemeTowerScene');
  }

  create() {
    const { width, height } = this.scale;

    // Background Gradient: Tower Gauntlet Dark Crimson / Deep Indigo
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a0933, 0x2b1055, 0x4c1d95, 0x111827, 1);
    bg.fillRect(0, 0, width, height);

    // Gauntlet Tower Spire Silhouettes
    const spireGfx = this.add.graphics();
    spireGfx.fillStyle(0x0f0728, 0.7);
    for (let x = 60; x < width; x += 160) {
      const h = Phaser.Math.Between(260, 480);
      spireGfx.fillRect(x, height - h, 100, h);
      spireGfx.fillTriangle(x, height - h, x + 100, height - h, x + 50, height - h - 50);
    }

    // Floating Magical Sparks/Embers
    for (let i = 0; i < 35; i++) {
      const spark = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(2, 4),
        Phaser.Utils.Array.GetRandom([0xf59e0b, 0xa855f7, 0xec4899, 0x60a5fa]),
        Phaser.Math.FloatBetween(0.3, 0.8)
      );
      this.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(60, 160),
        alpha: { from: 0.8, to: 0.1 },
        duration: Phaser.Math.Between(2000, 4500),
        repeat: -1,
        yoyo: true
      });
    }

    // Title Header
    const title = this.add.text(width / 2, 45, '🏯 MEME TOWER GAUNTLET 🏯', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '40px',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 8,
      shadow: { offsetX: 3, offsetY: 4, color: '#7c3aed', blur: 4, fill: true }
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 0.98, to: 1.02 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const subtitle = this.add.text(width / 2, 85, 'CLIMB ALL 5 FLOORS • FIRST-TO-3 WINS • CLAIM THE GOLDEN CROWN', {
      fontFamily: "'Fredoka', Arial, sans-serif",
      fontSize: '15px',
      color: '#e2e8f0',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Saved Progress
    this.unlockedFloor = crazyGamesSDK.loadData('tower_unlocked_floor', 1);
    this.towerCleared = crazyGamesSDK.loadData('tower_cleared', false);
    this.coins = crazyGamesSDK.loadData('coins', 150);

    // Coin Display Header (Top Right)
    this.createCoinBadge(width - 150, 45);

    // Back to Menu Button (Top Left - Kenney Red 3D Button)
    const backBtn = this.createKenneyButton(90, 45, '⬅ MENU', 'red', 130, 44, () => {
      this.scene.start('MenuScene');
    });

    // Floor Definitions
    this.floors = [
      {
        floor: 1,
        skin: 'noob',
        name: 'Cyber Noob',
        title: 'FLOOR 1: ROOKIE',
        reward: 100,
        perk: 'Slow reflexes & clumsy jumps',
        color: 0x10b981
      },
      {
        floor: 2,
        skin: 'capybara',
        name: 'Chill Capybara',
        title: 'FLOOR 2: TANK',
        reward: 150,
        perk: 'Heavy tank mass & low recoil',
        color: 0x8b5cf6
      },
      {
        floor: 3,
        skin: 'cat',
        name: 'Banana Cat',
        title: 'FLOOR 3: AGILITY',
        reward: 200,
        perk: 'Super jumpy acrobatic leaps',
        color: 0x06b6d4
      },
      {
        floor: 4,
        skin: 'doge',
        name: 'Much Doge',
        title: 'FLOOR 4: RAPID FIRE',
        reward: 250,
        perk: 'Rapid trigger burst shots',
        color: 0xf97316
      },
      {
        floor: 5,
        skin: 'golden',
        name: 'Sigma Golden Boss',
        title: 'FLOOR 5: FINAL BOSS',
        reward: 500,
        perk: 'Apex bot precision + Crown',
        color: 0xeab308
      }
    ];

    this.renderFloorCards(width, height);

    // Tower Master Crown Trophy Banner if cleared
    if (this.towerCleared) {
      this.createMasterCrownBanner(width, height);
    }
  }

  createCoinBadge(x, y) {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.65);
    bg.fillRoundedRect(-15, -18, 140, 36, 18);
    bg.lineStyle(2, 0xf59e0b, 0.8);
    bg.strokeRoundedRect(-15, -18, 140, 36, 18);

    const coin = this.add.image(10, 0, 'coin_icon');
    const txt = this.add.text(32, 0, `${this.coins}`, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '20px',
      color: '#fbbf24',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0, 0.5);

    container.add([bg, coin, txt]);
  }

  renderFloorCards(width, height) {
    const cardWidth = 216;
    const cardHeight = 440;
    const gap = 24;
    const totalWidth = 5 * cardWidth + 4 * gap;
    const startX = (width - totalWidth) / 2 + cardWidth / 2;
    const cardY = height / 2 + 35;

    this.floors.forEach((f, idx) => {
      const x = startX + idx * (cardWidth + gap);
      const isUnlocked = f.floor <= this.unlockedFloor;
      const isCleared = f.floor < this.unlockedFloor || (f.floor === 5 && this.towerCleared);

      const card = this.add.container(x, cardY);

      // Card Background Glass Box
      const cardBg = this.add.graphics();
      if (isCleared) {
        cardBg.fillStyle(0x064e3b, 0.9); // Cleared dark emerald
        cardBg.lineStyle(3, 0x10b981, 1);
      } else if (isUnlocked) {
        cardBg.fillStyle(0x1e1b4b, 0.95); // Active royal indigo
        cardBg.lineStyle(3, f.color, 1);
      } else {
        cardBg.fillStyle(0x0f172a, 0.7); // Locked dark slate
        cardBg.lineStyle(2, 0x475569, 0.6);
      }

      cardBg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 18);
      cardBg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 18);

      // Floor Header Title
      const titleTxt = this.add.text(0, -cardHeight / 2 + 25, f.title, {
        fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
        fontSize: '15px',
        color: isUnlocked ? '#ffffff' : '#64748b',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);

      // Cleared Star or Status
      let statusBadge = null;
      if (isCleared) {
        statusBadge = this.add.text(0, -cardHeight / 2 + 50, '⭐ CLEARED ⭐', {
          fontFamily: "'Fredoka', Arial, sans-serif",
          fontSize: '13px',
          color: '#34d399'
        }).setOrigin(0.5);
      } else if (isUnlocked) {
        statusBadge = this.add.text(0, -cardHeight / 2 + 50, '⚔️ CURRENT FLOOR', {
          fontFamily: "'Fredoka', Arial, sans-serif",
          fontSize: '12px',
          color: '#fbbf24'
        }).setOrigin(0.5);
      } else {
        statusBadge = this.add.text(0, -cardHeight / 2 + 50, '🔒 LOCKED', {
          fontFamily: "'Fredoka', Arial, sans-serif",
          fontSize: '13px',
          color: '#94a3b8'
        }).setOrigin(0.5);
      }

      // Character Model Preview with Voice Stinger Trigger!
      const previewContainer = this.add.container(0, -cardHeight / 2 + 155);
      const head = this.add.image(0, -30, `head_${f.skin}`).setScale(1.15);
      const torso = this.add.image(0, 4, `torso_${f.skin}`).setScale(1.1);
      const arm = this.add.image(8, -4, `arm_${f.skin}`).setScale(1.05);
      const weaponKey = f.floor === 5 ? 'weapon_sniper' : (f.floor === 4 ? 'weapon_shotgun' : (f.floor === 3 ? 'weapon_fish' : (f.floor === 2 ? 'weapon_bazooka' : 'weapon_pistol')));
      const weapon = this.add.image(18, -4, weaponKey).setScale(0.85);
      const legL = this.add.image(-6, 28, `leg_${f.skin}`);
      const legR = this.add.image(6, 28, `leg_${f.skin}`);

      if (f.floor === 5) {
        // Special Boss Crown on head
        const crown = this.add.text(0, -56, '👑', { fontSize: '28px' }).setOrigin(0.5);
        previewContainer.add(crown);
      }

      previewContainer.add([legL, legR, torso, arm, weapon, head]);

      if (!isUnlocked) {
        // Dim silhouette if locked
        head.setTint(0x334155);
        torso.setTint(0x334155);
        arm.setTint(0x334155);
        weapon.setTint(0x334155);
        legL.setTint(0x334155);
        legR.setTint(0x334155);
      } else {
        // Subtle breathing animation
        this.tweens.add({
          targets: previewContainer,
          y: previewContainer.y + 4,
          duration: 1000 + idx * 120,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }

      // Boss Name
      const nameTxt = this.add.text(0, 20, f.name, {
        fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
        fontSize: '18px',
        color: isUnlocked ? '#f8fafc' : '#64748b',
        stroke: '#000',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5);

      // Voice Stinger preview hint
      let previewHint = null;
      if (isUnlocked) {
        previewHint = this.add.text(0, 48, '🔊 Click for Voice', {
          fontFamily: "'Fredoka', Arial, sans-serif",
          fontSize: '12px',
          color: '#93c5fd'
        }).setOrigin(0.5);

        // Make avatar preview interactive for meme stinger
        previewContainer.setSize(90, 110).setInteractive({ useHandCursor: true });
        previewContainer.on('pointerdown', () => {
          soundFx.playMemeStinger(f.skin);
          this.tweens.add({
            targets: previewContainer,
            scale: 1.25,
            duration: 120,
            yoyo: true
          });
        });
      }

      // Themed Perk Box
      const perkBox = this.add.graphics();
      perkBox.fillStyle(0x000000, 0.45);
      perkBox.fillRoundedRect(-cardWidth / 2 + 10, 68, cardWidth - 20, 52, 10);
      const perkTxt = this.add.text(0, 94, `Perk:\n${f.perk}`, {
        fontFamily: "'Fredoka', Arial, sans-serif",
        fontSize: '12px',
        color: isUnlocked ? '#cbd5e1' : '#475569',
        align: 'center',
        wordWrap: { width: cardWidth - 24 }
      }).setOrigin(0.5);

      // Reward Banner
      const rewardTxt = this.add.text(0, 140, `Reward: +${f.reward} 🟡`, {
        fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
        fontSize: '15px',
        color: isUnlocked ? '#fbbf24' : '#64748b'
      }).setOrigin(0.5);

      // Action Button (Kenney 3D Button)
      let btnLabel = isCleared ? 'REPLAY ⚔️' : 'DUEL! ⚔️';
      let btnStyle = isCleared ? 'green' : (f.floor === 5 ? 'yellow' : 'blue');
      if (!isUnlocked) {
        btnLabel = 'LOCKED 🔒';
        btnStyle = 'grey';
      }

      const actionBtn = this.createKenneyButton(0, 185, btnLabel, btnStyle, cardWidth - 26, 42, () => {
        if (!isUnlocked) {
          soundFx.playHit();
          return;
        }
        soundFx.playDuelStart();
        soundFx.playMemeStinger(f.skin);
        this.time.delayedCall(200, () => {
          this.scene.start('GameScene', {
            mode: '1P',
            towerMode: true,
            towerFloor: f.floor,
            towerBot: f,
            targetScore: 3
          });
        });
      });

      card.add([cardBg, titleTxt, statusBadge, previewContainer, nameTxt, perkBox, perkTxt, rewardTxt, actionBtn]);
      if (previewHint) card.add(previewHint);
    });
  }

  createKenneyButton(x, y, text, style, width, height, callback) {
    const container = this.add.container(x, y);
    const normalTexture = `btn_${style}`;
    const pressedTexture = `btn_${style}_pressed`;
    const bg = this.add.image(0, 0, normalTexture);
    bg.setDisplaySize(width, height);

    const label = this.add.text(0, -2, text, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: width > 280 ? '18px' : '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.bg = bg;
    container.label = label;
    container.actionCallback = callback;
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.04));
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
      soundFx.playClick();
      callback(container);
    });

    return container;
  }

  createMasterCrownBanner(width, height) {
    const banner = this.add.container(width / 2, height - 35);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-240, -18, 480, 36, 12);
    bg.lineStyle(2, 0xf59e0b, 1);
    bg.strokeRoundedRect(-240, -18, 480, 36, 12);

    const txt = this.add.text(0, 0, '👑 TOWER MASTER CONQUEROR: ALL FLOORS DEFEATED! 👑', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '15px',
      color: '#fbbf24'
    }).setOrigin(0.5);

    banner.add([bg, txt]);
  }
}
