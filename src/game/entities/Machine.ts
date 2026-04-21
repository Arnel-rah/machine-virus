import * as Phaser from "phaser";

export class Machine {
  private scene: Phaser.Scene;
  private sprite!: Phaser.Physics.Arcade.Sprite;
  private cpuUsage: number = 0;
  private memoryUsage: number = 0;
  private infected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.createMachine(x, y);
  }

  private createMachine(x: number, y: number) {
    const graphics = this.scene.make.graphics({ x: 0, y: 0});
    graphics.fillStyle(0x00d4ff, 1);
    graphics.fillRect(8, 8, 32, 32);
    graphics.generateTexture("machine", 48, 48);
    graphics.destroy();

    this.sprite = this.scene.physics.add.sprite(x, y, "machine");
    this.sprite.setImmovable(true);
  }

  public getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.sprite;
  }

  public setCpuUsage(usage: number) {
    this.cpuUsage = Math.min(100, Math.max(0, usage));
  }

  public getCpuUsage(): number {
    return this.cpuUsage;
  }

  public setMemoryUsage(usage: number) {
    this.memoryUsage = Math.min(100, Math.max(0, usage));
  }

  public getMemoryUsage(): number {
    return this.memoryUsage;
  }

  public setInfected(infected: boolean) {
    this.infected = infected;
  }

  public isInfected(): boolean {
    return this.infected;
  }

  public destroy() {
    this.sprite.destroy();
  }
}
