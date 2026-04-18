import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Machine } from "../entities/Machine";

export class Game extends Phaser.Scene {
  private player!: Player;
  private machines: Machine[] = [];
  private production: number = 0;
  private productionText!: Phaser.GameObjects.Text;
  private conveyor!: Phaser.GameObjects.TileSprite;
  private overheatLevel: number = 0;
  private overheatBar!: Phaser.GameObjects.Graphics;
  private isGameOver: boolean = false;
  private repairEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  private conveyorSpeed: number = 1700;
  private spawnInterval: number = 1450;
  private baseOverheatRate: number = 0.75;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.isGameOver = false;
    this.production = 0;
    this.overheatLevel = 0;
    this.conveyorSpeed = 1700;
    this.spawnInterval = 1450;

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
      speed: { min: 180, max: 420 },
      scale: { start: 1.4, end: 0 },
      lifespan: 650,
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

    this.add.rectangle(512, 45, 420, 22, 0x330000).setStrokeStyle(3, 0xff4444);
    this.overheatBar = this.add.graphics();
  }

  private spawnInitialMachines() {
    this.spawnMachine();
    this.time.delayedCall(600, () => this.spawnMachine());
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
      delay: 280,
      callback: this.updateOverheat,
      callbackScope: this,
      loop: true
    });
  }

  private spawnMachine() {
    if (this.isGameOver) return;

    const x = 1100;
    const y = 355 + Phaser.Math.Between(-65, 65);

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
      duration: 6500,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
        this.increaseOverheat(12);        // Plus de pénalité
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
    this.production += 340;
    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, '0')}`);

    this.overheatLevel = Math.max(0, this.overheatLevel - 18);   // Réparation plus efficace
    this.drawOverheatBar();

    this.cameras.main.flash(80, 140, 255, 160);
    this.repairEmitter.explode(32, x, y);
  }

  private updateOverheat() {
    if (this.isGameOver) return;

    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + this.baseOverheatRate, 0, 100);
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
    if (this.production > 2000) {
      this.conveyorSpeed = Phaser.Math.Clamp(this.conveyorSpeed - 4, 900, 1700);
      this.spawnInterval = Phaser.Math.Clamp(this.spawnInterval - 8, 700, 1450);
      this.baseOverheatRate = Phaser.Math.Clamp(this.baseOverheatRate + 0.015, 0.75, 1.8);
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.cameras.main.shake(1600, 0.022);

    this.add.text(512, 230, "FACTORY OVERHEATED", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#ff0000",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(512, 310, `FINAL PRODUCTION : ${this.production}`, {
      fontFamily: "monospace",
      fontSize: "32px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.time.delayedCall(2800, () => this.scene.restart());
  }

  update() {
    this.player.update();
  }
}
