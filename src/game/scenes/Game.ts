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

  private timeLeft: number = 0;
  private timerText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private hasWon: boolean = false;

  private currentLevel: number = 0;
  private levelConfig: any;

  private corruptedNodes: Set<string> = new Set();
  private nodeHoldTimers: Map<string, number> = new Map();
  private requiredHoldTime: number = 2000; 

  private healthPoints: number = 100;
  private healthText!: Phaser.GameObjects.Text;

  private score: number = 0;
  private combo: number = 0;
  private lastSuccessTime: number = 0;

  constructor() {
    super("Game");
  }

  create() {
    this.isGameOver = false;
    this.hasWon = false;
    this.corruptedNodes.clear();
    this.nodeHoldTimers.clear();
    this.combo = 0;
    this.score = 0;
    this.healthPoints = 100;

    this.levelConfig = LEVELS[this.currentLevel];
    this.timeLeft = this.levelConfig.timeLimit || 90;
    this.infiltrationPercent = 0;
    this.requiredHoldTime = this.levelConfig.holdTime || 1500;

    this.cameras.main.setBackgroundColor("#050505");
    this.add.grid(512, 384, 1024, 768, 32, 32, 0x000000, 0, 0x00ff00, 0.05);

    const networkLines = this.add.graphics();
    networkLines.lineStyle(2, 0x00ff00, 0.2);
    this.levelConfig.nodes.forEach((node: any) => {
      node.children.forEach((childId: string) => {
        const child = this.levelConfig.nodes.find((n: any) => n.id === childId);
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
      .text(900, 50, `TRACE: ${Math.ceil(this.timeLeft)}s`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    this.healthText = this.add
      .text(100, 50, `HEALTH: ${this.healthPoints}%`, {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#00ff00",
      })
      .setOrigin(0.5);

    this.logText = this.add.text(20, 600, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#00ff00",
    });

    this.scanline = this.add.graphics();
    this.scanline.fillStyle(0x00ff00, 0.1).fillRect(0, 0, 1024, 2);
    this.tweens.add({
      targets: this.scanline,
      y: 768,
      duration: 3000,
      loop: -1,
    });

    this.tree = new RuleTree(this);
    this.tree.render(this.levelConfig.nodes);

    this.firewalls = this.add.group({ runChildUpdate: true });
    const root = this.levelConfig.nodes.find((n: any) => n.id === "root");
    if (root) {
      this.firewalls.add(
        new Firewall(this, root.x, root.y, 60, 3)
      );
    }

    this.events.on(
      "attempt-node-corruption",
      (data: { node: any; visual: Phaser.GameObjects.Arc }) => {
        if (this.isGameOver || this.hasWon) return;

        const nodeId = data.node.id;

        if (this.corruptedNodes.has(nodeId)) {
          this.addTerminalLog(`ERROR: ${data.node.text} ALREADY COMPROMISED`);
          return;
        }

        let intercepted = false;
        const pointer = this.input.activePointer;

        this.firewalls.getChildren().forEach((child) => {
          const firewall = child as Firewall;
          const dist = Phaser.Math.Distance.Between(
            pointer.x,
            pointer.y,
            firewall.x,
            firewall.y,
          );

          if (dist < 35) {
            intercepted = true;
          }
        });

        if (intercepted) {
          this.handleSecurityAlert();
        } else {
          this.startNodeHold(nodeId, data.node, data.visual);
        }
      },
    );

    this.events.on("node-corrupted", (node: any) => {
      this.addTerminalLog(`SUCCESS: ${node.text} COMPROMISED`);
      this.updateInfiltration(25);
      this.corruptedNodes.add(node.id);
      this.createExplosion(node.x, node.y);
      this.updateCombo();
    });

    this.events.on("node-unlocked", (node: any) => {
      this.addTerminalLog(`ACCESS GRANTED: ${node.text}`);
      this.createNewFirewalls(node);
    });
    this.addTerminalLog(`LEVEL ${this.currentLevel + 1}: ${this.levelConfig.name || 'INFILTRATION'}`);
  }

  private startNodeHold(nodeId: string, node: any, visual: Phaser.GameObjects.Arc) {
    const startTime = Date.now();
    const holdDuration = this.requiredHoldTime;

    const holdBar = this.add.graphics();
    holdBar.fillStyle(0x00ff00, 0.5);

    const checkHold = () => {
      if (this.corruptedNodes.has(nodeId) || this.isGameOver || this.hasWon) {
        holdBar.destroy();
        if (this.nodeHoldTimers.has(nodeId)) {
          clearInterval(this.nodeHoldTimers.get(nodeId));
          this.nodeHoldTimers.delete(nodeId);
        }
        return;
      }

      const pointer = this.input.activePointer;
      const dist = Phaser.Math.Distance.Between(
        pointer.x,
        pointer.y,
        node.x,
        node.y,
      );

      if (dist > 30) {
        holdBar.destroy();
        if (this.nodeHoldTimers.has(nodeId)) {
          clearInterval(this.nodeHoldTimers.get(nodeId));
          this.nodeHoldTimers.delete(nodeId);
        }
        this.addTerminalLog(`HOLD INTERRUPTED: ${node.text}`);
        return;
      }

      let intercepted = false;
      this.firewalls.getChildren().forEach((child) => {
        const firewall = child as Firewall;
        const fDist = Phaser.Math.Distance.Between(
          pointer.x,
          pointer.y,
          firewall.x,
          firewall.y,
        );
        if (fDist < 35) intercepted = true;
      });

      if (intercepted) {
        holdBar.destroy();
        if (this.nodeHoldTimers.has(nodeId)) {
          clearInterval(this.nodeHoldTimers.get(nodeId));
          this.nodeHoldTimers.delete(nodeId);
        }
        this.handleSecurityAlert();
        return;
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / holdDuration, 1);

      holdBar.clear();
      holdBar.fillStyle(0x00ff00, 0.3 + progress * 0.4);
      holdBar.fillCircle(node.x, node.y - 50, 15 * progress);

      if (elapsed >= holdDuration) {
        // Corruption réussie !
        holdBar.destroy();
        if (this.nodeHoldTimers.has(nodeId)) {
          clearInterval(this.nodeHoldTimers.get(nodeId));
          this.nodeHoldTimers.delete(nodeId);
        }
        this.tree.executeCorruption(node, visual);
      }
    };

    const intervalId = setInterval(checkHold, 16);
    this.nodeHoldTimers.set(nodeId, intervalId);
  }

  private updateCombo() {
    const now = Date.now();
    if (now - this.lastSuccessTime < 8000) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastSuccessTime = now;

    const comboBonus = (this.combo - 1) * 5;
    if (comboBonus > 0) {
      this.addTerminalLog(`COMBO x${this.combo}! +${comboBonus}% BONUS`);
      this.updateInfiltration(comboBonus);
    }
  }

  private createNewFirewalls(node: any) {
    const firewall1 = new Firewall(this, node.x, node.y, 65, 4.5);
    const firewall2 = new Firewall(this, node.x, node.y, 65, -4.5);
    this.firewalls.addMultiple([firewall1, firewall2]);
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
      this.winGame();
    }
  }

  private winGame() {
    this.hasWon = true;
    this.addTerminalLog(">> CORE BYPASSED. EXTRACTION COMPLETE.");
    this.cameras.main.flash(500, 0, 255, 0);

    this.time.delayedCall(2000, () => {
      this.currentLevel++;
      if (this.currentLevel < LEVELS.length) {
        this.addTerminalLog(`ADVANCING TO LEVEL ${this.currentLevel + 1}...`);
        this.time.delayedCall(1000, () => {
          this.scene.restart();
        });
      } else {
        this.addTerminalLog("MISSION ACCOMPLISHED. ALL NETWORKS COMPROMISED.");
        this.cameras.main.fade(2000, 0, 0, 0);
      }
    });
  }

  private handleSecurityAlert() {
    this.healthPoints = Math.max(0, this.healthPoints - 15);
    this.timeLeft -= 2;
    this.combo = 0;
    this.addTerminalLog("ALERT: PACKET INTERCEPTED! -15 HP");
    this.cameras.main.flash(150, 200, 0, 0);
    this.cameras.main.shake(200, 0.01);

    if (this.healthPoints <= 0) {
      this.loseGame();
    }
  }

  private loseGame() {
    this.isGameOver = true;
    this.addTerminalLog("CRITICAL: CONNECTION TRACED. SYSTEM COMPROMISED.");
    this.cameras.main.shake(500, 0.02);
    this.cameras.main.fade(1000, 150, 0, 0);

    this.time.delayedCall(1500, () => {
      this.scene.restart();
    });
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
      quantity: 15,
    });

    this.time.delayedCall(100, () => emitter.stop());
  }

  private addTerminalLog(message: string) {
    this.logLines.push(`> ${message}`);
    if (this.logLines.length > 8) this.logLines.shift();
    this.logText.setText(this.logLines.join("\n"));
  }

  private applySystemDefense() {
    if (this.infiltrationPercent > 70) {
      this.firewalls.getChildren().forEach((f) => {
        if (f instanceof Firewall) f.setSpeedMultiplier(1.8);
      });
    } else if (this.infiltrationPercent > 40) {
      this.firewalls.getChildren().forEach((f) => {
        if (f instanceof Firewall) f.setSpeedMultiplier(1.4);
      });
    }

    const hunter = this.firewalls.getFirstAlive() as Firewall;
    if (hunter && this.infiltrationPercent > 35) {
      this.physics.moveToObject(hunter, this.input.activePointer, 200);
      (hunter as Firewall).setFillStyle(0xff0000);
    }
  }

  update(time: number, delta: number) {
    if (this.isGameOver || this.hasWon) return;

    const alertMultiplier = 1 + this.infiltrationPercent / 100;
    this.timeLeft -= (delta / 1000) * alertMultiplier;

    this.timerText.setText(`TRACE: ${Math.ceil(this.timeLeft)}s`);
    this.healthText.setText(`HEALTH: ${this.healthPoints}%`);

    if (this.timeLeft <= 0) {
      this.loseGame();
      return;
    }

    if (this.timeLeft < 15) {
      this.cameras.main.shake(100, 0.002 * (15 / this.timeLeft));
    }

    this.firewalls.getChildren().forEach((child) => {
      (child as Firewall).update(time, delta);
    });

    this.applySystemDefense();
  }
}
