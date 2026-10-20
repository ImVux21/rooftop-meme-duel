import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import ShopScene from './scenes/ShopScene.js';
import MemeTowerScene from './scenes/MemeTowerScene.js';
import { soundFx } from './utils/SoundFx.js';
import { crazyGamesSDK } from './utils/CrazyGamesSDK.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 720,
  backgroundColor: '#12151f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 1.2 },
      debug: false // Set to true if you want to inspect hitboxes
    }
  },
  scene: [BootScene, MenuScene, GameScene, ShopScene, MemeTowerScene]
};

let game = null;

async function bootstrap() {
  // 1. Initialize CrazyGames SDK v3 before engine starts to prevent Black Screen
  await crazyGamesSDK.init();
  crazyGamesSDK.loadingStart();

  // 2. Start Phaser Game
  game = new Phaser.Game(config);
  if (typeof window !== 'undefined') {
    window.game = game;
  }

  // 3. Tab switching & window focus lifecycle handling (CrazyGames requirement)
  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    if (game?.sound) game.sound.mute = isHidden;
    soundFx.setTabMuted(isHidden);
    if (isHidden) {
      crazyGamesSDK.gameplayStop();
    } else {
      const activeGameScene = game?.scene?.getScene('GameScene');
      if (activeGameScene && activeGameScene.scene.isActive() && !activeGameScene.isMatchOver && !activeGameScene.isPaused) {
        crazyGamesSDK.gameplayStart();
      }
    }
  });

  window.addEventListener('blur', () => {
    if (game?.sound) game.sound.mute = true;
    soundFx.setTabMuted(true);
  });

  window.addEventListener('focus', () => {
    if (!document.hidden) {
      if (game?.sound) game.sound.mute = false;
      soundFx.setTabMuted(false);
    }
  });
}

bootstrap();

export default game;
