import * as Phaser from "phaser";

export interface MachineConfig {
  type: "gear" | "piston" | "belt";
  x: number;
  y: number;
  broken: boolean;
}

export class Machine extends Phaser.GameObjects.Container {
  public isBroken: boolean = true;
  public machineType: string;

  private base!: Phaser.GameObjects.Rectangle;
  private indicator!: Phaser.GameObjects.Graphics;
  private repairTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, config: MachineConfig) {
    super(scene, config.x, config.y);

    this.machineType = config.type;
    this.isBroken = config.broken;

    this.createVisuals();
    scene.add.existing(this);
  }

  private createVisuals() {
    this.base = this.scene.add.rectangle(0, 0, 90, 90, 0x444466);
    this.base.setStrokeStyle(4, 0x8888aa);
    this.add(this.base);
    this.indicator = this.scene.add.graphics();
    this.add(this.indicator);

    this.updateBrokenVisual();
  }

  private updateBrokenVisual() {
    this.indicator.clear();

    if (this.isBroken) {
      this.indicator.fillStyle(0xff3366, 0.9);
      this.indicator.fillCircle(0, -35, 12);
      this.scene.tweens.add({
        targets: this.indicator,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  public repair(): void {
    if (!this.isBroken) return;

    this.isBroken = false;

    this.scene.tweens.add({
      targets: this.base,
      fillColor: 0x44aa77,
      duration: 400,
      ease: "Power2",
    });

    this.indicator.clear();
    this.indicator.fillStyle(0x00ff99, 1);
    this.indicator.fillCircle(0, -35, 10);

    this.scene.cameras.main.flash(150, 80, 255, 120);
    this.scene.cameras.main.shake(180, 0.008);
  }

  public isRepairable(): boolean {
    return this.isBroken;
  }
}
