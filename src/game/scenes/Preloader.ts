import * as Phaser from "phaser";

export class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: "Preloader" });
  }

  preload() {
    this.load.image("pixel", "assets/images/pixel.png");
    this.load.image("background", "assets/images/factory-bg.png");
    this.load.image("robot", "assets/images/robot.png");
    this.load.image("conveyor", "assets/images/conveyor.png");
    this.createPlaceholderTextures();
  }

  private createPlaceholderTextures() {
    const graphics = this.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 6);
    graphics.generateTexture("pixel", 6, 6);
    graphics.destroy();

    const machineGfx = this.make.graphics({ x: 0, y: 0 });
    machineGfx.fillStyle(0x555577, 1);
    machineGfx.fillRect(0, 0, 80, 80);
    machineGfx.generateTexture("machine-base", 80, 80);
    machineGfx.destroy();
  }

  create() {
    this.scene.start("MainMenu");
  }
}
