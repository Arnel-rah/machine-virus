import * as Phaser from "phaser";

export class Firewall extends Phaser.GameObjects.Arc {
    private orbitSpeed: number;
    private distance: number;
    private orbitAngle: number = 0;
    private center: { x: number; y: number };

    constructor(scene: Phaser.Scene, x: number, y: number, distance: number, speed: number) {
        super(scene, x, y, 8, 0, 360, false, 0x00ffff);
        this.center = { x, y };
        this.distance = distance;
        this.orbitSpeed = speed; 

        scene.add.existing(this);
        scene.physics.add.existing(this);

        scene.tweens.add({
            targets: this,
            radius: 12,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    update(time: number, delta: number) {
        this.orbitAngle += this.orbitSpeed * (delta / 1000);
        this.x = this.center.x + Math.cos(this.orbitAngle) * this.distance;
        this.y = this.center.y + Math.sin(this.orbitAngle) * this.distance;
    }
}
