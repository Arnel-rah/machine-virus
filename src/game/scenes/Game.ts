import * as Phaser from "phaser";
import { LEVELS } from "../data/levels";
import { Firewall } from "../entities/Firewall";
import { RuleTree } from "../entities/RuleTree";

export class Game extends Phaser.Scene {
  private tree!: RuleTree;
  private firewalls!: Phaser.GameObjects.Group;
  private logLines: string[] = [];
  private logText!: Phaser.GameObjects.Text;
  private scanline!: Phaser.GameObjects.Graphics;

  private infiltrationPercent: number = 0;
  private progressFill!: Phaser.GameObjects.Graphics;
  private percentText!: Phaser.GameObjects.Text;

  private timeLeft: number = 60;
  private timerText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

  constructor() {
    super("Game");
  }

  create() {
    this.isGameOver = false;
    this.timeLeft = 60;

    this.cameras.main.setBackgroundColor("#050505");
    this.add.grid(512, 384, 1024, 768, 32, 32, 0x000000, 0, 0x00ff00, 0.05);
    const networkLines = this.add.graphics();
    networkLines.lineStyle(2, 0x00ff00, 0.2);
    LEVELS[0].nodes.forEach((node) => {
      node.children.forEach((childId) => {
        const child = LEVELS[0].nodes.find((n) => n.id === childId);
        if (child) networkLines.lineBetween(node.x, node.y, child.x, child.y);
      });
    });
    this.add.rectangle(512, 100, 400, 20, 0x000000).setStrokeStyle(1, 0x00ff00);
    this.progressFill = this.add.graphics();
    this.percentText = this.add
      .text(512, 130, "INFILTRATION: 0%", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#00ff00",
      })
      .setOrigin(0.5);

    this.timerText = this.add
      .text(900, 50, "TRACE: 60s", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff0000",
      })
      .setOrigin(0.5);
    this.scanline = this.add.graphics();
    this.scanline.fillStyle(0x00ff00, 0.1).fillRect(0, 0, 1024, 2);
    this.tweens.add({
      targets: this.scanline,
      y: 768,
      duration: 3000,
      loop: -1,
    });

    this.logText = this.add.text(20, 600, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#00ff00",
    });
    this.tree = new RuleTree(this);
    this.tree.render(LEVELS[0].nodes);
    this.firewalls = this.add.group({ runChildUpdate: true });

    this.events.on("node-corrupted", (node: any) => {
      this.addTerminalLog(`SUCCESS: ${node.text} COMPROMISED`);
      this.updateInfiltration(25);
      this.createExplosion(node.x, node.y);
    });

    this.events.on("node-unlocked", (node: any) => {
      this.addTerminalLog(`ACCESS GRANTED: ${node.text}`);

      const f1 = new Firewall(this, node.x, node.y, 65, 3.5);
      const f2 = new Firewall(this, node.x, node.y, 65, -3.5);

      this.firewalls.add(f1);
      this.firewalls.add(f2);
    });

    const root = LEVELS[0].nodes.find((n) => n.id === "root");
    if (root) {
      this.firewalls.add(new Firewall(this, root.x, root.y, 60, 2.5));
    }

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver) return;

      this.firewalls.getChildren().forEach((child) => {
        const firewall = child as Firewall;
        const dist = Phaser.Math.Distance.Between(
          pointer.x,
          pointer.y,
          firewall.x,
          firewall.y,
        );
        if (dist < 30) {
          this.handleSecurityAlert();
        }
      });
    });
  }

  private updateInfiltration(amount: number) {
    this.infiltrationPercent = Phaser.Math.Clamp(
      this.infiltrationPercent + amount,
      0,
      100,
    );
    this.progressFill.clear();
    this.progressFill.fillStyle(0x00ff00, 0.5);
    this.progressFill.fillRect(312, 90, 4 * this.infiltrationPercent, 20);
    this.percentText.setText(`INFILTRATION: ${this.infiltrationPercent}%`);

    if (this.infiltrationPercent >= 100) {
      this.isGameOver = true;
      this.addTerminalLog(">> CORE BYPASSED. YOU WIN.");
      this.cameras.main.flash(500, 0, 255, 0);
    }
  }

  private handleSecurityAlert() {
    this.updateInfiltration(-15);
    this.addTerminalLog("ALERT: PACKET INTERCEPTED! -15%");
    this.cameras.main.flash(150, 200, 0, 0);
    this.cameras.main.shake(200, 0.01);
  }

  private createExplosion(x: number, y: number) {
    const rect = this.add.graphics();
    rect.fillStyle(0x00ff00).fillRect(0, 0, 4, 4);
    rect.generateTexture("pixel", 4, 4);
    rect.destroy();

    const emitter = this.add.particles(x, y, "pixel", {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 0,
      quantity: 15,
    });
    this.time.delayedCall(100, () => emitter.stop());
  }

  private addTerminalLog(message: string) {
    this.logLines.push(`> ${message}`);
    if (this.logLines.length > 8) this.logLines.shift();
    this.logText.setText(this.logLines.join("\n"));
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.timeLeft -= delta / 1000;
    this.timerText.setText(`TRACE: ${Math.ceil(this.timeLeft)}s`);

    if (this.timeLeft <= 0) {
      this.isGameOver = true;
      this.addTerminalLog("CRITICAL: CONNECTION TRACED. GAME OVER.");
      this.cameras.main.shake(500, 0.02);
      this.cameras.main.fade(1000, 150, 0, 0);
    }

    this.firewalls.getChildren().forEach((child) => {
      (child as Firewall).update(time, delta);
    });
  }
}
