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

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.isGameOver = false;
    this.production = 0;
    this.overheatLevel = 0;

    this.add.image(512, 288, "background");
    this.conveyor = this.add.tileSprite(512, 460, 1024, 160, "conveyor");
    this.add.rectangle(512, 520, 1024, 90, 0x1f1f2e);

    this.createParticles();
    this.spawnPlayer();
    this.setupUI();
    this.spawnInitialMachines();

    this.tweens.add({
      targets: this.conveyor,
      tilePositionX: -400,
      duration: 1800,
      repeat: -1,
      ease: "Linear"
    });

    this.time.addEvent({
      delay: 1600,
      callback: this.spawnMachine,
      callbackScope: this,
      loop: true
    });

    this.time.addEvent({
      delay: 300,
      callback: this.updateOverheat,
      callbackScope: this,
      loop: true
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.checkMachineRepair(pointer);
    });
  }

  private createParticles() {
    this.repairEmitter = this.add.particles(0, 0, "pixel", {
      speed: { min: 100, max: 300 },
      scale: { start: 1, end: 0 },
      lifespan: 600,
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
    this.time.delayedCall(700, () => this.spawnMachine());
  }

  private spawnMachine() {
    if (this.isGameOver) return;

    const x = 1100;
    const y = 355 + Phaser.Math.Between(-55, 55);

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
      duration: 6800,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
        this.increaseOverheat(8);
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
    this.production += 320;
    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, '0')}`);

    this.overheatLevel = Math.max(0, this.overheatLevel - 14);
    this.drawOverheatBar();

    this.cameras.main.flash(90, 120, 255, 140);

    // Particules d'étincelles
    this.repairEmitter.explode(25, x, y);
  }

  private updateOverheat() {
    if (this.isGameOver) return;

    this.overheatLevel = Phaser.Math.Clamp(this.overheatLevel + 0.6, 0, 100);
    this.drawOverheatBar();

    if (this.overheatLevel >= 100) {
      this.triggerGameOver();
    }
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

  private triggerGameOver() {
    this.isGameOver = true;
    this.cameras.main.shake(1200, 0.015);

    this.add.text(512, 260, "OVERHEAT CRITICAL\nFACTORY EXPLOSION", {
      fontFamily: "monospace",
      fontSize: "48px",
      color: "#ff0000",
      align: "center"
    }).setOrigin(0.5);

    this.time.delayedCall(2500, () => {
      this.scene.restart();
    });
  }

  update() {
    this.player.update();
  }
}
