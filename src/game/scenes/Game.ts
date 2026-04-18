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
  private conveyorSpeed: number = 1750;
  private spawnInterval: number = 1400;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.isGameOver = false;
    this.production = 0;
    this.combo = 0;
    this.overheatLevel = 0;
    this.conveyorSpeed = 1750;
    this.spawnInterval = 1400;
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
      speed: { min: 200, max: 450 },
      scale: { start: 1.4, end: 0 },
      lifespan: 680,
      quantity: 1,
      blendMode: Phaser.BlendModes.ADD,
      tint: 0x00ffcc
    }).setDepth(100);
  }

  private spawnPlayer() {
    this.player = new Player(this, 160, 380);
  }

  private setupUI() {
    this.productionText = this.add.text(40, 25, "PRODUCTION: 00000", {
      fontFamily: "monospace",
      fontSize: "27px",
      color: "#00ffcc"
    }).setShadow(2, 2, "#000", 5);

    this.comboText = this.add.text(40, 65, "COMBO: 0x", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffff00"
    }).setShadow(2, 2, "#000", 4);

    this.add.rectangle(512, 45, 420, 22, 0x330000).setStrokeStyle(3, 0xff4444);
    this.overheatBar = this.add.graphics();
  }

  private spawnInitialMachines() {
    this.spawnMachine();
    this.time.delayedCall(500, () => this.spawnMachine());
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
      delay: 260,
      callback: this.updateOverheat,
      callbackScope: this,
      loop: true
    });
  }

  private spawnMachine() {
    if (this.isGameOver) return;

    const x = 1100;
    const y = 355 + Phaser.Math.Between(-70, 70);

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
      duration: 6400,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
        this.increaseOverheat(14);
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
    const isCombo = now - this.lastRepairTime < 1800;

    if (isCombo) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastRepairTime = now;

    const comboBonus = this.combo * 40;
    this.production += 300 + comboBonus;

    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, '0')}`);
    this.comboText.setText(`COMBO: ${this.combo}x`);

    this.overheatLevel = Math.max(0, this.overheatLevel - 19);
    this.drawOverheatBar();

    this.cameras.main.flash(70, 160, 255, 180);
    this.repairEmitter.explode(35, x, y);

    if (this.combo >= 3) {
      this.cameras.main.shake(120, 0.006 * this.combo);
    }
  }

  private updateOverheat() {
    if (this.isGameOver) return;

    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + 0.85, 0, 100);
    this.drawOverheatBar();

    if (this.overheatLevel >= 100) {
      this.triggerGameOver();
    }

    this.increaseDifficulty();
  }

  private drawOverheatBar() {
    this.overheatBar.clear();
    this.overheatBar.fillStyle(0xff3366, 0.9);
    this.overheatBar.fillRect(304, 35, 4.1 * this.overheatLevel, 18);
  }

  private increaseOverheat(amount: number) {
    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + amount, 0, 100);
    this.drawOverheatBar();
  }

  private increaseDifficulty() {
    if (this.production > 2500) {
      this.conveyorSpeed = Phaser.Math.Clamp(this.conveyorSpeed - 6, 850, 1750);
      this.spawnInterval = Phaser.Math.Clamp(this.spawnInterval - 12, 650, 1400);
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.cameras.main.shake(1600, 0.025);

    this.add.text(512, 220, "FACTORY OVERHEATED", {
      fontFamily: "monospace",
      fontSize: "58px",
      color: "#ff0000",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(512, 300, `FINAL SCORE : ${this.production}`, {
      fontFamily: "monospace",
      fontSize: "34px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(512, 350, `BEST COMBO : ${this.combo}x`, {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffff00"
    }).setOrigin(0.5);

    this.time.delayedCall(3200, () => this.scene.restart());
  }

  update() {
    this.player.update();
  }
}
