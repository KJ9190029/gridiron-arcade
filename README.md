# Gridiron Arcade

A lightweight football mini-game built with plain HTML, CSS, and JavaScript.

## Play the prototype

1. Open a terminal in this folder.
2. Run `python3 -m http.server 8000`.
3. Visit `http://localhost:8000`.

Controls:

- Move: WASD or Arrow keys
- Pass: P
- Sprint: Shift
- Snap: Space

## Simulation roadmap

The detailed football simulation blueprint is documented in [`BLUEPRINT.md`](BLUEPRINT.md). The first reusable simulation layer is in [`src/simulation-core.js`](src/simulation-core.js), including ball flight, weather/surface modifiers, inertial player movement, down-and-distance rules, player attributes, and stat aggregation.

The playable client is intentionally an arcade-style prototype, not a full Madden clone. Future work can connect the simulation foundation to the canvas loop, then add playbooks, richer AI, animation, presentation, franchise systems, and multiplayer in that order.
