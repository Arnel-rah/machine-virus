import * as Phaser from "phaser";
import { Preloader } from "./game/scenes/Preloader";
import { MainMenu } from "./game/scenes/MainMenu";
import { Game } from "./game/scenes/Game";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: "game",
  backgroundColor: "#0a0a12",
  scene: [Preloader, MainMenu, Game],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 576,
  },
};

new Phaser.Game(config);
