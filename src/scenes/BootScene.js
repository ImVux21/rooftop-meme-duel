import Phaser from 'phaser';
import { crazyGamesSDK } from '../utils/CrazyGamesSDK.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 1. Load Kenney UI Pack Assets (CC0)
    this.load.image('btn_green', 'assets/ui/btn_green.png');
    this.load.image('btn_green_pressed', 'assets/ui/btn_green_pressed.png');
    this.load.image('btn_red', 'assets/ui/btn_red.png');
    this.load.image('btn_red_pressed', 'assets/ui/btn_red_pressed.png');
    this.load.image('btn_blue', 'assets/ui/btn_blue.png');
    this.load.image('btn_blue_pressed', 'assets/ui/btn_blue_pressed.png');
    this.load.image('btn_yellow', 'assets/ui/btn_yellow.png');
    this.load.image('btn_yellow_pressed', 'assets/ui/btn_yellow_pressed.png');
    this.load.image('btn_grey', 'assets/ui/btn_grey.png');
    this.load.image('btn_grey_pressed', 'assets/ui/btn_grey_pressed.png');

    this.load.image('btn_round_blue', 'assets/ui/btn_round_blue.png');
    this.load.image('btn_round_blue_pressed', 'assets/ui/btn_round_blue_pressed.png');
    this.load.image('btn_round_grey', 'assets/ui/btn_round_grey.png');
    this.load.image('btn_round_grey_pressed', 'assets/ui/btn_round_grey_pressed.png');

    this.load.image('panel_grey', 'assets/ui/panel_grey.png');
    this.load.image('panel_grey_bolts', 'assets/ui/panel_grey_bolts.png');

    this.load.image('icon_audio_on', 'assets/ui/icon_audio_on.png');
    this.load.image('icon_audio_off', 'assets/ui/icon_audio_off.png');
    this.load.image('icon_help', 'assets/ui/icon_help.png');
    this.load.image('icon_fullscreen', 'assets/ui/icon_fullscreen.png');
    this.load.image('icon_cart', 'assets/ui/icon_cart.png');
    this.load.image('icon_cross', 'assets/ui/icon_cross.png');
    this.load.image('icon_checkmark', 'assets/ui/icon_checkmark.png');

    // 2. Load Kenney Keyboard Input Prompts (CC0)
    this.load.image('key_w', 'assets/input/key_w.png');
    this.load.image('key_e', 'assets/input/key_e.png');
    this.load.image('key_space', 'assets/input/key_space.png');
    this.load.image('key_up', 'assets/input/key_up.png');
    this.load.image('key_enter', 'assets/input/key_enter.png');
    this.load.image('key_i', 'assets/input/key_i.png');
    this.load.image('key_o', 'assets/input/key_o.png');

    // 3. Load Kenney Toon Characters (CC0)
    this.load.image('head_default', 'assets/characters/male_head.png');
    this.load.image('head_default_shock', 'assets/characters/male_head_shock.png');
    this.load.image('torso_default', 'assets/characters/male_body.png');
    this.load.image('arm_default', 'assets/characters/male_arm.png');
    this.load.image('leg_default', 'assets/characters/male_leg.png');

    this.load.image('head_zombie', 'assets/characters/zombie_head.png');
    this.load.image('head_zombie_shock', 'assets/characters/zombie_head_shock.png');
    this.load.image('torso_zombie', 'assets/characters/zombie_body.png');
    this.load.image('arm_zombie', 'assets/characters/zombie_arm.png');
    this.load.image('leg_zombie', 'assets/characters/zombie_leg.png');

    this.load.image('head_noob', 'assets/characters/robot_head.png');
    this.load.image('head_noob_shock', 'assets/characters/robot_head_shock.png');
    this.load.image('torso_noob', 'assets/characters/robot_body.png');
    this.load.image('arm_noob', 'assets/characters/robot_arm.png');
    this.load.image('leg_noob', 'assets/characters/robot_leg.png');

    // Generate procedural game textures (weapons, platforms, meme heads)
    this.createProceduralTextures();
  }

  create() {
    // Load saved coins & unlocked skins
    if (crazyGamesSDK.loadData('coins') === null) {
      crazyGamesSDK.saveData('coins', 150); // Free starter coins
      crazyGamesSDK.saveData('unlocked_skins', ['default']);
      crazyGamesSDK.saveData('equipped_skin_p1', 'default');
      crazyGamesSDK.saveData('equipped_skin_p2', 'capybara');
      crazyGamesSDK.saveData('win_streak', 0);
    }

    // Daily Login Reward Check (D1 Retention Boost)
    const today = new Date().toISOString().slice(0, 10);
    const lastLogin = crazyGamesSDK.loadData('last_login_date', '');
    if (lastLogin !== today) {
      const streakDays = (crazyGamesSDK.loadData('login_streak_days', 0) % 7) + 1;
      const dailyBonusTiers = [100, 150, 200, 250, 300, 400, 500];
      const bonusCoins = dailyBonusTiers[streakDays - 1] || 100;

      const currentCoins = crazyGamesSDK.loadData('coins', 150);
      crazyGamesSDK.saveData('coins', currentCoins + bonusCoins);
      crazyGamesSDK.saveData('last_login_date', today);
      crazyGamesSDK.saveData('login_streak_days', streakDays);
      crazyGamesSDK.saveData('daily_bonus_pending', {
        day: streakDays,
        coins: bonusCoins
      });
    }

    // Daily Missions System Initialization
    const missionsDate = crazyGamesSDK.loadData('daily_missions_date', null);
    if (missionsDate !== today || crazyGamesSDK.loadData('daily_missions') === null) {
      const activeMissions = [
        { id: 'win_rounds', title: 'Win 3 Rounds', target: 3, progress: 0, reward: 80, claimed: false },
        { id: 'fire_shots', title: 'Fire 25 Shots', target: 25, progress: 0, reward: 60, claimed: false },
        { id: 'survive_lava', title: 'Survive Sudden Death Once', target: 1, progress: 0, reward: 100, claimed: false }
      ];
      crazyGamesSDK.saveData('daily_missions_date', today);
      crazyGamesSDK.saveData('daily_missions', activeMissions);
    }

    crazyGamesSDK.loadingStop();
    this.scene.start('MenuScene');
  }

  createProceduralTextures() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Bullet texture
    gfx.clear();
    gfx.fillStyle(0xffdd33, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture('bullet_pistol', 12, 12);

    // 2. Rocket texture
    gfx.clear();
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillRoundedRect(0, 4, 24, 12, 4);
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillTriangle(24, 4, 32, 10, 24, 16);
    gfx.fillStyle(0x7f8c8d, 1);
    gfx.fillRect(0, 2, 6, 16);
    gfx.generateTexture('bullet_rocket', 32, 20);

    // 3. Fish texture (Meme Tuna)
    gfx.clear();
    gfx.fillStyle(0x3498db, 1);
    gfx.fillEllipse(18, 12, 16, 8);
    gfx.fillStyle(0x2980b9, 1);
    gfx.fillTriangle(0, 4, 8, 12, 0, 20);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(24, 10, 3);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(25, 10, 1.5);
    gfx.generateTexture('bullet_fish', 36, 24);

    // 4. Grenade texture
    gfx.clear();
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillCircle(12, 14, 10);
    gfx.fillStyle(0xf39c12, 1);
    gfx.fillRect(10, 2, 4, 6);
    gfx.generateTexture('bullet_grenade', 24, 24);

    // 5. Laser Beam texture
    gfx.clear();
    gfx.fillStyle(0x00ffff, 1);
    gfx.fillRoundedRect(0, 2, 30, 6, 3);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRoundedRect(4, 3, 22, 4, 2);
    gfx.generateTexture('bullet_laser', 30, 10);

    // Pellet Bullet (Shotgun lead pellet)
    gfx.clear();
    gfx.fillStyle(0x718093, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.fillStyle(0xdcdde1, 1);
    gfx.fillCircle(3, 3, 1.5);
    gfx.generateTexture('bullet_pellet', 8, 8);

    // Sniper High-Tech Long Tracer Bullet
    gfx.clear();
    gfx.fillStyle(0x00d2d3, 0.5);
    gfx.fillRect(0, 1, 10, 6);
    gfx.fillStyle(0x54a0ff, 1);
    gfx.fillRoundedRect(8, 1, 18, 6, 2);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillTriangle(24, 1, 32, 4, 24, 7);
    gfx.generateTexture('bullet_sniper', 32, 8);

    // 6. Particle Spark & Smoke
    gfx.clear();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(6, 6, 6);
    gfx.generateTexture('particle_smoke', 12, 12);

    gfx.clear();
    gfx.fillStyle(0xffaa00, 1);
    gfx.fillCircle(4, 4, 4);
    gfx.generateTexture('particle_spark', 8, 8);

    gfx.clear();
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillCircle(10, 10, 10);
    gfx.fillStyle(0xd68910, 1);
    gfx.fillCircle(10, 10, 7);
    gfx.generateTexture('coin_icon', 20, 20);

    // Muzzle Flash
    gfx.clear();
    gfx.fillStyle(0xfff3a0, 1);
    gfx.fillCircle(10, 10, 10);
    gfx.fillStyle(0xff8800, 0.8);
    gfx.fillTriangle(10, 0, 14, 20, 6, 20);
    gfx.fillTriangle(0, 10, 20, 14, 20, 6);
    gfx.generateTexture('muzzle_flash', 20, 20);

    // Confetti Particle
    gfx.clear();
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture('particle_confetti', 8, 8);

    // Glowing Orange/Yellow Ember Particle
    gfx.clear();
    gfx.fillStyle(0xd35400, 0.4);
    gfx.fillCircle(5, 5, 5);
    gfx.fillStyle(0xe67e22, 0.8);
    gfx.fillCircle(5, 5, 3.5);
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillCircle(5, 5, 2);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(5, 5, 1);
    gfx.generateTexture('particle_ember', 10, 10);

    // Soft Puff Dust Particle
    gfx.clear();
    gfx.fillStyle(0xdfe6e9, 0.35);
    gfx.fillCircle(8, 8, 8);
    gfx.fillStyle(0xb2bec3, 0.55);
    gfx.fillCircle(8, 8, 5);
    gfx.fillStyle(0xffffff, 0.7);
    gfx.fillCircle(7, 7, 2.5);
    gfx.generateTexture('particle_dust', 16, 16);

    // 7. Arena Platform Texture (Rooftop brick & concrete)
    gfx.clear();
    gfx.fillStyle(0x2c3e50, 1);
    gfx.fillRoundedRect(0, 0, 800, 120, 12);
    gfx.fillStyle(0x34495e, 1);
    gfx.fillRect(10, 10, 780, 20);
    // Warning yellow-black hazard stripes on top ledge
    for (let i = 20; i < 780; i += 40) {
      gfx.fillStyle(0xf39c12, 1);
      gfx.fillTriangle(i, 10, i + 20, 10, i + 10, 30);
    }
    gfx.generateTexture('platform_rooftop', 800, 120);

    // 8. Iceberg Platform
    gfx.clear();
    gfx.fillStyle(0xdfe6e9, 1);
    gfx.fillRoundedRect(0, 0, 750, 100, 16);
    gfx.fillStyle(0x74b9ff, 1);
    gfx.fillRoundedRect(8, 8, 734, 30, 10);
    gfx.generateTexture('platform_iceberg', 750, 100);

    // 9. Construction Beam
    gfx.clear();
    gfx.fillStyle(0xd35400, 1);
    gfx.fillRoundedRect(0, 0, 700, 45, 6);
    gfx.fillStyle(0xe67e22, 1);
    gfx.fillRect(10, 8, 680, 12);
    gfx.generateTexture('platform_beam', 700, 45);

    // Helipad Platform (800x120 rooftop platform with yellow 'H' and hazard borders)
    gfx.clear();
    gfx.fillStyle(0x2d3436, 1);
    gfx.fillRoundedRect(0, 0, 800, 120, 12);
    for (let x = 10; x < 790; x += 30) {
      gfx.fillStyle(0xf1c40f, 1);
      gfx.fillTriangle(x, 4, x + 15, 4, x + 8, 18);
      gfx.fillStyle(0x111111, 1);
      gfx.fillTriangle(x + 15, 4, x + 30, 4, x + 22, 18);
    }
    gfx.fillStyle(0x636e72, 1);
    gfx.fillRect(10, 20, 780, 3);
    gfx.lineStyle(4, 0xf1c40f, 1);
    gfx.strokeCircle(400, 70, 36);
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillRect(384, 48, 8, 44);
    gfx.fillRect(408, 48, 8, 44);
    gfx.fillRect(384, 66, 32, 8);
    gfx.generateTexture('platform_helipad', 800, 120);

    // Neon Bouncy Platform (750x90 neon bouncy platform with spring bumpers)
    gfx.clear();
    gfx.fillStyle(0x1e1b4b, 1);
    gfx.fillRoundedRect(0, 15, 750, 75, 12);
    gfx.fillStyle(0x06b6d4, 1);
    gfx.fillRoundedRect(40, 10, 670, 18, 6);
    gfx.fillStyle(0x22d3ee, 0.85);
    gfx.fillRect(60, 14, 630, 4);
    // Spring Bumpers
    gfx.fillStyle(0xf43f5e, 1);
    gfx.fillRoundedRect(6, 4, 28, 36, 8);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(20, 16, 5);
    gfx.fillStyle(0xf43f5e, 1);
    gfx.fillRoundedRect(716, 4, 28, 36, 8);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(730, 16, 5);
    // Underglow neon pulse stripe
    gfx.fillStyle(0xa855f7, 0.8);
    gfx.fillRect(60, 74, 630, 6);
    gfx.generateTexture('platform_bouncy', 750, 90);

    // 10. Lava texture for Sudden Death
    gfx.clear();
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillRect(0, 0, 1280, 100);
    gfx.fillStyle(0xf39c12, 0.8);
    gfx.fillCircle(300, 20, 30);
    gfx.fillCircle(700, 30, 40);
    gfx.fillCircle(1000, 15, 25);
    gfx.generateTexture('hazard_lava', 1280, 100);

    // 11. Weapons Graphics
    // Pistol
    gfx.clear();
    gfx.fillStyle(0x2c3e50, 1);
    gfx.fillRect(0, 4, 18, 8);
    gfx.fillRect(4, 10, 6, 12);
    gfx.fillStyle(0x7f8c8d, 1);
    gfx.fillRect(14, 2, 4, 4);
    gfx.generateTexture('weapon_pistol', 24, 24);

    // Bazooka
    gfx.clear();
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillRect(0, 6, 36, 12);
    gfx.fillStyle(0x1e8449, 1);
    gfx.fillRect(8, 16, 6, 10);
    gfx.fillStyle(0xd35400, 1);
    gfx.fillRect(32, 4, 8, 16);
    gfx.generateTexture('weapon_bazooka', 42, 28);

    // Fish
    gfx.clear();
    gfx.fillStyle(0x0984e3, 1);
    gfx.fillEllipse(16, 12, 14, 8);
    gfx.fillStyle(0x74b9ff, 1);
    gfx.fillTriangle(0, 4, 8, 12, 0, 20);
    gfx.generateTexture('weapon_fish', 32, 24);

    // Grenade Launcher
    gfx.clear();
    gfx.fillStyle(0x8e44ad, 1);
    gfx.fillRect(0, 6, 26, 12);
    gfx.fillStyle(0x2c3e50, 1);
    gfx.fillRect(6, 16, 6, 10);
    gfx.fillStyle(0xf39c12, 1);
    gfx.fillCircle(24, 12, 8);
    gfx.generateTexture('weapon_grenade', 34, 28);

    // Laser Blaster
    gfx.clear();
    gfx.fillStyle(0x00cec9, 1);
    gfx.fillRect(0, 6, 28, 10);
    gfx.fillStyle(0x0984e3, 1);
    gfx.fillRect(6, 14, 6, 10);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(20, 8, 8, 6);
    gfx.generateTexture('weapon_laser', 32, 26);

    // Double Barrel Shotgun
    gfx.clear();
    gfx.fillStyle(0x795548, 1);
    gfx.fillRoundedRect(0, 8, 14, 10, 3); // wooden stock
    gfx.fillRect(8, 14, 6, 8); // grip
    gfx.fillStyle(0x37474f, 1);
    gfx.fillRect(12, 6, 10, 10); // receiver
    gfx.fillStyle(0x455a64, 1);
    gfx.fillRect(22, 6, 18, 5); // top steel barrel
    gfx.fillStyle(0x263238, 1);
    gfx.fillRect(22, 11, 18, 5); // bottom steel barrel
    gfx.fillStyle(0x90a4ae, 1);
    gfx.fillRect(36, 4, 3, 2); // sight bead
    gfx.generateTexture('weapon_shotgun', 42, 24);

    // Sniper Long Rifle with Scope
    gfx.clear();
    gfx.fillStyle(0x2d3436, 1);
    gfx.fillRect(0, 10, 14, 8); // stock
    gfx.fillRect(8, 14, 5, 10); // grip
    gfx.fillStyle(0x636e72, 1);
    gfx.fillRect(14, 9, 14, 7); // receiver
    gfx.fillStyle(0x2d3436, 1);
    gfx.fillRect(28, 10, 18, 5); // long barrel
    gfx.fillStyle(0xd63031, 1);
    gfx.fillRect(44, 9, 3, 7); // muzzle brake
    // Elevated optical scope
    gfx.fillStyle(0x0984e3, 1);
    gfx.fillRect(12, 2, 18, 5); // scope tube
    gfx.fillStyle(0x00cec9, 1);
    gfx.fillRect(28, 1, 3, 7); // objective lens
    gfx.fillStyle(0x2d3436, 1);
    gfx.fillRect(15, 7, 3, 2); // mount 1
    gfx.fillRect(23, 7, 3, 2); // mount 2
    gfx.generateTexture('weapon_sniper', 48, 26);

    // Generate Authentic Cartoon Meme Ragdoll Skins
    this.createMemeSkinCapybara();
    this.createMemeSkinBananaCat();
    this.createMemeSkinDoge();
    this.createMemeSkinSigmaGolden();
  }

  createMemeSkinCapybara() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Chill Capybara Normal Head (48x48)
    gfx.clear();
    // Ears
    gfx.fillStyle(0x6d4c41, 1);
    gfx.fillCircle(12, 16, 5);
    gfx.fillCircle(36, 16, 5);
    // Head shape
    gfx.fillStyle(0x8d6e63, 1);
    gfx.lineStyle(2, 0x2d1e18, 1);
    gfx.fillRoundedRect(8, 14, 32, 30, 10);
    gfx.strokeRoundedRect(8, 14, 32, 30, 10);
    // Snout
    gfx.fillStyle(0x6d4c41, 1);
    gfx.fillRoundedRect(14, 24, 20, 18, 6);
    // Nostrils
    gfx.fillStyle(0x2d1e18, 1);
    gfx.fillCircle(19, 34, 2);
    gfx.fillCircle(29, 34, 2);
    // Sleepy chill closed eyes (- -)
    gfx.lineStyle(3, 0x2d1e18, 1);
    gfx.lineBetween(13, 22, 19, 22);
    gfx.lineBetween(29, 22, 35, 22);
    // Yuzu / Orange on head with leaf
    gfx.fillStyle(0xf39c12, 1);
    gfx.fillCircle(24, 10, 7);
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillTriangle(25, 4, 31, 2, 28, 7);
    gfx.generateTexture('head_capybara', 48, 48);

    // Shocked Head (Eyes popped open)
    gfx.clear();
    gfx.fillStyle(0x6d4c41, 1);
    gfx.fillCircle(12, 16, 5);
    gfx.fillCircle(36, 16, 5);
    gfx.fillStyle(0x8d6e63, 1);
    gfx.lineStyle(2, 0x2d1e18, 1);
    gfx.fillRoundedRect(8, 14, 32, 30, 10);
    gfx.strokeRoundedRect(8, 14, 32, 30, 10);
    gfx.fillStyle(0x6d4c41, 1);
    gfx.fillRoundedRect(14, 24, 20, 18, 6);
    // Wide open shocked eyes
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(15, 20, 5);
    gfx.fillCircle(33, 20, 5);
    gfx.fillStyle(0x000000, 1);
    gfx.fillCircle(15, 20, 2);
    gfx.fillCircle(33, 20, 2);
    // Open screaming mouth
    gfx.fillStyle(0x2d1e18, 1);
    gfx.fillCircle(24, 34, 4);
    // Orange bouncing up
    gfx.fillStyle(0xf39c12, 1);
    gfx.fillCircle(24, 6, 7);
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillTriangle(25, 0, 31, -2, 28, 3);
    gfx.generateTexture('head_capybara_shock', 48, 48);

    // Torso: Brown fur + Red Neckerchief
    gfx.clear();
    gfx.fillStyle(0x8d6e63, 1);
    gfx.lineStyle(2, 0x2d1e18, 1);
    gfx.fillRoundedRect(0, 0, 28, 42, 8);
    gfx.strokeRoundedRect(0, 0, 28, 42, 8);
    // Red bandana/neckerchief
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillTriangle(4, 2, 24, 2, 14, 16);
    gfx.generateTexture('torso_capybara', 28, 42);

    // Arm & Leg
    gfx.clear();
    gfx.fillStyle(0x8d6e63, 1);
    gfx.lineStyle(2, 0x2d1e18, 1);
    gfx.fillRoundedRect(0, 0, 12, 28, 5);
    gfx.strokeRoundedRect(0, 0, 12, 28, 5);
    gfx.generateTexture('arm_capybara', 12, 28);

    gfx.clear();
    gfx.fillStyle(0x6d4c41, 1);
    gfx.lineStyle(2, 0x2d1e18, 1);
    gfx.fillRoundedRect(0, 0, 12, 30, 5);
    gfx.strokeRoundedRect(0, 0, 12, 30, 5);
    // Claws
    gfx.fillStyle(0x2d1e18, 1);
    gfx.fillRect(2, 26, 3, 4);
    gfx.fillRect(7, 26, 3, 4);
    gfx.generateTexture('leg_capybara', 12, 30);
  }

  createMemeSkinBananaCat() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Banana Cat Normal Head (48x48)
    gfx.clear();
    // Yellow Banana Peel Hood
    gfx.fillStyle(0xf1c40f, 1);
    gfx.lineStyle(2, 0xd4ac0d, 1);
    gfx.fillRoundedRect(6, 6, 36, 40, 14);
    gfx.strokeRoundedRect(6, 6, 36, 40, 14);
    // Green banana stem at top
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillRoundedRect(21, 0, 6, 8, 2);
    // White Cat face inside opening
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(24, 26, 13);
    // Cat ears poking up
    gfx.fillStyle(0xffffff, 1);
    gfx.fillTriangle(13, 16, 19, 16, 14, 8);
    gfx.fillTriangle(29, 16, 35, 16, 34, 8);
    gfx.fillStyle(0xff9ff3, 1);
    gfx.fillTriangle(14, 15, 18, 15, 15, 10);
    gfx.fillTriangle(30, 15, 34, 15, 33, 10);
    // Crying meme teardrop eyes
    gfx.fillStyle(0x00d2d3, 1);
    gfx.fillCircle(18, 24, 4);
    gfx.fillCircle(30, 24, 4);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(17, 23, 1.5);
    gfx.fillCircle(29, 23, 1.5);
    // Tears spilling down
    gfx.fillStyle(0x54a0ff, 0.9);
    gfx.fillTriangle(16, 27, 20, 27, 18, 35);
    gfx.fillTriangle(28, 27, 32, 27, 30, 35);
    // Cute cat mouth :3
    gfx.lineStyle(2, 0x2c3e50, 1);
    gfx.beginPath();
    gfx.arc(22, 30, 3, 0, Math.PI, false);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(26, 30, 3, 0, Math.PI, false);
    gfx.strokePath();
    gfx.generateTexture('head_cat', 48, 48);

    // Shocked Head: Crying Waterfall Tears!
    gfx.clear();
    gfx.fillStyle(0xf1c40f, 1);
    gfx.lineStyle(2, 0xd4ac0d, 1);
    gfx.fillRoundedRect(6, 6, 36, 40, 14);
    gfx.strokeRoundedRect(6, 6, 36, 40, 14);
    gfx.fillStyle(0x27ae60, 1);
    gfx.fillRoundedRect(21, 0, 6, 8, 2);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(24, 26, 13);
    // Giant streaming waterfall tears
    gfx.fillStyle(0x54a0ff, 0.95);
    gfx.fillRect(14, 22, 7, 24);
    gfx.fillRect(27, 22, 7, 24);
    // Screaming open mouth
    gfx.fillStyle(0x2c3e50, 1);
    gfx.fillCircle(24, 33, 4);
    gfx.generateTexture('head_cat_shock', 48, 48);

    // Torso: Banana Suit with Cat Belly
    gfx.clear();
    gfx.fillStyle(0xf1c40f, 1);
    gfx.lineStyle(2, 0xd4ac0d, 1);
    gfx.fillRoundedRect(0, 0, 28, 42, 8);
    gfx.strokeRoundedRect(0, 0, 28, 42, 8);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(14, 24, 9);
    gfx.generateTexture('torso_cat', 28, 42);

    gfx.clear();
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillRoundedRect(0, 0, 12, 28, 5);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(6, 24, 5);
    gfx.generateTexture('arm_cat', 12, 28);

    gfx.clear();
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillRoundedRect(0, 0, 12, 30, 5);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(6, 26, 5);
    gfx.generateTexture('leg_cat', 12, 30);
  }

  createMemeSkinDoge() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Doge Normal Head (48x48)
    gfx.clear();
    // Shiba Ears
    gfx.fillStyle(0xd68910, 1);
    gfx.fillTriangle(8, 18, 16, 18, 10, 4);
    gfx.fillTriangle(32, 18, 40, 18, 38, 4);
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillTriangle(10, 17, 15, 17, 11, 8);
    gfx.fillTriangle(33, 17, 38, 17, 37, 8);
    // Head
    gfx.fillStyle(0xf5b041, 1);
    gfx.lineStyle(2, 0xb9770e, 1);
    gfx.fillCircle(24, 26, 16);
    gfx.strokeCircle(24, 26, 16);
    // Cream Muzzle & Cheeks
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillEllipse(24, 30, 12, 9);
    // Nose
    gfx.fillStyle(0x111111, 1);
    gfx.fillTriangle(22, 26, 26, 26, 24, 29);
    // Iconic Side-Eye Meme Eyes
    gfx.fillStyle(0xffffff, 1);
    gfx.fillEllipse(17, 21, 5, 4);
    gfx.fillEllipse(31, 21, 5, 4);
    gfx.fillStyle(0x111111, 1);
    gfx.fillCircle(19, 20, 2.5); // looking side-up
    gfx.fillCircle(33, 20, 2.5);
    // White eyebrows
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillCircle(16, 15, 2.5);
    gfx.fillCircle(32, 15, 2.5);
    gfx.generateTexture('head_doge', 48, 48);

    // Shocked Doge: "SUCH DANGER" dizzy spiral eyes
    gfx.clear();
    gfx.fillStyle(0xd68910, 1);
    gfx.fillTriangle(8, 18, 16, 18, 10, 4);
    gfx.fillTriangle(32, 18, 40, 18, 38, 4);
    gfx.fillStyle(0xf5b041, 1);
    gfx.fillCircle(24, 26, 16);
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillEllipse(24, 30, 12, 9);
    // Spiral dizzy eyes
    gfx.lineStyle(2, 0x111111, 1);
    gfx.strokeCircle(17, 21, 4);
    gfx.strokeCircle(31, 21, 4);
    // Tongue sticking out
    gfx.fillStyle(0xff7675, 1);
    gfx.fillRoundedRect(22, 32, 6, 8, 3);
    gfx.generateTexture('head_doge_shock', 48, 48);

    // Torso: Tan fur + Turquoise Collar
    gfx.clear();
    gfx.fillStyle(0xf5b041, 1);
    gfx.lineStyle(2, 0xb9770e, 1);
    gfx.fillRoundedRect(0, 0, 28, 42, 8);
    gfx.strokeRoundedRect(0, 0, 28, 42, 8);
    // Cream chest patch
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillCircle(14, 24, 8);
    // Turquoise Doge collar
    gfx.fillStyle(0x00cec9, 1);
    gfx.fillRect(2, 2, 24, 6);
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillCircle(14, 8, 3); // gold tag
    gfx.generateTexture('torso_doge', 28, 42);

    gfx.clear();
    gfx.fillStyle(0xf5b041, 1);
    gfx.fillRoundedRect(0, 0, 12, 28, 5);
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillCircle(6, 24, 5);
    gfx.generateTexture('arm_doge', 12, 28);

    gfx.clear();
    gfx.fillStyle(0xf5b041, 1);
    gfx.fillRoundedRect(0, 0, 12, 30, 5);
    gfx.fillStyle(0xfef5e7, 1);
    gfx.fillCircle(6, 26, 5);
    gfx.generateTexture('leg_doge', 12, 30);
  }

  createMemeSkinSigmaGolden() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    // 1. Sigma Golden Head (48x48)
    gfx.clear();
    // Gold metallic head
    gfx.fillStyle(0xffd700, 1);
    gfx.lineStyle(2, 0xb7950b, 1);
    gfx.fillCircle(24, 24, 18);
    gfx.strokeCircle(24, 24, 18);
    // Gold sheen highlight
    gfx.fillStyle(0xfff9c4, 0.7);
    gfx.fillCircle(18, 16, 5);
    // 8-Bit Pixel Sunglasses ("DEAL WITH IT")
    gfx.fillStyle(0x111111, 1);
    gfx.fillRect(9, 18, 13, 8);
    gfx.fillRect(26, 18, 13, 8);
    gfx.fillRect(21, 20, 6, 4); // bridge
    // White pixel reflection glint
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(11, 19, 3, 3);
    gfx.fillRect(28, 19, 3, 3);
    // Sigma Smirk
    gfx.lineStyle(2, 0xb7950b, 1);
    gfx.lineBetween(22, 32, 30, 30);
    gfx.generateTexture('head_golden', 48, 48);

    // Shocked Sigma (Sunglasses tilted)
    gfx.clear();
    gfx.fillStyle(0xffd700, 1);
    gfx.lineStyle(2, 0xb7950b, 1);
    gfx.fillCircle(24, 24, 18);
    gfx.strokeCircle(24, 24, 18);
    // Tilted sunglasses
    gfx.fillStyle(0x111111, 1);
    gfx.fillRect(8, 15, 13, 8);
    gfx.fillRect(26, 22, 13, 8);
    gfx.fillRect(20, 18, 7, 4);
    // Gritted teeth
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(18, 30, 12, 6);
    gfx.lineStyle(1, 0x111111, 1);
    gfx.strokeRect(18, 30, 12, 6);
    gfx.generateTexture('head_golden_shock', 48, 48);

    // Torso: Luxury Black Tuxedo with Red Bow Tie & Gold Lapels
    gfx.clear();
    gfx.fillStyle(0x1e272e, 1);
    gfx.fillRoundedRect(0, 0, 28, 42, 8);
    // White shirt triangle
    gfx.fillStyle(0xffffff, 1);
    gfx.fillTriangle(8, 0, 20, 0, 14, 20);
    // Red bow tie
    gfx.fillStyle(0xe74c3c, 1);
    gfx.fillTriangle(10, 4, 14, 7, 10, 10);
    gfx.fillTriangle(18, 4, 14, 7, 18, 10);
    gfx.fillCircle(14, 7, 2);
    // Golden lapels
    gfx.lineStyle(2, 0xf1c40f, 1);
    gfx.lineBetween(6, 0, 12, 22);
    gfx.lineBetween(22, 0, 16, 22);
    gfx.generateTexture('torso_golden', 28, 42);

    // Tuxedo Arm with Gold Cuff
    gfx.clear();
    gfx.fillStyle(0x1e272e, 1);
    gfx.fillRoundedRect(0, 0, 12, 28, 5);
    gfx.fillStyle(0xf1c40f, 1);
    gfx.fillRect(0, 20, 12, 3); // gold watch
    gfx.fillStyle(0xffd700, 1);
    gfx.fillCircle(6, 25, 4); // gold hand
    gfx.generateTexture('arm_golden', 12, 28);

    // Black Dress Pants with Shiny Gold Shoes
    gfx.clear();
    gfx.fillStyle(0x1e272e, 1);
    gfx.fillRoundedRect(0, 0, 12, 30, 5);
    gfx.fillStyle(0xffd700, 1);
    gfx.fillRoundedRect(0, 24, 14, 6, 2); // shiny gold shoes
    gfx.generateTexture('leg_golden', 12, 30);
  }
}
