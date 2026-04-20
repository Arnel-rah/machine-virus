import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Machine } from "../entities/Machine";

const TYPING_PHRASES = [
  "FIX CORE",
  "REBOOT NODE",
  "BYPASS FIREWALL",
  "RESTORE POWER",
  "CLEAR CACHE",
  "DEBUG MODE",
  "INIT SYSTEM",
  "PATCH VULN",
  "OVERCLOCK OK",
  "SYNC DATA"
];

export class Game extends Phaser.Scene {
  private player!: Player;
  private machines: Machine[] = [];
  private production: number = 0;
  private productionText!: Phaser.GameObjects.Text;
  private combo: number = 0;
  private comboText!: Phaser.GameObjects.Text;

  private conveyor!: Phaser.GameObjects.TileSprite;
  private overheatLevel: number = 0;
  private overheatBar!: Phaser.GameObjects.Graphics;
  private isGameOver: boolean = false;

  private repairEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private currentTypingTarget: string = "";
  private currentTyped: string = "";
  private typingText!: Phaser.GameObjects.Text;
  private typingPrompt!: Phaser.GameObjects.Text;

  private lastRepairTime: number = 0;
  private currentLevel: number = 1;
  private conveyorSpeed: number = 1720;
  private spawnInterval: number = 1300;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.isGameOver = false;
    this.production = 0;
    this.combo = 0;
    this.overheatLevel = 0;
    this.currentTyped = "";
    this.currentTypingTarget = "";
    this.lastRepairTime = 0;

    this.applyLevelSettings();

    this.add.image(512, 288, "background");
    this.conveyor = this.add.tileSprite(512, 460, 1024, 160, "conveyor");
    this.add.rectangle(512, 520, 1024, 90, 0x1f1f2e);

    this.createParticles();
    this.spawnPlayer();
    this.setupUI();
    this.spawnInitialMachines();

    this.animateConveyor();
    this.startSpawning();
    this.startOverheatTimer();

    // Correction importante : écoute clavier
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      this.handleKeyInput(event);
    });
  }

  private applyLevelSettings() {
    if (this.currentLevel === 1) {
      this.conveyorSpeed = 1720;
      this.spawnInterval = 1300;
    } else if (this.currentLevel === 2) {
      this.conveyorSpeed = 1250;
      this.spawnInterval = 950;
    } else if (this.currentLevel === 3) {
      this.conveyorSpeed = 950;
      this.spawnInterval = 680;
    }
  }

  private createParticles() {
    this.repairEmitter = this.add.particles(0, 0, "pixel", {
      speed: { min: 280, max: 580 },
      scale: { start: 1.7, end: 0 },
      lifespan: 780,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x00ffcc
    }).setDepth(100);
  }

  private spawnPlayer() {
    this.player = new Player(this, 160, 380);
  }

  private setupUI() {
    this.add.text(40, 12, `LEVEL ${this.currentLevel}`, {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#00aaff"
    });

    this.productionText = this.add.text(40, 38, "PRODUCTION: 00000", {
      fontFamily: "monospace",
      fontSize: "29px",
      color: "#00ffcc"
    }).setShadow(3, 3, "#000", 8);

    this.comboText = this.add.text(40, 78, "COMBO: 0x", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffff00"
    }).setShadow(3, 3, "#000", 6);

    this.add.rectangle(512, 48, 420, 26, 0x220000).setStrokeStyle(5, 0xff5555);
    this.overheatBar = this.add.graphics();

    this.typingPrompt = this.add.text(512, 180, "", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#00ffaa"
    }).setOrigin(0.5);

    this.typingText = this.add.text(512, 220, "", {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);
  }

  private spawnInitialMachines() {
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 400, () => this.spawnMachine());
    }
  }

  private animateConveyor() {
    this.tweens.add({
      targets: this.conveyor,
      tilePositionX: -400,
      duration: this.conveyorSpeed,
      repeat: -1,
      ease: "Linear"
    });
  }

  private startSpawning() {
    this.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnMachine,
      callbackScope: this,
      loop: true
    });
  }

  private startOverheatTimer() {
    this.time.addEvent({
      delay: 230,
      callback: this.updateOverheat,
      callbackScope: this,
      loop: true
    });
  }

  private spawnMachine() {
    if (this.isGameOver) return;

    const x = 1100;
    const y = 355 + Phaser.Math.Between(-85, 85);

    const machine = new Machine(this, {
      type: Phaser.Math.RND.pick(["gear", "piston", "belt"]),
      x,
      y,
      broken: true
    });

    this.machines.push(machine);

    this.tweens.add({
      targets: machine,
      x: -180,
      duration: 6100,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
        this.increaseOverheat(15);
      }
    });
  }

  private checkMachineRepair(pointer: Phaser.Input.Pointer) {
    for (let i = this.machines.length - 1; i >= 0; i--) {
      const machine = this.machines[i];
      const bounds = machine.getBounds();

      if (bounds.contains(pointer.x, pointer.y) && machine.isRepairable() && !this.currentTypingTarget) {
        this.startTypingMode(machine);
        break;
      }
    }
  }

  private startTypingMode(machine: Machine) {
    this.currentTypingTarget = Phaser.Math.RND.pick(TYPING_PHRASES);
    this.currentTyped = "";

    this.typingPrompt.setText("TYPE TO REPAIR:");
    this.typingText.setText(this.currentTypingTarget);
    this.typingText.setColor("#ffffff");

    (machine as any).pendingRepair = true;
  }

  private handleKeyInput(event: KeyboardEvent) {
    if (!this.currentTypingTarget || this.isGameOver) return;

    const key = event.key.toUpperCase();

    if (key === "BACKSPACE") {
      this.currentTyped = this.currentTyped.slice(0, -1);
    }
    else if (key.length === 1 && /[A-Z0-9 ]/.test(key)) {
      this.currentTyped += key;
    }

    this.typingText.setText(this.currentTyped);

    if (this.currentTyped === this.currentTypingTarget) {
      this.completeRepair();
    }
    else if (!this.currentTypingTarget.startsWith(this.currentTyped)) {
      this.typingText.setColor("#ff6666");
      this.time.delayedCall(180, () => {
        if (this.currentTypingTarget) this.typingText.setColor("#ffffff");
      });
    }
  }

  private completeRepair() {
    const machine = this.machines.find(m => (m as any).pendingRepair);
    if (machine) {
      machine.repair();
      (machine as any).pendingRepair = false;
    }

    this.repairSuccess();

    this.currentTypingTarget = "";
    this.currentTyped = "";
    this.typingPrompt.setText("");
    this.typingText.setText("");
  }

  private repairSuccess() {
    const now = Date.now();
    const isCombo = now - this.lastRepairTime < 1600;

    if (isCombo) {
      this.combo = Math.min(this.combo + 1, 20);
    } else {
      this.combo = 1;
    }
    this.lastRepairTime = now;

    const comboBonus = Math.floor(this.combo * 60);
    this.production += 340 + comboBonus;

    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, '0')}`);
    this.comboText.setText(`COMBO: ${this.combo}x`);

    this.overheatLevel = Math.max(0, this.overheatLevel - 26);
    this.drawOverheatBar();

    this.cameras.main.flash(70, 230, 255, 250);
    this.repairEmitter.explode(45 + this.combo * 2, 512, 300);
  }

  private updateOverheat() {
    if (this.isGameOver) return;

    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + 1.0, 0, 100);
    this.drawOverheatBar();

    if (this.overheatLevel >= 100) {
      this.triggerGameOver();
    }

    this.increaseDifficulty();
  }

  private drawOverheatBar() {
    this.overheatBar.clear();
    this.overheatBar.fillStyle(0xff3366, 0.95);
    this.overheatBar.fillRect(304, 36, 4.18 * this.overheatLevel, 24);
  }

  private increaseOverheat(amount: number) {
    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + amount, 0, 100);
    this.drawOverheatBar();
  }

  private increaseDifficulty() {
    if (this.production > 4000) {
      this.conveyorSpeed = Phaser.Math.Clamp(this.conveyorSpeed - 14, 700, 1700);
      this.spawnInterval = Phaser.Math.Clamp(this.spawnInterval - 28, 500, 1280);
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.cameras.main.shake(2200, 0.035);

    this.add.text(512, 200, "CRITICAL OVERHEAT", {
      fontFamily: "monospace",
      fontSize: "70px",
      color: "#ff0000"
    }).setOrigin(0.5);

    this.add.text(512, 290, `FINAL PRODUCTION : ${this.production}`, {
      fontFamily: "monospace",
      fontSize: "40px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.time.delayedCall(3500, () => this.scene.restart());
  }

  update() {
    this.player.update();
  }
}
