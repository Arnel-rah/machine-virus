import * as Phaser from "phaser";

export class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver" });
  }

  create(data: { score: number; combo: number; level: number }) {
    this.cameras.main.setBackgroundColor("#0a0a12");

    this.add.text(512, 180, "MISSION FAILED", {
      fontFamily: "monospace",
      fontSize: "72px",
      color: "#ff0000"
    }).setOrigin(0.5);

    this.add.text(512, 280, `LEVEL ${data.level} - FINAL PRODUCTION`, {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    this.add.text(512, 340, data.score.toString(), {
      fontFamily: "monospace",
      fontSize: "68px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(512, 410, `MAX COMBO : ${data.combo}x`, {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#ffff00"
    }).setOrigin(0.5);

    const restartBtn = this.add.text(512, 520, "RESTART SHIFT", {
      fontFamily: "monospace",
      fontSize: "34px",
      color: "#00ffcc",
      padding: { x: 40, y: 15 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on("pointerover", () => restartBtn.setColor("#ffffff"));
    restartBtn.on("pointerout", () => restartBtn.setColor("#00ffcc"));
    restartBtn.on("pointerdown", () => {
      this.scene.start("Game");
    });
  }
}
