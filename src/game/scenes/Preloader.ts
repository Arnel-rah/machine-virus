
import * as Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: "Preloader" });
  }

  preload() {
    this.createAllPlaceholderTextures();
  }

  private createAllPlaceholderTextures() {
    const gfx = this.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture("pixel", 8, 8);

    gfx.clear();
    gfx.fillStyle(0x00aaff, 1);
    gfx.fillRect(0, 20, 42, 38);
    gfx.fillStyle(0xff8800, 1);
    gfx.fillRect(12, 8, 18, 18);
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(16, 13, 4, 4);
    gfx.fillRect(26, 13, 4, 4);
    gfx.generateTexture("robot", 42, 58);
    gfx.clear();
    gfx.fillStyle(0x333344, 1);
    gfx.fillRect(0, 0, 128, 80);
    gfx.lineStyle(4, 0x555577, 1);
    for (let i = 0; i < 8; i++) {
      gfx.strokeRect(i * 16, 20, 12, 40);
    }
    gfx.generateTexture("conveyor", 128, 80);

    gfx.clear();
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillRect(0, 0, 1024, 576);
    gfx.generateTexture("background", 1024, 576);

    gfx.destroy();
  }

  create() {
    this.scene.start("MainMenu");
  }
}
