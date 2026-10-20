import Phaser from 'phaser';
import { soundFx } from '../utils/SoundFx.js';
import { crazyGamesSDK } from '../utils/CrazyGamesSDK.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.gameMode = data.mode || '1P'; // '1P' or '2P'
    this.isTowerMode = !!data.towerMode;
    this.towerFloor = data.towerFloor || 1;
    this.towerBot = data.towerBot || null;
    this.towerReward = data.towerBot?.reward || (this.towerFloor * 50 + 50);

    this.scoreP1 = 0;
    this.scoreP2 = 0;
    this.targetScore = this.isTowerMode ? 3 : (data.targetScore || 5);
    this.currentRound = 1;
    this.isRoundOver = false;
    this.isMatchOver = false;
    this.isPaused = false;
    this.isCountingDown = false;
    this.isKOCamActive = false;

    this.suddenDeathTimer = 0;
    this.suddenDeathActive = false;
    this.arenaType = 'rooftop';
    this.activeWeapon = 'pistol';

    // Trauma Shake system
    this.trauma = 0;

    // Helipad wind system
    this.windTimer = 0;
    this.windForce = 0;

    // Grounded tracking for landing dust
    this.prevP1Grounded = false;
    this.prevP2Grounded = false;

    // Projectile tracking
    this.projectiles = [];
    this.lastSmokeEmit = 0;
  }

  create() {
    crazyGamesSDK.gameplayStart();

    const { width, height } = this.scale;
    this.matter.world.setBounds(0, -500, width, height + 800);
    this.matter.world.setGravity(0, 1.2);

    // Initial Arena
    const arenas = ['rooftop', 'iceberg', 'beam', 'helipad', 'bouncy'];
    this.arenaType = Phaser.Utils.Array.GetRandom(arenas);

    this.createBackground(width, height);
    this.createArenaPlatform(width, height);
    this.createLavaHazard(width, height);

    // Retrieve Equipped Skins
    const skinP1 = crazyGamesSDK.loadData('equipped_skin_p1', 'default');
    let skinP2 = 'capybara';

    if (this.isTowerMode && this.towerBot) {
      skinP2 = this.towerBot.skin;
    } else if (this.isTowerMode) {
      const towerSkins = ['noob', 'capybara', 'cat', 'doge', 'golden'];
      skinP2 = towerSkins[Math.min(4, this.towerFloor - 1)];
    } else if (this.gameMode === '1P') {
      skinP2 = Phaser.Utils.Array.GetRandom(['capybara', 'cat', 'doge', 'noob', 'golden']);
    } else {
      skinP2 = crazyGamesSDK.loadData('equipped_skin_p2', 'capybara');
    }

    // Create Players
    this.player1 = this.createPlayer(width * 0.3, height * 0.45, 1, skinP1);
    this.player2 = this.createPlayer(width * 0.7, height * 0.45, 2, skinP2);

    // Apply Tower Boss perks if in tower mode
    if (this.isTowerMode) {
      this.applyTowerBossPerks(this.player2, this.towerFloor);
    }

    // Sniper Laser Sight Guide Graphics
    this.laserSightGfx = this.add.graphics().setDepth(35);

    // Collision listeners
    this.matter.world.on('collisionstart', this.handleCollisions, this);

    // Setup Keyboard & Touch Controls
    this.setupControls(width, height);

    // UI Scoreboard & HUD Badges
    this.createScoreboard(width, height);

    // Onboarding Prompt on Round 1
    this.createOnboardingPrompt(width, height);

    // Start Round
    this.startRound();
  }

  applyTowerBossPerks(bot, floor) {
    if (floor === 2) {
      // Chill Capybara: Heavy Tank mass
      bot.torso.setDensity(0.009);
      bot.isTank = true;
    } else if (floor === 3) {
      // Banana Cat: High agility jump boost
      bot.isAgile = true;
    } else if (floor === 4) {
      // Much Doge: Rapid fire bot
      bot.isRapid = true;
    } else if (floor === 5) {
      // Sigma Golden Boss: Apex overlord with crown
      bot.isBoss = true;
      bot.crownText = this.add.text(bot.torso.x, bot.torso.y - 50, '👑', { fontSize: '26px' }).setOrigin(0.5).setDepth(60);
    }
  }

  createBackground(width, height) {
    if (this.bgGraphics) this.bgGraphics.destroy();
    this.bgGraphics = this.add.graphics().setDepth(-10);

    if (this.arenaType === 'iceberg') {
      this.bgGraphics.fillGradientStyle(0x0f2027, 0x203a43, 0x2c5364, 0x74b9ff, 1);
    } else if (this.arenaType === 'beam') {
      this.bgGraphics.fillGradientStyle(0x232526, 0x414345, 0xd35400, 0xf39c12, 1);
    } else if (this.arenaType === 'helipad') {
      this.bgGraphics.fillGradientStyle(0x1e272e, 0x2f3640, 0x485460, 0x718093, 1);
    } else if (this.arenaType === 'bouncy') {
      this.bgGraphics.fillGradientStyle(0x2c003e, 0x510a63, 0x8e44ad, 0x00cec9, 1);
    } else {
      this.bgGraphics.fillGradientStyle(0x141e30, 0x243b55, 0x8e44ad, 0x3498db, 1);
    }
    this.bgGraphics.fillRect(0, 0, width, height);

    // City Silhouette
    if (!this.skylineGraphics) {
      this.skylineGraphics = this.add.graphics().setDepth(-5);
      this.skylineGraphics.fillStyle(0x070b14, 0.6);
      for (let x = 30; x < width; x += 120) {
        const h = Phaser.Math.Between(180, 380);
        this.skylineGraphics.fillRect(x, height - h, 90, h);
      }
    }
  }

  createArenaPlatform(width, height) {
    const platformY = height * 0.68;

    if (this.platform) {
      this.matter.world.remove(this.platform);
      this.platform.destroy();
    }

    if (this.arenaType === 'iceberg') {
      this.platformHeight = 100;
      this.platformWidth = 750;
      this.platform = this.matter.add.image(width / 2, platformY, 'platform_iceberg', null, {
        isStatic: true,
        friction: 0.005, // Super slippery ice
        restitution: 0.3
      });
    } else if (this.arenaType === 'beam') {
      this.platformHeight = 45;
      this.platformWidth = 700;
      this.platform = this.matter.add.image(width / 2, platformY, 'platform_beam', null, {
        isStatic: true,
        friction: 0.2,
        restitution: 0.2
      });
    } else if (this.arenaType === 'helipad') {
      this.platformHeight = 120;
      this.platformWidth = 800;
      this.platform = this.matter.add.image(width / 2, platformY, 'platform_helipad', null, {
        isStatic: true,
        friction: 0.12,
        restitution: 0.15
      });
    } else if (this.arenaType === 'bouncy') {
      this.platformHeight = 90;
      this.platformWidth = 750;
      this.platform = this.matter.add.image(width / 2, platformY, 'platform_bouncy', null, {
        isStatic: true,
        friction: 0.04,
        restitution: 0.85 // High bounce factor!
      });
    } else {
      this.platformHeight = 120;
      this.platformWidth = 800;
      this.platform = this.matter.add.image(width / 2, platformY, 'platform_rooftop', null, {
        isStatic: true,
        friction: 0.1,
        restitution: 0.1
      });
    }
  }

  createLavaHazard(width, height) {
    this.lava = this.add.image(width / 2, height + 80, 'hazard_lava').setAlpha(0.92).setDepth(40);
    this.lavaYStart = height + 80;
    this.lavaYMax = height * 0.72;
  }

  createPlayer(x, y, id, skinKey) {
    const torso = this.matter.add.image(x, y, `torso_${skinKey}`, null, {
      friction: 0.1,
      frictionAir: 0.02,
      restitution: 0.1,
      density: 0.004,
      chamfer: { radius: 6 }
    });

    const head = this.add.image(x, y - 28, `head_${skinKey}`);
    const arm = this.add.image(x, y - 5, `arm_${skinKey}`).setOrigin(0.5, 0.1);
    const weapon = this.add.image(x, y - 5, 'weapon_pistol').setOrigin(0.2, 0.5);

    const legL = this.add.image(x - 6, y + 26, `leg_${skinKey}`).setOrigin(0.5, 0.1);
    const legR = this.add.image(x + 6, y + 26, `leg_${skinKey}`).setOrigin(0.5, 0.1);

    return {
      id,
      skinKey,
      torso,
      head,
      arm,
      weapon,
      legL,
      legR,
      currentWeaponType: 'pistol',
      isGrounded: false,
      wasGroundedPrev: false,
      isLeaning: false,
      leanAngle: 0,
      facing: id === 1 ? 1 : -1,
      canShoot: true,
      lastShootTime: 0,
      isAlive: true,
      wasJumpPressed: false,
      lastGroundedTime: 0,
      lastJumpInputTime: 0,
      weaponRecoilOffset: 0,
      aiNextActionTime: 0,
      isTank: false,
      isAgile: false,
      isRapid: false,
      isBoss: false,
      crownText: null
    };
  }

  setupControls(width, height) {
    this.keys = this.input.keyboard.addKeys({
      p1Jump: Phaser.Input.Keyboard.KeyCodes.W,
      p1Shoot: Phaser.Input.Keyboard.KeyCodes.E,
      p2Jump: Phaser.Input.Keyboard.KeyCodes.I,
      p2Shoot: Phaser.Input.Keyboard.KeyCodes.O,
      p1JumpAlt: Phaser.Input.Keyboard.KeyCodes.SPACE,
      p2JumpAlt: Phaser.Input.Keyboard.KeyCodes.UP,
      p2ShootAlt: Phaser.Input.Keyboard.KeyCodes.ENTER,
      pauseKey: Phaser.Input.Keyboard.KeyCodes.ESC,
      pauseKeyAlt: Phaser.Input.Keyboard.KeyCodes.P
    });

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());

    const isTouchDevice = this.sys.game.device.input.touch || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
      this.input.addPointer(2);
      this.createTouchControls(width, height);
    }
  }

  createTouchControls(width, height) {
    this.touchP1Jump = false;
    this.touchP2Jump = false;

    this.createTouchButton(115, height - 75, '🦘 JUMP', 'W / Space', 0x2980b9, 
      () => { this.touchP1Jump = true; }, 
      () => { this.touchP1Jump = false; }
    );
    this.createTouchButton(260, height - 75, '💥 SHOOT', 'E', 0xd35400, 
      () => { this.handlePlayerShoot(this.player1); }, 
      null
    );

    if (this.gameMode === '2P') {
      this.createTouchButton(width - 260, height - 75, '💥 SHOOT', 'O / Enter', 0xc0392b, 
        () => { this.handlePlayerShoot(this.player2); }, 
        null
      );
      this.createTouchButton(width - 115, height - 75, '🦘 JUMP', 'I / Up', 0x8e44ad, 
        () => { this.touchP2Jump = true; }, 
        () => { this.touchP2Jump = false; }
      );
    }
  }

  createTouchButton(x, y, text, subtext, color, onDown, onUp) {
    const container = this.add.container(x, y).setScrollFactor(0).setDepth(100);
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.85);
    bg.fillRoundedRect(-60, -36, 120, 72, 16);
    bg.lineStyle(3, 0xffffff, 0.9);
    bg.strokeRoundedRect(-60, -36, 120, 72, 16);

    const txt = this.add.text(0, -8, text, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black'",
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const sub = this.add.text(0, 16, subtext, {
      fontFamily: "'Fredoka', Arial",
      fontSize: '12px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    container.add([bg, txt, sub]);
    container.setSize(120, 72).setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => {
      bg.setAlpha(1.0);
      container.setScale(0.94);
      if (onDown) onDown();
    });
    container.on('pointerup', () => {
      bg.setAlpha(0.85);
      container.setScale(1.0);
      if (onUp) onUp();
    });
    container.on('pointerout', () => {
      bg.setAlpha(0.85);
      container.setScale(1.0);
      if (onUp) onUp();
    });
  }

  createScoreboard(width, height) {
    this.scoreContainer = this.add.container(width / 2, 45).setDepth(90);

    const scoreBg = this.add.graphics();
    scoreBg.fillStyle(0x000000, 0.65);
    scoreBg.fillRoundedRect(-240, -28, 480, 56, 16);
    scoreBg.lineStyle(2, 0xffffff, 0.3);
    scoreBg.strokeRoundedRect(-240, -28, 480, 56, 16);

    const modeTitle = this.isTowerMode 
      ? `FLOOR ${this.towerFloor} GAUNTLET` 
      : `FIRST TO ${this.targetScore}`;

    this.scoreText = this.add.text(0, -6, `P1: ${this.scoreP1}   [${modeTitle}]   P2: ${this.scoreP2}`, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '21px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5);

    this.weaponBadge = this.add.text(0, 16, '🔫 WEAPON: PISTOL', {
      fontFamily: 'Arial Black',
      fontSize: '13px',
      color: '#f1c40f'
    }).setOrigin(0.5);

    this.scoreContainer.add([scoreBg, this.scoreText, this.weaponBadge]);

    // Sudden Death Warning Gauge
    this.suddenDeathIndicator = this.add.text(width / 2, 90, '⏰ Sudden Death in: 20s', {
      fontFamily: 'Arial Black',
      fontSize: '14px',
      color: '#ecf0f1',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(90);

    // Pause Button ⏸
    const pauseBtn = this.add.container(width - 55, 45).setDepth(110);
    const pBg = this.add.graphics();
    pBg.fillStyle(0x34495e, 0.85);
    pBg.fillRoundedRect(-25, -25, 50, 50, 12);
    pBg.lineStyle(2, 0xffffff, 0.6);
    pBg.strokeRoundedRect(-25, -25, 50, 50, 12);

    const pTxt = this.add.text(0, 0, '⏸', {
      fontFamily: 'Arial',
      fontSize: '22px'
    }).setOrigin(0.5);

    pauseBtn.add([pBg, pTxt]);
    pauseBtn.setSize(50, 50).setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => {
      soundFx.playClick();
      this.togglePause();
    });

    // Countdown and Round Announcement Banner
    this.bannerText = this.add.text(width / 2, height * 0.35, '', {
      fontFamily: 'Arial Black',
      fontSize: '48px',
      color: '#ffdd33',
      stroke: '#000',
      strokeThickness: 8,
      align: 'center'
    }).setOrigin(0.5).setAlpha(0).setDepth(120);

    // Giant KO Banner
    this.koBannerText = this.add.text(width / 2, height * 0.35, 'K.O.!', {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '96px',
      color: '#ff0033',
      stroke: '#ffffff',
      strokeThickness: 12,
      shadow: { offsetX: 6, offsetY: 8, color: '#000000', blur: 6, fill: true }
    }).setOrigin(0.5).setAlpha(0).setDepth(180);
  }

  createOnboardingPrompt(width, height) {
    if (this.currentRound === 1 && !this.isTowerMode) {
      const tip = this.add.container(width / 2, height * 0.82).setDepth(120);
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.8);
      bg.fillRoundedRect(-320, -22, 640, 44, 12);
      bg.lineStyle(2, 0x3498db, 0.9);
      bg.strokeRoundedRect(-320, -22, 640, 44, 12);

      const txt = this.add.text(0, 0, '💡 HOLD [W/I] to Lean & Leap! RELEASE to Stand! Recoil pushes you back!', {
        fontFamily: 'Arial Black',
        fontSize: '14px',
        color: '#ffffff'
      }).setOrigin(0.5);

      tip.add([bg, txt]);

      this.time.delayedCall(3800, () => {
        this.tweens.add({
          targets: tip,
          alpha: 0,
          y: tip.y + 20,
          duration: 500,
          onComplete: () => tip.destroy()
        });
      });
    }
  }

  togglePause() {
    if (this.isMatchOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      crazyGamesSDK.gameplayStop();
      this.matter.world.pause();
      this.showPauseModal();
    } else {
      if (this.pauseModal) {
        this.pauseModal.destroy();
        this.pauseModal = null;
      }
      this.matter.world.resume();
      crazyGamesSDK.gameplayStart();
    }
  }

  showPauseModal() {
    const { width, height } = this.scale;
    this.pauseModal = this.add.container(width / 2, height / 2).setDepth(300);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const dialog = this.add.graphics();
    dialog.fillStyle(0x1a252f, 0.96);
    dialog.fillRoundedRect(-220, -180, 440, 360, 20);
    dialog.lineStyle(3, 0x3498db, 1);
    dialog.strokeRoundedRect(-220, -180, 440, 360, 20);

    const title = this.add.text(0, -135, '⏸ GAME PAUSED', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '34px',
      color: '#f1c40f',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const resumeBtn = this.createKenneyButton(0, -60, '▶ RESUME', 'green', 280, 46, () => {
      this.togglePause();
    });

    const rematchBtn = this.createKenneyButton(0, 0, '🔄 RESTART MATCH', 'yellow', 280, 46, () => {
      this.togglePause();
      this.scene.restart({
        mode: this.gameMode,
        towerMode: this.isTowerMode,
        towerFloor: this.towerFloor,
        towerBot: this.towerBot,
        targetScore: this.targetScore
      });
    });

    const sfxLabel = soundFx.isUserMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
    const soundBtn = this.createKenneyButton(0, 60, sfxLabel, 'blue', 280, 46, (btn) => {
      soundFx.isMuted = !soundFx.isUserMuted;
      btn.label.setText(soundFx.isUserMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON');
    });

    const exitDestination = this.isTowerMode ? 'MemeTowerScene' : 'MenuScene';
    const exitLabel = this.isTowerMode ? '🏯 TOWER SELECT' : '🏠 MAIN MENU';

    const menuBtn = this.createKenneyButton(0, 120, exitLabel, 'red', 280, 46, () => {
      this.matter.world.resume();
      this.scene.start(exitDestination);
    });

    this.pauseModal.add([overlay, dialog, title, resumeBtn, rematchBtn, soundBtn, menuBtn]);
  }

  createKenneyButton(x, y, text, style, width, height, callback) {
    const container = this.add.container(x, y);
    const normalTexture = `btn_${style}`;
    const pressedTexture = `btn_${style}_pressed`;
    const bg = this.add.image(0, 0, normalTexture);
    bg.setDisplaySize(width, height);

    const label = this.add.text(0, -2, text, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: width > 320 ? '19px' : '16px',
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

    container.on('pointerover', () => container.setScale(1.03));
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

  startRound() {
    this.isRoundOver = false;
    this.suddenDeathTimer = 0;
    this.suddenDeathActive = false;
    this.lava.setY(this.lavaYStart);

    const { width, height } = this.scale;

    // Randomize Arena Platform from 5 Arenas
    const arenas = ['rooftop', 'iceberg', 'beam', 'helipad', 'bouncy'];
    this.arenaType = Phaser.Utils.Array.GetRandom(arenas);
    this.createBackground(width, height);
    this.createArenaPlatform(width, height);

    // Reset Player Positions
    this.resetPlayer(this.player1, width * 0.3, height * 0.45);
    this.resetPlayer(this.player2, width * 0.7, height * 0.45);

    // Assign Random Weapons from 7 total weapons
    const weaponTypes = ['pistol', 'bazooka', 'fish', 'grenade', 'laser', 'shotgun', 'sniper'];
    this.activeWeapon = Phaser.Utils.Array.GetRandom(weaponTypes);
    this.equipPlayerWeapon(this.player1, this.activeWeapon);
    this.equipPlayerWeapon(this.player2, this.activeWeapon);

    // Update HUD Weapon Badge
    const weaponIcons = {
      pistol: '🔫 PISTOL',
      bazooka: '🚀 BAZOOKA',
      fish: '🐟 MEME TUNA',
      grenade: '💣 GRENADE',
      laser: '⚡ LASER BEAM',
      shotgun: '💥 SHOTGUN',
      sniper: '🎯 SNIPER RIFLE'
    };
    this.weaponBadge.setText(`WEAPON: ${weaponIcons[this.activeWeapon] || this.activeWeapon.toUpperCase()}`);

    // Start 3... 2... 1... DUEL! Countdown
    this.startRoundCountdown();
  }

  startRoundCountdown() {
    this.isCountingDown = true;

    const countSteps = [
      { text: '3', sfx: () => soundFx.playCountdownTick(), scale: 1.4 },
      { text: '2', sfx: () => soundFx.playCountdownTick(), scale: 1.4 },
      { text: '1', sfx: () => soundFx.playCountdownTick(), scale: 1.4 },
      { text: 'DUEL!', sfx: () => soundFx.playDuelStart(), scale: 1.8 }
    ];

    countSteps.forEach((step, idx) => {
      this.time.delayedCall(idx * 650, () => {
        if (this.isMatchOver) return;

        this.bannerText.setText(step.text);
        this.bannerText.setAlpha(1).setScale(0.4);
        if (step.text === 'DUEL!') {
          this.bannerText.setColor('#ffdd33');
          this.addTrauma(0.2);
        } else {
          this.bannerText.setColor('#ffffff');
        }

        step.sfx();

        this.tweens.add({
          targets: this.bannerText,
          scale: step.scale,
          duration: 350,
          ease: 'Back.out',
          onComplete: () => {
            if (idx === countSteps.length - 1) {
              this.time.delayedCall(400, () => {
                this.tweens.add({
                  targets: this.bannerText,
                  alpha: 0,
                  duration: 250,
                  onComplete: () => {
                    this.isCountingDown = false;
                  }
                });
              });
            }
          }
        });
      });
    });
  }

  resetPlayer(player, x, y) {
    player.isAlive = true;
    player.isLeaning = false;
    player.leanAngle = 0;
    player.wasJumpPressed = false;
    player.lastGroundedTime = 0;
    player.lastJumpInputTime = 0;
    player.weaponRecoilOffset = 0;
    player.aiJumpUntil = 0;
    player.aiNextShootTime = 0;
    player.aiNextJumpTime = 0;
    player.aiNextActionTime = 0;
    player.torso.setPosition(x, y);
    player.torso.setVelocity(0, 0);
    player.torso.setAngularVelocity(0);
    player.torso.setAngle(0);
    player.torso.setStatic(false);
  }

  equipPlayerWeapon(player, weaponType) {
    player.currentWeaponType = weaponType;
    player.weapon.setTexture(`weapon_${weaponType}`);
  }

  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  update(time, delta) {
    if (this.isMatchOver || this.isPaused) return;

    const { width, height } = this.scale;

    // Decay trauma-based screen shake
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - (delta / 1000) * 1.8);
      const shakeFactor = this.trauma * this.trauma * 0.028;
      if (shakeFactor > 0.001) {
        this.cameras.main.shake(16, shakeFactor);
      }
    }

    // Helipad Wind Gust mechanics
    if (this.arenaType === 'helipad' && !this.isCountingDown) {
      this.windTimer += delta;
      if (this.windTimer > 4000) {
        this.windTimer = 0;
        this.windForce = Phaser.Math.FloatBetween(-0.004, 0.004);
        this.spawnWindGustParticles(width, height);
      }
      if (Math.abs(this.windForce) > 0.0005) {
        if (!this.player1.isGrounded) this.player1.torso.applyForce({ x: this.windForce, y: 0 });
        if (!this.player2.isGrounded) this.player2.torso.applyForce({ x: this.windForce, y: 0 });
      }
    }

    // Handle Player Inputs (frozen during countdown)
    if (!this.isCountingDown) {
      const p1JumpPressed = this.keys.p1Jump.isDown || this.keys.p1JumpAlt.isDown || this.touchP1Jump;
      this.updatePlayerPhysics(this.player1, p1JumpPressed, time);

      if (Phaser.Input.Keyboard.JustDown(this.keys.p1Shoot)) {
        this.handlePlayerShoot(this.player1);
      }

      if (this.gameMode === '2P') {
        const p2JumpPressed = this.keys.p2Jump.isDown || this.keys.p2JumpAlt.isDown || this.touchP2Jump;
        this.updatePlayerPhysics(this.player2, p2JumpPressed, time);

        if (Phaser.Input.Keyboard.JustDown(this.keys.p2Shoot) || Phaser.Input.Keyboard.JustDown(this.keys.p2ShootAlt)) {
          this.handlePlayerShoot(this.player2);
        }
      } else {
        const cpuJumpPressed = this.updateCpuAI(this.player2, time);
        this.updatePlayerPhysics(this.player2, cpuJumpPressed, time);
      }
    }

    // Check Landing Dust for both characters
    this.checkLandingDust(this.player1);
    this.checkLandingDust(this.player2);

    // Sync Ragdoll graphics
    this.syncPlayerRagdoll(this.player1);
    this.syncPlayerRagdoll(this.player2);

    // Rocket Smoke Trails for active bazooka rockets
    this.updateRocketSmoke(time);

    // Sniper Laser Sight Guide
    this.updateSniperLaserSight(width);

    // Sudden Death Lava Rising (after 20s)
    if (!this.isCountingDown) {
      this.suddenDeathTimer += delta;
      if (this.suddenDeathTimer < 20000) {
        const remainingSec = Math.ceil((20000 - this.suddenDeathTimer) / 1000);
        this.suddenDeathIndicator.setText(`⏰ Sudden Death in: ${remainingSec}s`);
        this.suddenDeathIndicator.setColor(remainingSec <= 5 ? '#e74c3c' : '#ecf0f1');
      } else if (!this.suddenDeathActive) {
        this.suddenDeathActive = true;
        this.suddenDeathIndicator.setText('🔥 SUDDEN DEATH ACTIVE! LAVA RISING!');
        this.suddenDeathIndicator.setColor('#e74c3c');
        this.bannerText.setText('🔥 SUDDEN DEATH! 🔥\nLAVA RISING!').setAlpha(1);
        this.tweens.add({ targets: this.bannerText, alpha: 0, duration: 1800, delay: 900 });
      }

      if (this.suddenDeathActive) {
        if (this.lava.y > this.lavaYMax) {
          this.lava.y -= 0.65;
        }
        // Emit floating embers from lava bottom
        if (Math.random() < 0.3) {
          this.spawnSuddenDeathEmber(width, height);
        }
      }
    }

    // Check Fall Death / Lava Touch
    if (!this.isRoundOver) {
      const p1Dead = this.player1.torso.y > height + 100 || (this.suddenDeathActive && this.player1.torso.y > this.lava.y - 40);
      const p2Dead = this.player2.torso.y > height + 100 || (this.suddenDeathActive && this.player2.torso.y > this.lava.y - 40);

      if (p1Dead && p2Dead) {
        this.endRound(0);
      } else if (p1Dead) {
        this.endRound(2);
      } else if (p2Dead) {
        this.endRound(1);
      }
    }
  }

  spawnWindGustParticles(width, height) {
    const dir = this.windForce > 0 ? 1 : -1;
    for (let i = 0; i < 12; i++) {
      const startX = dir > 0 ? -20 : width + 20;
      const py = Phaser.Math.Between(height * 0.35, height * 0.7);
      const puff = this.add.image(startX, py, 'particle_dust').setAlpha(0.6).setScale(Phaser.Math.FloatBetween(0.6, 1.2)).setDepth(20);
      this.tweens.add({
        targets: puff,
        x: startX + dir * Phaser.Math.Between(500, 900),
        y: py + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(1200, 1800),
        onComplete: () => puff.destroy()
      });
    }
  }

  spawnSuddenDeathEmber(width, height) {
    const ember = this.add.image(
      Phaser.Math.Between(50, width - 50),
      this.lava.y - Phaser.Math.Between(0, 30),
      'particle_ember'
    ).setDepth(45).setScale(Phaser.Math.FloatBetween(0.8, 1.4));

    this.tweens.add({
      targets: ember,
      y: ember.y - Phaser.Math.Between(120, 260),
      x: ember.x + Phaser.Math.Between(-40, 40),
      alpha: { from: 1, to: 0 },
      scale: 0.2,
      duration: Phaser.Math.Between(1000, 1800),
      onComplete: () => ember.destroy()
    });
  }

  checkLandingDust(player) {
    const grounded = this.isPlayerGrounded(player);
    if (grounded && !player.wasGroundedPrev) {
      const vy = player.torso.body.velocity.y;
      if (vy > 2.2) {
        soundFx.playLand();
        this.spawnLandingDustPuffs(player.torso.x, player.torso.y + 36);
        this.addTrauma(0.08);
      }
    }
    player.wasGroundedPrev = grounded;
  }

  spawnLandingDustPuffs(x, y) {
    [-1, 1].forEach(dir => {
      for (let i = 0; i < 3; i++) {
        const dust = this.add.image(x, y, 'particle_dust').setScale(0.8).setAlpha(0.7).setDepth(25);
        this.tweens.add({
          targets: dust,
          x: x + dir * Phaser.Math.Between(25, 55),
          y: y - Phaser.Math.Between(2, 14),
          scale: 1.3,
          alpha: 0,
          duration: 350,
          onComplete: () => dust.destroy()
        });
      }
    });
  }

  updateRocketSmoke(time) {
    if (time - this.lastSmokeEmit < 45) return;
    this.lastSmokeEmit = time;

    this.projectiles.forEach(bullet => {
      if (bullet && bullet.body && bullet.weaponType === 'bazooka') {
        const smoke = this.add.image(bullet.x, bullet.y, 'particle_smoke').setScale(Phaser.Math.FloatBetween(0.6, 1.0)).setAlpha(0.65).setDepth(30);
        this.tweens.add({
          targets: smoke,
          scale: 1.4,
          alpha: 0,
          duration: 400,
          onComplete: () => smoke.destroy()
        });
      }
    });
  }

  updateSniperLaserSight(width) {
    this.laserSightGfx.clear();

    [this.player1, this.player2].forEach(p => {
      if (p.isAlive && p.currentWeaponType === 'sniper') {
        const rot = p.torso.rotation;
        const facing = p.facing;
        const spawnX = p.weapon.x + Math.cos(rot) * 28 * facing;
        const spawnY = p.weapon.y + Math.sin(rot) * 28;
        const angle = rot + (facing === 1 ? 0 : Math.PI);

        const endX = spawnX + Math.cos(angle) * 700;
        const endY = spawnY + Math.sin(angle) * 700;

        this.laserSightGfx.lineStyle(1.5, p.id === 1 ? 0x00ffff : 0xff0055, 0.45);
        this.laserSightGfx.lineBetween(spawnX, spawnY, endX, endY);
      }
    });
  }

  isPlayerGrounded(player) {
    if (!this.platform || !this.platform.body) return false;
    const topOfPlatform = this.platform.y - (this.platformHeight / 2);
    const distToTop = Math.abs((player.torso.y + 20) - topOfPlatform);
    const halfWidth = (this.platformWidth / 2) + 20;
    const withinPlatformX = player.torso.x > (this.platform.x - halfWidth) &&
                            player.torso.x < (this.platform.x + halfWidth);
    const lowVy = Math.abs(player.torso.body.velocity.y) < 4.0;

    return distToTop < 34 && withinPlatformX && lowVy;
  }

  updatePlayerPhysics(player, jumpPressed, now = this.time.now) {
    if (!player.isAlive) return;

    const grounded = this.isPlayerGrounded(player);
    player.isGrounded = grounded;

    if (grounded) {
      player.lastGroundedTime = now;
    }

    if (jumpPressed && !player.wasJumpPressed) {
      player.lastJumpInputTime = now;
    }

    const canCoyoteJump = (now - player.lastGroundedTime < 120);
    const hasBufferedJump = (now - player.lastJumpInputTime < 120);

    if (hasBufferedJump && canCoyoteJump) {
      player.lastJumpInputTime = 0;
      player.lastGroundedTime = 0;

      soundFx.playJump();

      const angleRad = player.torso.rotation;
      const baseJumpY = player.isAgile ? -15.0 : -12.5;
      const jumpSpeedX = Math.sin(angleRad) * 7 + (player.facing * 3.5);
      player.torso.setVelocity(jumpSpeedX, baseJumpY);

      this.tweens.add({
        targets: [player.torso, player.head],
        scaleX: 0.88,
        scaleY: 1.15,
        duration: 100,
        yoyo: true,
        ease: 'Back.out'
      });
    }

    if (jumpPressed) {
      const targetLeanSpeed = -0.07 * player.facing;
      player.torso.setAngularVelocity(targetLeanSpeed);
    } else {
      const currentAngleDeg = player.torso.angle;
      const stabilizeTorque = -currentAngleDeg * 0.005;
      player.torso.setAngularVelocity(stabilizeTorque);
    }

    const maxTiltDeg = 75;
    if (player.torso.angle > maxTiltDeg) {
      player.torso.setAngle(maxTiltDeg);
      if (player.torso.body.angularVelocity > 0) player.torso.setAngularVelocity(0);
    } else if (player.torso.angle < -maxTiltDeg) {
      player.torso.setAngle(-maxTiltDeg);
      if (player.torso.body.angularVelocity < 0) player.torso.setAngularVelocity(0);
    }

    player.wasJumpPressed = jumpPressed;
  }

  updateCpuAI(cpu, time) {
    if (!cpu.isAlive || this.isRoundOver || this.isCountingDown) return false;

    const p1 = this.player1;
    if (!p1 || !p1.torso) return false;

    const distToP1 = p1.torso.x - cpu.torso.x;
    const absDistX = Math.abs(distToP1);

    // Platform edge safety boundaries
    const halfWidth = (this.platformWidth || 750) / 2;
    const platformLeft = this.platform.x - halfWidth;
    const platformRight = this.platform.x + halfWidth;
    const edgeMargin = 165; // safe zone buffer from abyss
    const isNearLeftEdge = cpu.torso.x < platformLeft + edgeMargin;
    const isNearRightEdge = cpu.torso.x > platformRight - edgeMargin;

    // 1. Facing Orientation: Always face towards the danger-free inward direction or P1
    if (isNearRightEdge) {
      cpu.facing = -1; // face left toward safety
    } else if (isNearLeftEdge) {
      cpu.facing = 1; // face right toward safety
    } else {
      cpu.facing = distToP1 > 0 ? 1 : -1;
    }

    // 2. CRITICAL SAFETY RECOVERY: If near either edge, immediately recover toward center!
    if (isNearRightEdge) {
      // Near right ledge -> must move left!
      // If tilted backwards (angle > 0), pull forward to upright!
      if (cpu.torso.angle > 0) {
        cpu.torso.setAngularVelocity(-0.06);
      }
      // When upright or leaning forward, jump inward (to the left)
      if (cpu.isGrounded && time > (cpu.aiNextJumpTime || 0)) {
        cpu.aiNextJumpTime = time + 360;
        cpu.aiJumpUntil = time + 70; // short tap jump forward
        cpu.torso.setVelocity(-5.2, -11.8);
        soundFx.playJump();
      }
      return false; // don't hold jump (avoid leaning back)
    }

    if (isNearLeftEdge) {
      // Near left ledge -> must move right!
      // If tilted backwards (angle < 0), pull forward to upright!
      if (cpu.torso.angle < 0) {
        cpu.torso.setAngularVelocity(0.06);
      }
      if (cpu.isGrounded && time > (cpu.aiNextJumpTime || 0)) {
        cpu.aiNextJumpTime = time + 360;
        cpu.aiJumpUntil = time + 70;
        cpu.torso.setVelocity(5.2, -11.8);
        soundFx.playJump();
      }
      return false;
    }

    // 3. TACTICAL AIMING: Calculate weapon line towards Player 1
    const rot = cpu.torso.rotation;
    const weaponAngle = rot + (cpu.facing === 1 ? 0 : Math.PI);
    const angleToP1 = Math.atan2(p1.torso.y - cpu.weapon.y, p1.torso.x - cpu.weapon.x);
    const angleError = Phaser.Math.Angle.Wrap(angleToP1 - weaponAngle);

    // AI Tuning by Tower Floor or standard mode
    let shootTolerance = 0.28; // ~16 degrees
    let shootDelayMin = 300;
    let shootDelayMax = 700;
    let forwardHopChance = 0.025;

    if (this.isTowerMode) {
      if (this.towerFloor === 1) { // Noob
        shootTolerance = 0.38;
        shootDelayMin = 600;
        shootDelayMax = 1100;
        forwardHopChance = 0.015;
      } else if (this.towerFloor === 2) { // Capybara
        shootTolerance = 0.30;
        shootDelayMin = 450;
        shootDelayMax = 800;
        forwardHopChance = 0.020;
      } else if (this.towerFloor === 3) { // Banana Cat
        shootTolerance = 0.25;
        shootDelayMin = 250;
        shootDelayMax = 550;
        forwardHopChance = 0.045;
      } else if (this.towerFloor === 4) { // Doge
        shootTolerance = 0.22;
        shootDelayMin = 180;
        shootDelayMax = 400;
        forwardHopChance = 0.035;
      } else if (this.towerFloor === 5) { // Sigma Golden
        shootTolerance = 0.16;
        shootDelayMin = 140;
        shootDelayMax = 300;
        forwardHopChance = 0.040;
      }
    }

    // Aim adjustment:
    // If P1 is higher than CPU, lean back slightly to raise aim
    let wantsToLean = false;
    const p1IsHigher = p1.torso.y < cpu.torso.y - 25;
    if (p1IsHigher && Math.abs(cpu.torso.angle) < 42) {
      wantsToLean = true;
    }

    // 4. TACTICAL SHOOTING: Only shoot when aim is reasonably on target
    if (time > (cpu.aiNextShootTime || 0)) {
      if (Math.abs(angleError) < shootTolerance) {
        this.handlePlayerShoot(cpu);
        cpu.aiNextShootTime = time + Phaser.Math.Between(shootDelayMin, shootDelayMax);
      }
    }

    // 5. TACTICAL REPOSITIONING / JUMPING:
    // If P1 is far away (> 420px) and CPU is safely grounded, do a short hop forward!
    if (cpu.isGrounded && absDistX > 420 && Math.random() < forwardHopChance && time > (cpu.aiNextJumpTime || 0)) {
      cpu.aiNextJumpTime = time + 600;
      cpu.aiJumpUntil = time + 60; // short tap
      return true;
    }

    // If currently in jump duration:
    if (time < (cpu.aiJumpUntil || 0)) {
      return true;
    }

    // If wants to lean back to aim at airborne P1:
    if (wantsToLean && time > (cpu.aiNextActionTime || 0)) {
      cpu.aiJumpUntil = time + 130;
      cpu.aiNextActionTime = time + 550;
      return true;
    }

    return false;
  }

  syncPlayerRagdoll(player) {
    const { torso, head, arm, weapon, legL, legR, facing, crownText } = player;

    const tx = torso.x;
    const ty = torso.y;
    const rot = torso.rotation;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    head.setPosition(tx + sin * 28, ty - cos * 28);
    head.setRotation(rot);

    if (crownText) {
      crownText.setPosition(head.x, head.y - 28);
    }

    const armX = facing * 6;
    const armY = -6;
    arm.setPosition(tx + (armX * cos - armY * sin), ty + (armX * sin + armY * cos));
    arm.setRotation(rot + (facing === 1 ? 0.2 : -0.2));
    arm.setScale(facing, 1);

    const recoil = player.weaponRecoilOffset || 0;
    const weapX = facing * (18 + recoil);
    const weapY = -4;
    weapon.setPosition(tx + (weapX * cos - weapY * sin), ty + (weapX * sin + weapY * cos));
    weapon.setRotation(rot);
    weapon.setScale(facing, 1);

    const isMoving = Math.abs(player.torso.body.velocity.x) > 0.5;
    const legSwing = isMoving ? Math.sin(this.time.now * 0.015) * 0.25 : 0;

    const legLX = -6;
    const legLY = 20;
    legL.setPosition(tx + (legLX * cos - legLY * sin), ty + (legLX * sin + legLY * cos));
    legL.setRotation(rot + legSwing);

    const legRX = 6;
    const legRY = 20;
    legR.setPosition(tx + (legRX * cos - legRY * sin), ty + (legRX * sin + legRY * cos));
    legR.setRotation(rot - legSwing);
  }

  handlePlayerShoot(player) {
    if (!player.isAlive || this.isRoundOver || this.isCountingDown) return;

    const now = this.time.now;
    const minCooldown = player.isRapid ? 220 : 420;
    if (now - player.lastShootTime < minCooldown) return;
    player.lastShootTime = now;

    // Mission Progress Hook: Increment shots fired for Player 1
    if (player.id === 1) {
      crazyGamesSDK.incrementMissionProgress('fire_shots', 1);
    }

    const rot = player.torso.rotation;
    const facing = player.facing;
    const spawnX = player.weapon.x + Math.cos(rot) * 26 * facing;
    const spawnY = player.weapon.y + Math.sin(rot) * 26;
    const baseAngle = rot + (facing === 1 ? 0 : Math.PI);

    // Muzzle Flash
    const muzzle = this.add.image(spawnX, spawnY, 'muzzle_flash').setScale(1.2).setDepth(45);
    this.time.delayedCall(50, () => muzzle.destroy());

    // Weapon Recoil Kickback
    player.weaponRecoilOffset = -9;
    this.tweens.add({
      targets: player,
      weaponRecoilOffset: 0,
      duration: 120,
      ease: 'Back.out'
    });

    const wType = player.currentWeaponType;

    if (wType === 'shotgun') {
      soundFx.playShotgun();
      this.addTrauma(0.18);

      // Shotgun recoil impulse
      const recoilForce = player.isTank ? 0.001 : 0.003;
      player.torso.applyForce({ x: -Math.cos(baseAngle) * recoilForce * 22, y: -0.018 });

      // Fire 3 spreading pellets in arc
      const spreads = [-0.16, 0, 0.16];
      spreads.forEach(spread => {
        const pAngle = baseAngle + spread;
        const pSpeed = 22;
        const pvx = Math.cos(pAngle) * pSpeed;
        const pvy = Math.sin(pAngle) * pSpeed;

        const pellet = this.matter.add.image(spawnX, spawnY, 'bullet_pellet', null, {
          frictionAir: 0.015,
          restitution: 0.3,
          density: 0.01
        });
        pellet.setVelocity(pvx, pvy);
        pellet.setRotation(pAngle);
        pellet.shooterId = player.id;
        pellet.weaponType = 'shotgun';
        pellet.knockback = 0.06;
        this.projectiles.push(pellet);

        this.time.delayedCall(3000, () => this.destroyBullet(pellet));
      });
      return;
    }

    if (wType === 'sniper') {
      soundFx.playSniper();
      this.addTrauma(0.32);

      // Ultra high speed sniper bullet
      const sSpeed = 38;
      const svx = Math.cos(baseAngle) * sSpeed;
      const svy = Math.sin(baseAngle) * sSpeed;

      // Heavy recoil pushback
      const sRecoil = player.isTank ? 0.0014 : 0.0035;
      player.torso.applyForce({ x: -Math.cos(baseAngle) * sRecoil * 32, y: -0.026 });

      const sniperBullet = this.matter.add.image(spawnX, spawnY, 'bullet_sniper', null, {
        frictionAir: 0,
        restitution: 0.1,
        density: 0.02
      });
      sniperBullet.setVelocity(svx, svy);
      sniperBullet.setRotation(baseAngle);
      sniperBullet.shooterId = player.id;
      sniperBullet.weaponType = 'sniper';
      sniperBullet.knockback = 0.18;
      this.projectiles.push(sniperBullet);

      this.time.delayedCall(3000, () => this.destroyBullet(sniperBullet));
      return;
    }

    // Standard Projectile specs
    let speed = 22;
    let knockback = 0.06;
    let bulletKey = 'bullet_pistol';

    if (wType === 'bazooka') {
      bulletKey = 'bullet_rocket';
      knockback = 0.16;
      speed = 19;
      soundFx.playShootRocket();
      this.addTrauma(0.15);
    } else if (wType === 'fish') {
      bulletKey = 'bullet_fish';
      knockback = 0.09;
      soundFx.playFishSlap();
      this.addTrauma(0.08);
    } else if (wType === 'laser') {
      bulletKey = 'bullet_laser';
      knockback = 0.08;
      speed = 28;
      soundFx.playShootLaser();
      this.addTrauma(0.09);
    } else if (wType === 'grenade') {
      bulletKey = 'bullet_grenade';
      knockback = 0.12;
      speed = 19;
      soundFx.playShootPistol();
      this.addTrauma(0.12);
    } else {
      soundFx.playShootPistol();
      this.addTrauma(0.06);
    }

    const vx = Math.cos(baseAngle) * speed;
    const vy = Math.sin(baseAngle) * speed;

    // Recoil Pushback
    const recoilScale = player.isTank ? 0.0006 : 0.0014;
    player.torso.applyForce({ x: -vx * recoilScale, y: -0.012 });

    const bullet = this.matter.add.image(spawnX, spawnY, bulletKey, null, {
      frictionAir: wType === 'laser' ? 0 : 0.01,
      restitution: wType === 'grenade' ? 0.8 : 0.2,
      density: 0.01
    });

    bullet.setVelocity(vx, vy);
    bullet.setRotation(baseAngle);
    bullet.shooterId = player.id;
    bullet.weaponType = wType;
    bullet.knockback = knockback;

    this.projectiles.push(bullet);

    this.time.delayedCall(3500, () => {
      this.destroyBullet(bullet);
    });
  }

  handleCollisions(event) {
    event.pairs.forEach(pair => {
      const { bodyA, bodyB } = pair;

      this.projectiles.forEach(bullet => {
        if (!bullet || !bullet.body) return;

        const isHitA = bodyA === bullet.body;
        const isHitB = bodyB === bullet.body;

        if (isHitA || isHitB) {
          const targetBody = isHitA ? bodyB : bodyA;

          if (targetBody === this.player1.torso.body && bullet.shooterId !== 1) {
            this.applyBulletHit(this.player1, bullet);
          } else if (targetBody === this.player2.torso.body && bullet.shooterId !== 2) {
            this.applyBulletHit(this.player2, bullet);
          } else if (targetBody === this.platform.body) {
            if (bullet.weaponType !== 'grenade') {
              this.spawnImpactParticles(bullet.x, bullet.y);
              this.destroyBullet(bullet);
            }
          }
        }
      });
    });
  }

  applyBulletHit(targetPlayer, bullet) {
    // 1. Hit-Stop Freeze Frame
    const freezeMs = (bullet.weaponType === 'bazooka' || bullet.weaponType === 'grenade' || bullet.weaponType === 'sniper') ? 70 : 35;
    this.matter.world.pause();
    this.time.timeScale = 0.05;
    setTimeout(() => {
      if (this.matter?.world && !this.isPaused && !this.isKOCamActive) {
        this.matter.world.resume();
        this.time.timeScale = 1.0;
      }
    }, freezeMs);

    // 2. White Damage Flash
    const parts = [targetPlayer.head, targetPlayer.torso, targetPlayer.arm, targetPlayer.legL, targetPlayer.legR];
    parts.forEach(p => p.setTintFill(0xffffff));
    this.time.delayedCall(70, () => parts.forEach(p => p.clearTint()));

    // 2b. Dynamic Shocked Meme Facial Expression
    const shockKey = `head_${targetPlayer.skinKey}_shock`;
    if (this.textures.exists(shockKey)) {
      targetPlayer.head.setTexture(shockKey);
      this.time.delayedCall(750, () => {
        if (targetPlayer.isAlive) {
          targetPlayer.head.setTexture(`head_${targetPlayer.skinKey}`);
        }
      });
    }

    // 3. Comic Floating Text Popup
    this.spawnComicPopup(bullet.x, bullet.y - 20, bullet.weaponType);

    // 4. Dedicated Audio & Trauma Shake
    if (bullet.weaponType === 'bazooka' || bullet.weaponType === 'grenade') {
      soundFx.playExplosion();
      this.addTrauma(0.55);
    } else if (bullet.weaponType === 'sniper') {
      soundFx.playSniper();
      this.addTrauma(0.65);
    } else if (bullet.weaponType === 'shotgun') {
      soundFx.playHitBody();
      this.addTrauma(0.35);
    } else if (bullet.weaponType === 'fish') {
      soundFx.playFishSlap();
      this.addTrauma(0.25);
    } else if (bullet.weaponType === 'laser') {
      soundFx.playHitLaser();
      this.addTrauma(0.22);
    } else {
      soundFx.playHitBody();
      this.addTrauma(0.20);
    }

    // 5. Apply Knockback Impulse
    const bvel = bullet.body.velocity;
    const forceX = (bvel.x > 0 ? 1 : -1) * bullet.knockback;
    const forceY = -bullet.knockback * 0.8;
    targetPlayer.torso.applyForce({ x: forceX, y: forceY });
    targetPlayer.torso.setAngularVelocity(forceX * 0.4);

    this.spawnImpactParticles(bullet.x, bullet.y);
    this.destroyBullet(bullet);
  }

  spawnComicPopup(x, y, weaponType) {
    const textMap = {
      bazooka: '💥 BOOM!',
      fish: '🐟 SLAP!',
      laser: '⚡ ZAP!',
      grenade: '💣 BANG!',
      shotgun: '💥 BLAM!',
      sniper: '🎯 HEADSHOT!',
      pistol: 'POW!'
    };
    const colorMap = {
      bazooka: '#e74c3c',
      fish: '#3498db',
      laser: '#00ffff',
      grenade: '#e67e22',
      shotgun: '#ff5722',
      sniper: '#00d2d3',
      pistol: '#f1c40f'
    };

    const str = textMap[weaponType] || 'HIT!';
    const popup = this.add.text(x, y, str, {
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontSize: '22px',
      color: colorMap[weaponType] || '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setScale(0.3).setDepth(150);

    this.tweens.add({
      targets: popup,
      y: y - 45,
      scale: 1.2,
      duration: 180,
      ease: 'Back.out',
      onComplete: () => {
        this.tweens.add({
          targets: popup,
          alpha: 0,
          y: y - 70,
          scale: 0.8,
          duration: 250,
          onComplete: () => popup.destroy()
        });
      }
    });
  }

  spawnImpactParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const spark = this.add.image(x, y, 'particle_spark').setDepth(45);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(30, 80);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 300,
        onComplete: () => spark.destroy()
      });
    }
  }

  destroyBullet(bullet) {
    if (!bullet) return;
    const idx = this.projectiles.indexOf(bullet);
    if (idx !== -1) {
      this.projectiles.splice(idx, 1);
    }
    if (bullet.body) {
      this.matter.world.remove(bullet);
    }
    bullet.destroy();
  }

  endRound(winnerId) {
    if (this.isRoundOver) return;
    this.isRoundOver = true;

    soundFx.playFallTroll();

    if (winnerId === 1) {
      this.scoreP1++;
      this.bannerText.setText('PLAYER 1 SCORED! 🎯').setAlpha(1);

      // Mission Progress: Win round & survive sudden death
      crazyGamesSDK.incrementMissionProgress('win_rounds', 1);
      if (this.suddenDeathActive) {
        crazyGamesSDK.incrementMissionProgress('survive_lava', 1);
      }
    } else if (winnerId === 2) {
      this.scoreP2++;
      const p2Label = this.isTowerMode ? (this.towerBot?.name || 'TOWER BOSS') : (this.gameMode === '1P' ? 'CPU BOT' : 'PLAYER 2');
      this.bannerText.setText(`${p2Label} SCORED! 🎯`).setAlpha(1);
    } else {
      this.bannerText.setText('DRAW ROUND! 💥').setAlpha(1);
    }

    const modeTitle = this.isTowerMode ? `FLOOR ${this.towerFloor} GAUNTLET` : `FIRST TO ${this.targetScore}`;
    this.scoreText.setText(`P1: ${this.scoreP1}   [${modeTitle}]   P2: ${this.scoreP2}`);

    // Scoreboard Bounce Tween Juice
    this.tweens.add({
      targets: this.scoreContainer,
      scale: 1.35,
      duration: 160,
      yoyo: true,
      ease: 'Back.out'
    });

    const isMatchDecided = this.scoreP1 >= this.targetScore || this.scoreP2 >= this.targetScore;

    if (isMatchDecided) {
      // Trigger K.O. Finish Cam!
      this.triggerKOCam(winnerId === 1 ? this.player2 : this.player1);
    } else {
      this.currentRound++;
      this.time.delayedCall(1800, () => this.startRound());
    }
  }

  triggerKOCam(loser) {
    this.isKOCamActive = true;

    // Slow-mo cinematic time scale
    this.time.timeScale = 0.25;

    // Smooth camera zoom onto falling loser
    const targetZoom = 1.18;
    this.cameras.main.zoomTo(targetZoom, 600, 'Cubic.easeOut');

    if (loser && loser.torso) {
      this.cameras.main.pan(loser.torso.x, Math.min(this.scale.height + 40, loser.torso.y), 600, 'Cubic.easeOut');
    }

    // Slam K.O.! banner
    this.koBannerText.setAlpha(1).setScale(0.3);
    this.tweens.add({
      targets: this.koBannerText,
      scale: 1.25,
      duration: 250,
      ease: 'Back.out'
    });

    soundFx.playKO();
    this.addTrauma(0.8);

    // End match after slow-mo window (using real-time setTimeout)
    setTimeout(() => {
      if (this.sys && this.sys.isActive()) {
        this.time.timeScale = 1.0;
        this.cameras.main.zoomTo(1.0, 300);
        this.cameras.main.pan(this.scale.width / 2, this.scale.height / 2, 300);
        this.koBannerText.setAlpha(0);
        this.isKOCamActive = false;
        this.endMatch();
      }
    }, 1200);
  }

  endMatch() {
    this.isMatchOver = true;
    crazyGamesSDK.gameplayStop();

    const { width, height } = this.scale;
    const isP1Winner = this.scoreP1 >= this.targetScore;
    const winnerName = isP1Winner 
      ? 'PLAYER 1' 
      : (this.isTowerMode ? (this.towerBot?.name || 'TOWER BOSS') : (this.gameMode === '1P' ? 'CPU BOT' : 'PLAYER 2'));

    // Trigger Midgame Video Ad via CrazyGames SDK (3-min cooldown strictly enforced)
    crazyGamesSDK.requestMidgameAd();

    // Reward Calculation
    let earnedCoins = 50;
    if (this.isTowerMode) {
      earnedCoins = isP1Winner ? this.towerReward : 25;
      if (isP1Winner) {
        crazyGamesSDK.happytime();
        const currentUnlocked = crazyGamesSDK.loadData('tower_unlocked_floor', 1);
        if (this.towerFloor >= currentUnlocked && this.towerFloor < 5) {
          crazyGamesSDK.saveData('tower_unlocked_floor', this.towerFloor + 1);
        }
        if (this.towerFloor === 5) {
          crazyGamesSDK.saveData('tower_cleared', true);
        }
        soundFx.playStreak();
      }
    } else if (this.gameMode === '1P') {
      if (isP1Winner) {
        crazyGamesSDK.happytime();
        const streak = (crazyGamesSDK.loadData('win_streak', 0) || 0) + 1;
        crazyGamesSDK.saveData('win_streak', streak);
        earnedCoins = 50 + streak * 10;
        soundFx.playStreak();
      } else {
        crazyGamesSDK.saveData('win_streak', 0);
        earnedCoins = 20;
      }
    } else {
      if (isP1Winner) {
        crazyGamesSDK.happytime();
      }
      earnedCoins = isP1Winner ? 50 : 25;
    }

    let totalCoins = crazyGamesSDK.loadData('coins', 150) + earnedCoins;
    crazyGamesSDK.saveData('coins', totalCoins);

    // Spawn Confetti
    for (let i = 0; i < 45; i++) {
      const confetti = this.add.image(
        Phaser.Math.Between(width * 0.2, width * 0.8),
        Phaser.Math.Between(height * 0.2, height * 0.8),
        'particle_confetti'
      ).setDepth(250);
      confetti.setTint(Phaser.Utils.Array.GetRandom([0xf1c40f, 0xe74c3c, 0x3498db, 0x2ecc71, 0x9b59b6]));
      this.tweens.add({
        targets: confetti,
        y: confetti.y + Phaser.Math.Between(80, 220),
        angle: Phaser.Math.Between(0, 360),
        alpha: 0,
        duration: 1500,
        onComplete: () => confetti.destroy()
      });
    }

    // Modal Container
    const modal = this.add.container(width / 2, height / 2).setDepth(200);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(-width / 2, -height / 2, width, height);

    const dialogBg = this.add.graphics();
    dialogBg.fillStyle(0x1a252f, 0.96);
    dialogBg.fillRoundedRect(-300, -230, 600, 460, 24);
    dialogBg.lineStyle(4, isP1Winner || this.gameMode === '2P' ? 0xf1c40f : 0xe74c3c, 1);
    dialogBg.strokeRoundedRect(-300, -230, 600, 460, 24);

    let modalTitle = (this.gameMode === '2P' || isP1Winner) ? '👑 VICTORY! 👑' : '💀 DEFEAT! 💀';
    if (this.isTowerMode && isP1Winner && this.towerFloor === 5) {
      modalTitle = '👑 TOWER CONQUERED! 👑';
    }

    const crownText = this.add.text(0, -165, modalTitle, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '44px',
      color: (this.gameMode === '2P' || isP1Winner) ? '#f1c40f' : '#e74c3c',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5);

    const winLabel = this.add.text(0, -105, `${winnerName} WINS!`, {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '26px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Rolling Coin Counter Animation
    const coinLabel = this.add.text(0, -50, '+0 COINS EARNED 🟡', {
      fontFamily: "'Lilita One', 'Fredoka', 'Arial Black', sans-serif",
      fontSize: '24px',
      color: '#f39c12'
    }).setOrigin(0.5);

    const coinCounter = { val: 0 };
    this.tweens.add({
      targets: coinCounter,
      val: earnedCoins,
      duration: 1100,
      ease: 'Power1',
      onUpdate: () => {
        const current = Math.floor(coinCounter.val);
        coinLabel.setText(`+${current} COINS EARNED 🟡`);
        if (current % 15 === 0 && current > 0) {
          soundFx.playCoin();
        }
      },
      onComplete: () => {
        coinLabel.setText(`+${earnedCoins} COINS EARNED 🟡`);
        soundFx.playScore();
      }
    });

    // Rewarded Ad x2 Coins Button (Kenney Yellow 3D Button)
    const doubleBtn = this.createKenneyButton(0, 22, '🎁 WATCH AD FOR x2 COINS (+50 🟡)', 'yellow', 360, 48, (btn) => {
      btn.label.setText('⏳ LOADING AD...');
      crazyGamesSDK.requestRewardedAd({
        reward: () => {
          totalCoins += 50;
          crazyGamesSDK.saveData('coins', totalCoins);
          coinLabel.setText(`+${earnedCoins + 50} COINS EARNED! (x2 CLAIMED)`);
          soundFx.playCoin();
          btn.destroy();
        },
        error: () => {
          btn.label.setText('🎁 AD UNAVAILABLE');
        }
      });
    });

    // Navigation Buttons with Midgame Ad Integration
    let btn1Text = '🔄 REMATCH';
    let btn1Action = () => {
      crazyGamesSDK.requestMidgameAd({
        afterAd: () => {
          this.scene.restart({
            mode: this.gameMode,
            towerMode: this.isTowerMode,
            towerFloor: this.towerFloor,
            towerBot: this.towerBot,
            targetScore: this.targetScore
          });
        }
      });
    };

    if (this.isTowerMode && isP1Winner && this.towerFloor < 5) {
      btn1Text = 'NEXT FLOOR ⚔️';
      btn1Action = () => {
        crazyGamesSDK.requestMidgameAd({
          afterAd: () => {
            this.scene.restart({
              mode: '1P',
              towerMode: true,
              towerFloor: this.towerFloor + 1,
              targetScore: 3
            });
          }
        });
      };
    }

    const nextBtn = this.createKenneyButton(-110, 115, btn1Text, 'green', 200, 48, () => {
      btn1Action();
    });

    const exitBtnText = this.isTowerMode ? '🏯 TOWER' : '🏠 MENU';
    const exitTarget = this.isTowerMode ? 'MemeTowerScene' : 'MenuScene';

    const menuBtn = this.createKenneyButton(110, 115, exitBtnText, 'grey', 200, 48, () => {
      crazyGamesSDK.requestMidgameAd({
        afterAd: () => {
          this.scene.start(exitTarget);
        }
      });
    });

    modal.add([overlay, dialogBg, crownText, winLabel, coinLabel, doubleBtn, nextBtn, menuBtn]);
    modal.setScale(0.7);
    this.tweens.add({
      targets: modal,
      scale: 1.0,
      duration: 300,
      ease: 'Back.out'
    });
  }
}
