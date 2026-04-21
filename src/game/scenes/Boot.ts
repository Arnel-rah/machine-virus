import * as Phaser from "phaser";
import { Game } from "./Game";

export class Boot extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload() {
    // Preload assets here if needed
    // this.load.image('sky', 'assets/sky.png');
  }

  create() {
    // Setup game configuration
    this.setupAudio();

    // Start the main game scene
    this.scene.start("Game");
  }

  private setupAudio() {
    // Audio initialization can happen here
    // Web Audio API will be initialized in the Game scene
  }
}

// Phaser game configuration
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 }
    }
  },
  scene: [Boot, Game],
  render: {
    antialias: false,
    pixelArt: true
  },
  parent: "game-container"
};

// Initialize the game
export function initializeGame() {
  return new Phaser.Game(gameConfig);
}
