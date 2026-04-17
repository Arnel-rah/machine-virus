import * as Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "robot");

    scene.add.existing(this);
    scene.physics.add.existing(this, false);

    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setDragX(800);
    if (!scene.textures.exists("robot")) {
      this.createPlaceholderTexture(scene);
    }

    this.cursors = scene.input.keyboard!.createCursorKeys();
  }

  private createPlaceholderTexture(scene: Phaser.Scene) {
    const gfx = scene.make.graphics({ x: 0, y: 0 });
    gfx.fillStyle(0x00ccff, 1);
    gfx.fillRect(0, 0, 42, 52);
    gfx.fillStyle(0xff8800, 1);
    gfx.fillRect(12, 8, 18, 18);
    gfx.generateTexture("robot", 42, 52);
    gfx.destroy();
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.cursors.left.isDown) {
      this.setVelocityX(-280);
      this.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(280);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if (this.cursors.up.isDown && body.onFloor()) {
      this.setVelocityY(-520);
    }
  }
}
