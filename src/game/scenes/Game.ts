import * as Phaser from "phaser";
import { Player } from "../entities/Player";
import { Machine } from "../entities/Machine";

export class Game extends Phaser.Scene {
  private player!: Player;
  private machines: Machine[] = [];
  private conveyorSpeed: number = 180;
  private production: number = 0;
  private productionText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.cameras.main.setBackgroundColor("#1a1a2e");

    this.createConveyorBackground();
    this.spawnPlayer();
    this.spawnInitialMachines();

    this.setupUI();
    this.setupInput();

    this.time.addEvent({
      delay: 2200,
      callback: this.spawnMachine,
      callbackScope: this,
      loop: true,
    });
  }

  private createConveyorBackground() {

    const conveyor = this.add.tileSprite(512, 480, 1024, 120, "conveyor");
    this.tweens.add({
      targets: conveyor,
      tilePositionX: -400,
      duration: 2800,
      repeat: -1,
      ease: "Linear",
    });

    this.add.rectangle(512, 520, 1024, 60, 0x333344);
  }

  private spawnPlayer() {
    this.player = new Player(this, 180, 400);
  }

  private spawnInitialMachines() {
    this.spawnMachine();
    this.time.delayedCall(800, () => this.spawnMachine());
  }

  private spawnMachine() {
    const x = 1100 + Phaser.Math.Between(-40, 80);
    const y = 380 + Phaser.Math.Between(-30, 40);

    const machine = new Machine(this, {
      type: Phaser.Math.RND.pick(["gear", "piston", "belt"]),
      x,
      y,
      broken: true,
    });

    this.machines.push(machine);
    this.tweens.add({
      targets: machine,
      x: -150,
      duration: 6200,
      ease: "Linear",
      onComplete: () => {
        const index = this.machines.indexOf(machine);
        if (index > -1) this.machines.splice(index, 1);
        machine.destroy();
      },
    });
  }

  private setupUI() {
    this.productionText = this.add.text(40, 30, "PRODUCTION: 00000", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#00ffcc",
    });

    this.add.text(40, 70, "REPAIR THE MACHINES BEFORE THEY PASS!", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#ff9966",
    });
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.checkMachineRepair(pointer);
    });
  }

  private checkMachineRepair(pointer: Phaser.Input.Pointer) {
    for (let i = this.machines.length - 1; i >= 0; i--) {
      const machine = this.machines[i];
      const bounds = machine.getBounds();

      if (bounds.contains(pointer.x, pointer.y) && machine.isRepairable()) {
        machine.repair();
        this.production += 250;
        this.updateProductionUI();

        this.cameras.main.flash(80, 100, 255, 180);
        break;
      }
    }
  }

  private updateProductionUI() {
    this.productionText.setText(`PRODUCTION: ${this.production.toString().padStart(5, "0")}`);
  }

  update() {
    this.player.update();

    if (this.production > 3000) this.conveyorSpeed = 240;
  }
}
