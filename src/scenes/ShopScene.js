import Phaser from 'phaser';
import { soundFx } from '../utils/SoundFx.js';
import { crazyGamesSDK } from '../utils/CrazyGamesSDK.js';

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create() {
    const { width, height } = this.scale;
    this.selectedPlayerSlot = 'p1'; // 'p1' or 'p2'

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x16a085, 0x16a085, 0x2c3e50, 0x1a252f, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 52, '🛒 MEME SKIN SHOP', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '46px',
      color: '#ffdd33',
      stroke: '#000',
      strokeThickness: 8,
      shadow: { offsetX: 2, offsetY: 4, color: '#e67e22', fill: true }
    }).setOrigin(0.5);

    // Coin Display Header
    this.coins = crazyGamesSDK.loadData('coins', 150);
    this.unlockedSkins = crazyGamesSDK.loadData('unlocked_skins', ['default']);
    this.equippedP1 = crazyGamesSDK.loadData('equipped_skin_p1', 'default');
    this.equippedP2 = crazyGamesSDK.loadData('equipped_skin_p2', 'capybara');

    this.coinContainer = this.add.container(width - 130, 50);
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

    // Back to Menu Button (Kenney Red 3D Button)
    const backBtn = this.add.container(95, 50);
    const backBg = this.add.image(0, 0, 'btn_red');
    backBg.setDisplaySize(130, 46);
    const backTxt = this.add.text(0, -2, '⬅ BACK', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black'",
      fontSize: '17px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBtn.setSize(130, 46).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover', () => backBtn.setScale(1.04));
    backBtn.on('pointerout', () => {
      backBtn.setScale(1.0);
      backBg.setTexture('btn_red');
      backTxt.setY(-2);
    });
    backBtn.on('pointerdown', () => {
      backBg.setTexture('btn_red_pressed');
      backTxt.setY(1);
    });
    backBtn.on('pointerup', () => {
      backBg.setTexture('btn_red');
      backTxt.setY(-2);
      soundFx.playClick();
      this.scene.start('MenuScene');
    });

    // P1 / P2 Switch Segmented Control
    this.createPlayerSlotToggle(width, height);

    // Skins Data
    this.skins = [
      { id: 'default', name: 'Original Bro', cost: 0 },
      { id: 'capybara', name: 'Chill Capybara', cost: 100 },
      { id: 'cat', name: 'Banana Cat', cost: 200 },
      { id: 'doge', name: 'Much Doge', cost: 300 },
      { id: 'noob', name: 'Cyber Noob', cost: 400 },
      { id: 'golden', name: 'Sigma Golden', cost: 500 }
    ];

    this.renderSkinCards(width, height);

    // Watch Ad For Free Coins Button (Bottom - Kenney Yellow 3D Button)
    this.adBtn = this.add.container(width / 2, height - 45);
    const adBg = this.add.image(0, 0, 'btn_yellow');
    adBg.setDisplaySize(380, 52);
    this.adTxt = this.add.text(0, -2, '🎁 WATCH AD FOR +100 COINS', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black'",
      fontSize: '19px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.adBtn.add([adBg, this.adTxt]);
    this.adBtn.bg = adBg;
    this.adBtn.setSize(380, 52).setInteractive({ useHandCursor: true });
    this.adBtn.on('pointerover', () => this.adBtn.setScale(1.03));
    this.adBtn.on('pointerout', () => {
      this.adBtn.setScale(1.0);
      this.adBtn.bg.setTexture('btn_yellow');
      this.adTxt.setY(-2);
    });
    this.adBtn.on('pointerdown', () => {
      this.adBtn.bg.setTexture('btn_yellow_pressed');
      this.adTxt.setY(1);
    });

    this.adBtn.on('pointerdown', () => {
      if (!crazyGamesSDK.isRewardedAdReady()) {
        const remainingAds = crazyGamesSDK.getDailyRewardedAdsRemaining();
        if (remainingAds <= 0) {
          this.showToast('Daily ad limit reached (0/5 left today)');
        } else {
          const remaining = crazyGamesSDK.getRemainingRewardedCooldown();
          this.showToast(`Ad on cooldown (${remaining}s remaining)`);
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
          this.renderSkinCards(width, height);
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

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.updateAdButtonState(crazyGamesSDK.isAdPlaying)
    });
  }

  createPlayerSlotToggle(width, height) {
    const toggleContainer = this.add.container(width / 2, 115);

    const bgBar = this.add.graphics();
    bgBar.fillStyle(0x0b1021, 0.7);
    bgBar.fillRoundedRect(-220, -20, 440, 40, 12);
    toggleContainer.add(bgBar);

    // P1 Tab
    this.p1Tab = this.add.container(-110, 0);
    this.p1TabBg = this.add.graphics();
    this.p1TabTxt = this.add.text(0, 0, '🟦 PLAYER 1 (BLUE)', {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.p1Tab.add([this.p1TabBg, this.p1TabTxt]);
    this.p1Tab.setSize(210, 36).setInteractive({ useHandCursor: true });
    this.p1Tab.on('pointerdown', () => {
      soundFx.playClick();
      this.selectedPlayerSlot = 'p1';
      this.refreshSlotToggle();
      this.renderSkinCards(width, height);
    });

    // P2 Tab
    this.p2Tab = this.add.container(110, 0);
    this.p2TabBg = this.add.graphics();
    this.p2TabTxt = this.add.text(0, 0, '🟥 PLAYER 2 (RED)', {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.p2Tab.add([this.p2TabBg, this.p2TabTxt]);
    this.p2Tab.setSize(210, 36).setInteractive({ useHandCursor: true });
    this.p2Tab.on('pointerdown', () => {
      soundFx.playClick();
      this.selectedPlayerSlot = 'p2';
      this.refreshSlotToggle();
      this.renderSkinCards(width, height);
    });

    toggleContainer.add([this.p1Tab, this.p2Tab]);
    this.refreshSlotToggle();
  }

  refreshSlotToggle() {
    const isP1 = this.selectedPlayerSlot === 'p1';

    this.p1TabBg.clear();
    this.p1TabBg.fillStyle(isP1 ? 0x3498db : 0x2c3e50, 1);
    this.p1TabBg.fillRoundedRect(-100, -16, 200, 32, 10);

    this.p2TabBg.clear();
    this.p2TabBg.fillStyle(!isP1 ? 0xe74c3c : 0x2c3e50, 1);
    this.p2TabBg.fillRoundedRect(-100, -16, 200, 32, 10);
  }

  updateAdButtonState(isBusy) {
    if (!this.adBtn || !this.adTxt) return;
    const remaining = crazyGamesSDK.getRemainingRewardedCooldown();
    const dailyRemaining = crazyGamesSDK.getDailyRewardedAdsRemaining();

    if (isBusy) {
      this.adTxt.setText('⏳ LOADING AD...');
      this.adBtn.bg.setTexture('btn_grey');
    } else if (dailyRemaining <= 0) {
      this.adTxt.setText('🎁 DAILY LIMIT (0/5 LEFT)');
      this.adBtn.bg.setTexture('btn_grey');
    } else if (remaining > 0) {
      this.adTxt.setText(`⏳ AD COOLDOWN (${remaining}s)`);
      this.adBtn.bg.setTexture('btn_grey');
    } else {
      this.adTxt.setText(`🎁 WATCH AD FOR +100 COINS (${dailyRemaining}/5)`);
      this.adBtn.bg.setTexture('btn_yellow');
    }
  }

  renderSkinCards(width, height) {
    if (this.cardsContainer) {
      this.cardsContainer.destroy();
    }
    this.cardsContainer = this.add.container(0, 0);

    const cols = 3;
    const startX = width / 2 - 360;
    const startY = 225;
    const gapX = 360;
    const gapY = 200;

    const currentEquipped = this.selectedPlayerSlot === 'p1' ? this.equippedP1 : this.equippedP2;

    this.skins.forEach((skin, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = startX + col * gapX;
      const y = startY + row * gapY;

      const isUnlocked = this.unlockedSkins.includes(skin.id);
      const isEquipped = currentEquipped === skin.id;

      const card = this.add.container(x, y);

      // Card Background
      const cardBg = this.add.graphics();
      cardBg.fillStyle(isEquipped ? 0x27ae60 : (isUnlocked ? 0x2c3e50 : 0x1f242d), 0.92);
      cardBg.fillRoundedRect(-155, -80, 310, 160, 16);
      cardBg.lineStyle(3, isEquipped ? 0x2ecc71 : (isUnlocked ? 0x3498db : 0x7f8c8d), 1);
      cardBg.strokeRoundedRect(-155, -80, 310, 160, 16);

      // Complete Mini-Ragdoll Character Preview (Head, Torso, Arm, Weapon, Legs)
      const previewContainer = this.add.container(-85, 0);
      const head = this.add.image(0, -26, `head_${skin.id}`).setScale(0.9);
      const torso = this.add.image(0, 4, `torso_${skin.id}`).setScale(0.9);
      const arm = this.add.image(6, -2, `arm_${skin.id}`).setScale(0.85);
      const weapon = this.add.image(14, -2, 'weapon_pistol').setScale(0.7);
      const legL = this.add.image(-5, 24, `leg_${skin.id}`).setScale(0.8);
      const legR = this.add.image(5, 24, `leg_${skin.id}`).setScale(0.8);

      previewContainer.add([legL, legR, torso, arm, weapon, head]);

      // Subtle Idle breathing animation
      this.tweens.add({
        targets: previewContainer,
        y: 3,
        duration: 1200 + idx * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Preview click to trigger meme voice stinger
      previewContainer.setSize(70, 90).setInteractive({ useHandCursor: true });
      previewContainer.on('pointerdown', () => {
        soundFx.playMemeStinger(skin.id);
        this.tweens.add({
          targets: previewContainer,
          scale: 1.15,
          duration: 120,
          yoyo: true
        });
      });

      // Skin Name
      const nameTxt = this.add.text(-25, -55, skin.name, {
        fontFamily: 'Arial Black',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 4
      });

      // Price Tag or Status Label
      let priceTxt = null;
      if (!isUnlocked) {
        priceTxt = this.add.text(-25, -28, `Cost: ${skin.cost} 🟡`, {
          fontFamily: 'Arial',
          fontSize: '14px',
          color: this.coins >= skin.cost ? '#f1c40f' : '#e74c3c',
          stroke: '#000',
          strokeThickness: 2
        });
      }

      // Status / Action Button
      let btnBgColor = 0x3498db;
      let btnLabel = 'EQUIP';

      if (isEquipped) {
        btnBgColor = 0x27ae60;
        btnLabel = 'EQUIPPED';
      } else if (!isUnlocked) {
        btnBgColor = this.coins >= skin.cost ? 0xf39c12 : 0x7f8c8d;
        btnLabel = `UNLOCK (${skin.cost} 🟡)`;
      }

      const actionBtn = this.add.container(40, 25);
      const actionBg = this.add.graphics();
      actionBg.fillStyle(btnBgColor, 1);
      actionBg.fillRoundedRect(-85, -20, 170, 40, 10);
      const actionTxt = this.add.text(0, 0, btnLabel, {
        fontFamily: 'Arial Black',
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);
      actionBtn.add([actionBg, actionTxt]);

      if (!isEquipped) {
        actionBtn.setSize(170, 40).setInteractive({ useHandCursor: true });
        actionBtn.on('pointerdown', () => {
          if (!isUnlocked) {
            if (this.coins >= skin.cost) {
              soundFx.playCoin();
              soundFx.playMemeStinger(skin.id);
              this.coins -= skin.cost;
              this.unlockedSkins.push(skin.id);

              if (this.selectedPlayerSlot === 'p1') {
                this.equippedP1 = skin.id;
                crazyGamesSDK.saveData('equipped_skin_p1', this.equippedP1);
              } else {
                this.equippedP2 = skin.id;
                crazyGamesSDK.saveData('equipped_skin_p2', this.equippedP2);
              }

              crazyGamesSDK.saveData('coins', this.coins);
              crazyGamesSDK.saveData('unlocked_skins', this.unlockedSkins);
              this.coinText.setText(`${this.coins}`);
              this.showToast(`Unlocked ${skin.name}! 🎉`);
              this.renderSkinCards(width, height);
            } else {
              soundFx.playFallTroll();
              this.showToast(`Need ${skin.cost - this.coins} more coins! 🪙`);
            }
          } else {
            soundFx.playClick();
            soundFx.playMemeStinger(skin.id);
            if (this.selectedPlayerSlot === 'p1') {
              this.equippedP1 = skin.id;
              crazyGamesSDK.saveData('equipped_skin_p1', this.equippedP1);
            } else {
              this.equippedP2 = skin.id;
              crazyGamesSDK.saveData('equipped_skin_p2', this.equippedP2);
            }
            this.showToast(`Equipped to ${this.selectedPlayerSlot.toUpperCase()}! 👍`);
            this.renderSkinCards(width, height);
          }
        });
      }

      card.add([cardBg, previewContainer, nameTxt, actionBtn]);
      if (priceTxt) card.add(priceTxt);
      this.cardsContainer.add(card);
    });
  }

  showToast(message) {
    const { width, height } = this.scale;
    const toast = this.add.container(width / 2, height - 100).setDepth(200);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRoundedRect(-180, -20, 360, 40, 10);
    bg.lineStyle(2, 0xf1c40f, 1);
    bg.strokeRoundedRect(-180, -20, 360, 40, 10);

    const txt = this.add.text(0, 0, message, {
      fontFamily: 'Arial Black',
      fontSize: '15px',
      color: '#f1c40f'
    }).setOrigin(0.5);

    toast.add([bg, txt]);
    this.tweens.add({
      targets: toast,
      y: height - 120,
      alpha: { from: 1, to: 0 },
      duration: 1600,
      ease: 'Cubic.out',
      onComplete: () => toast.destroy()
    });
  }
}
