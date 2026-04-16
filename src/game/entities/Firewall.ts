import * as Phaser from "phaser";

export class Firewall extends Phaser.GameObjects.Arc {
  private orbitSpeed: number;
  private distance: number;
  private orbitAngle: number = 0;
  private center: { x: number; y: number };
  // private pulseDirection: number = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    distance: number,
    speed: number,
  ) {
    super(scene, x, y, 6, 0, 360, false, 0x00ffff);
    this.center = { x, y };
    this.distance = distance;
    this.orbitSpeed = speed * 2.5;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (this.body instanceof Phaser.Physics.Arcade.Body) {
      this.body.setCircle(6);
    }
    scene.tweens.add({
        targets: this,
        radius: 10,
        duration: 400,
        yoyo: true,
        repeat: -1
    });
  }

  update(time: number, delta: number) {
    this.orbitAngle += this.orbitSpeed * (delta / 1000);
    const jitter = Math.sin(time / 200) * 5;

    this.x = this.center.x + Math.cos(this.orbitAngle) * (this.distance + jitter);
    this.y = this.center.y + Math.sin(this.orbitAngle) * (this.distance + jitter);
  }
}
