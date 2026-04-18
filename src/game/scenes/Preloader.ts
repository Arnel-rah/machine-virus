import * as Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: "Preloader" });
  }

  create() {
    this.createPlaceholderTextures();
    this.scene.start("MainMenu");
  }

  private createPlaceholderTextures() {
    const gfx = this.make.graphics({ x: 0, y: 0 });

    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture("pixel", 8, 8);

    gfx.clear();
    gfx.fillStyle(0x00aaff);
    gfx.fillRect(0, 22, 42, 36);
    gfx.fillStyle(0xff8800);
    gfx.fillRect(12, 8, 18, 18);
    gfx.fillStyle(0x111111);
    gfx.fillRect(17, 13, 4, 4);
    gfx.fillRect(27, 13, 4, 4);
    gfx.generateTexture("robot", 42, 58);

    gfx.clear();
    gfx.fillStyle(0x2a2a3a);
    gfx.fillRect(0, 0, 128, 80);
    gfx.lineStyle(6, 0x555577);
    for (let i = 0; i < 8; i++) {
      gfx.strokeRect(i * 16 + 4, 25, 10, 35);
    }
    gfx.generateTexture("conveyor", 128, 80);

    gfx.clear();
    gfx.fillStyle(0x1a1a2e);
    gfx.fillRect(0, 0, 1024, 576);
    gfx.generateTexture("background", 1024, 576);

    gfx.destroy();
  }
}
