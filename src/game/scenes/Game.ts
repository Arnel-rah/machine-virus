import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Machine } from "../entities/Machine";

export class Game extends Phaser.Scene {
  private player!: Player;
  private machines: Machine[] = [];
  private production: number = 0;
  private productionText!: Phaser.GameObjects.Text;
  private combo: number = 0;
  private comboText!: Phaser.GameObjects.Text;
  private lastRepairTime: number = 0;

  private conveyor!: Phaser.GameObjects.TileSprite;
  private overheatLevel: number = 0;
  private overheatBar!: Phaser.GameObjects.Graphics;
  private isGameOver: boolean = false;

  private repairEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private conveyorSpeed: number = 1700;
  private spawnInterval: number = 1280;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.isGameOver = false;
    this.production = 0;
    this.combo = 0;
    this.overheatLevel = 0;
    this.conveyorSpeed = 1700;
    this.spawnInterval = 1280;
    this.lastRepairTime = 0;

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

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.checkMachineRepair(pointer);
    });
  }

  private createParticles() {
    this.repairEmitter = this.add.particles(0, 0, "pixel", {
      speed: { min: 280, max: 550 },
      scale: { start: 1.8, end: 0 },
      lifespan: 800,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x00ffcc
    }).setDepth(100);
  }

  private spawnPlayer() {
    this.player = new Player(this, 160, 380);
  }

  private setupUI() {
    this.productionText = this.add.text(40, 20, "PRODUCTION: 00000", {
      fontFamily: "monospace",
      fontSize: "30px",
      color: "#00ffcc"
    }).setShadow(3, 3, "#000", 8);

    this.comboText = this.add.text(40, 68, "COMBO: 0x", {
      fontFamily: "monospace",
      fontSize: "27px",
      color: "#ffff00"
    }).setShadow(3, 3, "#000", 6);

    this.add.rectangle(512, 48, 420, 28, 0x220000).setStrokeStyle(5, 0xff5555);
    this.overheatBar = this.add.graphics();
  }

  private spawnInitialMachines() {
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 300, () => this.spawnMachine());
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
      duration: 5950,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
        this.increaseOverheat(17);
      }
    });
  }

  private checkMachineRepair(pointer: Phaser.Input.Pointer) {
    for (let i = this.machines.length - 1; i >= 0; i--) {
      const machine = this.machines[i];
      const bounds = machine.getBounds();

      if (bounds.contains(pointer.x, pointer.y) && machine.isRepairable()) {
        machine.repair();
        this.repairSuccess(pointer.x, pointer.y);
        break;
      }
    }
  }

  private repairSuccess(x: number, y: number) {
    const now = Date.now();
    const isCombo = now - this.lastRepairTime < 1450;

    if (isCombo) {
      this.combo = Math.min(this.combo + 1, 18);
    } else {
      this.combo = 1;
    }
    this.lastRepairTime = now;

    const comboBonus = Math.floor(this.combo * 58);
    this.production += 330 + comboBonus;

    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, '0')}`);
    this.comboText.setText(`COMBO: ${this.combo}x`);

    this.overheatLevel = Math.max(0, this.overheatLevel - 24);
    this.drawOverheatBar();

    this.cameras.main.flash(55, 220, 255, 240);
    this.repairEmitter.explode(40 + this.combo * 2, x, y);

    if (this.combo >= 7) {
      this.cameras.main.shake(180, 0.01 * Math.min(this.combo, 12));
    }
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
    if (this.production > 3200) {
      this.conveyorSpeed = Phaser.Math.Clamp(this.conveyorSpeed - 11, 750, 1700);
      this.spawnInterval = Phaser.Math.Clamp(this.spawnInterval - 22, 550, 1280);
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.cameras.main.shake(2200, 0.032);

    this.add.text(512, 195, "CRITICAL OVERHEAT", {
      fontFamily: "monospace",
      fontSize: "70px",
      color: "#ff0000",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(512, 290, `FINAL PRODUCTION : ${this.production}`, {
      fontFamily: "monospace",
      fontSize: "40px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(512, 345, `MAX COMBO : ${this.combo}x`, {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#ffff00"
    }).setOrigin(0.5);

    this.time.delayedCall(3600, () => this.scene.restart());
  }

  update() {
    this.player.update();
  }
}
