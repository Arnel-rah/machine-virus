import * as Phaser from "phaser";

export class Firewall {
  private graphics: Phaser.GameObjects.Graphics;
  private strength: number = 100;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics();
    this.draw();
  }

  private draw() {
    this.graphics.clear();
    this.graphics.lineStyle(3, 0x00ff00, this.strength / 100);
    this.graphics.strokeRect(50, 50, 200, 20);
    this.graphics.strokePath();
  }

  public takeDamage(amount: number) {
    this.strength = Math.max(0, this.strength - amount);
    this.draw();
  }
}
