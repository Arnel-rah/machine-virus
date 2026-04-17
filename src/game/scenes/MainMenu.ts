import * as Phaser from "phaser";

export class MainMenu extends Phaser.Scene {
  constructor() {
    super({ key: "MainMenu" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#0a0a12");

    const title = this.add.text(512, 220, "OVERCLOCKED", {
      fontFamily: "monospace",
      fontSize: "88px",
      color: "#ffcc00",
      shadow: { offsetX: 4, offsetY: 4, color: "#ff6600", blur: 12, fill: true }
    }).setOrigin(0.5);

    this.add.text(512, 310, "KEEP THE MACHINES ALIVE", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ff3366",
    }).setOrigin(0.5);

    const startButton = this.add.text(512, 480, "START REPAIR SHIFT", {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#00ffcc",
      padding: { x: 40, y: 18 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () => startButton.setStyle({ color: "#ffffff" }));
    startButton.on("pointerout", () => startButton.setStyle({ color: "#00ffcc" }));
    startButton.on("pointerdown", () => {
      this.cameras.main.fadeOut(600, 10, 10, 20);
      this.time.delayedCall(700, () => {
        this.scene.start("Game");
      });
    });

    this.tweens.add({
      targets: title,
      y: 210,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}
