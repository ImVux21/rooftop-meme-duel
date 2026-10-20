# 🥊 Rooftop Meme Duel: Wacky 2-Player Showdown

A cross-platform, physics-driven 2-player arcade duel built with **HTML5, Phaser 3, and Matter.js**, tailored specifically for high retention and monetization on **CrazyGames**.

---

## 🚀 Quick Start

### 1. Run Development Server (Hot-Reload)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production / CrazyGames Submission
```bash
npm run build
```
This produces a ready-to-publish build in the `dist/` folder.
To submit to CrazyGames:
1. Select all files inside `dist/` (`index.html` and `assets/`).
2. Right-click -> **Send to Compressed (zipped) folder**.
3. Upload the `.zip` file directly to [CrazyGames Developer Portal](https://developer.crazygames.com/).

---

## 🎮 How to Play

### 🖥️ Desktop / Keyboard Controls:
* **Player 1 (Blue):**
  * `[W]` or `[Space]`: Jump & Lean
  * `[E]`: Shoot / Throw Weapon
* **Player 2 (Red / CPU):**
  * `[I]` or `[Up Arrow]`: Jump & Lean
  * `[O]` or `[Enter]`: Shoot / Throw Weapon

### 📱 Mobile / Tablet Controls:
* On-screen semi-transparent touch buttons automatically active for both players.

---

## 💥 Features Included

1. **Dual Modes:**
   * **1 Player vs CPU:** Smart bot that aims, jumps to avoid edges, and shoots.
   * **2 Players Local PvP:** Duel with friends on the same keyboard or screen.
2. **5 Hilarious Meme Weapons:**
   * **Pistol:** Fast projectile, medium recoil.
   * **Bazooka:** High explosive blast with massive screen shake.
   * **Meme Tuna / Fish:** Flapping fish projectile with funny wet slap sound.
   * **Bouncy Grenade:** Bounces off ledges before detonating.
   * **Laser Blaster:** Sci-fi beam with instantaneous velocity.
3. **3 Dynamic Arenas:**
   * *City Rooftop* (Standard concrete ledge with hazard stripes)
   * *Slippery Iceberg* (Low friction ice surface)
   * *Construction Beam* (Narrow suspended steel beam)
4. **Sudden Death:**
   * If a round exceeds 20 seconds, sirens sound and molten lava rises from below!
5. **Procedural Web Audio Engine:**
   * Zero external MP3/WAV dependencies — 100% instant loading on all devices.
6. **CrazyGames SDK v3 Integration:**
   * `gameplayStart()` and `gameplayStop()` telemetry.
   * Midgame Video Ads on match completion (with automatic cooldown management).
   * Rewarded Video Ads for doubling match rewards (+50 coins) and free shop coins (+100 coins).
7. **Meme Skin Shop:**
   * Unlock and equip 6 character skins: *Original Bro, Chill Capybara, Banana Cat, Much Doge, Cyber Noob, Sigma Golden*.
