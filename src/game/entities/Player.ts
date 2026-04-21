import * as Phaser from "phaser";

export class Player {
  private scene: Phaser.Scene;
  private sprite!: Phaser.Physics.Arcade.Sprite;
  private health: number = 100;
  private score: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.createPlayer(x, y);
  }

  private createPlayer(x: number, y: number) {
    // Create a simple player sprite
    const graphics = this.scene.make.graphics({ x: 0, y: 0});
    graphics.fillStyle(0x00d4ff, 1);
    graphics.fillCircle(16, 16, 12);
    graphics.generateTexture("player", 32, 32);
    graphics.destroy();

    this.sprite = this.scene.physics.add.sprite(x, y, "player");
    this.sprite.setBounce(0.2);
    this.sprite.setCollideWorldBounds(true);
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  public getHealth(): number {
    return this.health;
  }

  public takeDamage(amount: number) {
    this.health -= amount;
  }

  public heal(amount: number) {
    this.health = Math.min(100, this.health + amount);
  }

  public addScore(points: number) {
    this.score += points;
  }

  public getScore(): number {
    return this.score;
  }

  public destroy() {
    this.sprite.destroy();
  }
}
