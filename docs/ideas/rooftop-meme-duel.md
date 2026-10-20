# Rooftop Meme Duel: Wacky 2-Player Showdown

## Problem Statement
How might we build a hilarious, physics-driven cross-platform web game within 1 week that maximizes CrazyGames ad revenue and player retention through local 2-player rivalry, meme hooks, and satisfying progression?

## Recommended Direction
**"Wacky Weapon Rooftop Duel"** — A physics-based, 2-player arcade duel (with smart solo vs CPU support) inspired by hits like *Rooftop Snipers* and *Stickman Temple Duel*, infused with modern meme energy and an addictive reward loop.

Two wobbly ragdoll characters battle atop dynamic, dangerous platforms (rooftops, slippery icebergs, wobbling bridges). Controls are dead simple: 
- **Button 1 (Jump / Lean):** Hold to lean back, release to jump.
- **Button 2 (Shoot / Throw):** Fire the current weapon.

Each round introduces random meme weapons (Fish Slapper, Golden Frying Pan, Rocket Launcher, Bouncy Tennis Ball, Boxing Glove Cannon). First to reach 5 points wins the match.

### Monetization Engine
- **Midgame Video Ads:** Triggered naturally at the end of each full 5-round match (adhering to CrazyGames 2-minute cooldown).
- **Rewarded Video Ads:** High-eCPM opt-in triggers:
  1. *Double Match Coins (x2 Rewards)* upon victory.
  2. *Lucky Weapon Gacha* in the shop.
  3. *VIP Skin Trial* for 1 match.
- **Shop & Vanity Progression:** Coins earned from matches and rewarded ads unlock iconic meme skins (Capybara, Banana Cat, Doge, Golden Suit) and customized victory celebrations.

## Key Assumptions to Validate
- [ ] **Ragdoll Physics Game-Feel:** The 2-button jump/lean & shoot mechanics must feel immediately hilarious, responsive, and easy to understand within 3 seconds.
- [ ] **Cross-Platform Parity:** Touch controls on tablets/phones must be just as responsive and enjoyable as desktop keyboard inputs (`W`/`E` vs `I`/`O`).
- [ ] **Solo Player Retention:** The CPU Bot must exhibit funny yet competitive behavior so solo players stay engaged for 15+ minutes.
- [ ] **CrazyGames SDK Integration:** SDK v3 lifecycle events (`gameplayStart`, `gameplayStop`, `ad.requestAd('midgame')`, `ad.requestAd('rewarded')`) must integrate cleanly without disrupting game flow.

## MVP Scope (7-Day Sprint)
### Core Gameplay (In Scope)
- [x] Dual Game Modes: **1P vs CPU** and **2P Local PvP** (shared keyboard or dual touch buttons).
- [x] Physics Engine: Phaser 3 + Matter.js for ragdoll balance, momentum, recoil, and knockback.
- [x] 5 Meme Weapons with distinct ballistic behaviors:
  1. *Pistol (Standard fast projectile, moderate knockback)*
  2. *Bazooka (Slow explosive rocket, huge knockback & screen shake)*
  3. *Frozen Tuna / Fish (Thrown tumbling arc, heavy slap effect)*
  4. *Bouncy Grenade (Bounces off walls/floors before detonating)*
  5. *Laser Gun (Instant beam with zero drop)*
- [x] 3 Dynamic Arenas:
  1. *City Rooftop (Standard high-rise with wind gusts)*
  2. *Slippery Iceberg (Low friction, wobbly iceberg edges)*
  3. *Wobbly Construction Beam (Tipping balance beam)*
- [x] Round Scoring (First to 5 points, Sudden Death lava if round exceeds 30s).
- [x] Procedural Sound FX & Audio Synthesizer (Zero asset loading lag, instant feedback on shoot, hit, slap, win).
- [x] Economy & Shop: Coin rewards per win, 6 unlockable character skins.
- [x] CrazyGames SDK v3 ready (with mock fallback for local development).

## Not Doing (and Why)
- **Real-time Server Multiplayer (WebSocket / Colyseus):** Zero server costs, zero netcode desync, zero lag risk. Local 2-Player + CPU bot satisfies 100% of the target use case.
- **Complex 3D graphics:** 3D engines increase load times and mobile battery drain. Clean, vibrant 2D vector/ragdoll art ensures instant <2 second loading and constant 60 FPS on any browser.
- **Lengthy story mode / dialogue:** Players on CrazyGames want action within 5 seconds of loading; text cutscenes kill retention.

## Open Questions
1. Optimal camera zoom: Dynamic zoom that pulls back when players are far apart and zooms in on close-quarters knockouts.
2. Initial balancing: Knockback multiplier adjustment so matches don't end in 1 second, but don't stall beyond 45 seconds.
