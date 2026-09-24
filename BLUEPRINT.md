# Modern Gridiron Simulation Blueprint

The supplied 110-point matrix is now the technical roadmap for Gridiron Arcade. The current browser build remains a lightweight arcade prototype; this document separates what is implemented from what belongs in later simulation phases.

## Current implementation

- Canvas field and browser controls
- Home/away players
- WASD/arrow movement with sprint
- Passing to the best available receiver
- Basic defensive pursuit and tackles
- Score, clock, down display, touchdown flow, and reset flow

## Phase 1: simulation foundation

The repository now includes `src/simulation-core.js`, a dependency-free foundation for the most important simulation rules:

- Prolate-football-inspired state with spin decay and wind-aware acceleration
- Surface friction and weather modifiers
- Inertia-based player movement and stamina drain
- Down-and-distance, forward-progress, touchdown, and safety checks
- Event-based stat aggregation
- Data-driven player attributes and roster records

The current canvas game can continue to use simple visuals while these systems are incrementally connected to gameplay.

## Recommended build order

1. **Physics and rules:** connect `BallPhysics`, `PlayerMotor`, and `RulesEngine` to the existing game loop. Add catch, incompletion, fumble, and penalty outcomes.
2. **Play AI:** represent routes as nodes, then add man, zone, spy, blitz, and progression states.
3. **Animation and presentation:** replace circles with sprite or 3D assets, then add camera, audio, weather, and replay layers.
4. **Modes and persistence:** add roster JSON, franchise progression, salary-cap data, practice scenarios, and local multiplayer.
5. **Online play:** only after deterministic local simulation and replay checksums are stable; add rollback and desync arbitration last.

## Scope note

A full AAA simulation with 22-agent AI, online rollback, licensed presentation, and hundreds of animation assets cannot be produced by a single browser file. This project uses the matrix as an extensible architecture rather than pretending all 110 systems are already complete. It also avoids real team, player, broadcast, and branding assets.
