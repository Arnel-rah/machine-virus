import * as Phaser from "phaser";
import { Firewall } from "../entities/Firewall";
import { Machine } from "../entities/Machine";
import { Player } from "../entities/Player";

const CHECKSUMS = [
  "0x8A2F", "SYN_ACK", "RTX_4090", "UDP_DROP", "IP_V6_ERR", "BUFFER_0",
  "FLUSH_CACHE", "CRC_32_BIT", "PKT_LOSS", "LATENCY", "BW_LIMIT", "DEADLOCK",
  "RACE_COND", "STACK_OVF", "NULL_PTR", "SEGFAULT", "HEAP_CORRUPT"
];

interface VirusObject extends Phaser.GameObjects.Arc {
  checksum?: string;
  corrupted?: boolean;
}

export class Game extends Phaser.Scene {
  private score: number = 0;
  private stability: number = 100;
  private isGameOver: boolean = false;
  private isPaused: boolean = false;
  private wave: number = 1;
  private comboCount: number = 0;
  private highScore: number = parseInt(localStorage.getItem("machineVirusHighScore") ?? "0");

  private signalStream!: Phaser.GameObjects.Graphics;
  private virusObjects: VirusObject[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private stabilityBar!: Phaser.GameObjects.Graphics;
  private stabilityText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private displayTarget!: Phaser.GameObjects.Text;
  private displayInput!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private scanlineEffect!: Phaser.GameObjects.Graphics;
  private glitchLayer!: Phaser.GameObjects.Graphics;

  private currentTargetText: string = "";
  private currentInputText: string = "";
  private spawnRate: number = 1200;
  private difficultyMultiplier: number = 1;

  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private player!: Player;
  private firewall!: Firewall;
  private machine!: Machine;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    this.initializeGame();
    this.setupAudio();
    this.setupVisuals();
    this.setupUI();
    this.setupEntities();
    this.startSignalFlow();
    this.setupInput();
    this.startSystems();
    this.playAmbientSound();
  }

  private initializeGame() {
    this.isGameOver = false;
    this.isPaused = false;
    this.stability = 100;
    this.score = 0;
    this.comboCount = 0;
    this.wave = 1;
    this.difficultyMultiplier = 1;
    this.currentTargetText = "";
    this.currentInputText = "";
    this.virusObjects = [];
  }

  private setupEntities() {
    this.firewall = new Firewall(this);
    this.player = new Player(this, 150, 384);
    this.machine = new Machine(this, 80, 384);
  }

  private setupAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn("Web Audio API indisponible");
    }
  }

  private setupVisuals() {
    this.cameras.main.setBackgroundColor("#000814");

    if (!this.textures.exists("pixel")) {
      const rect = this.make.graphics({ x: 0, y: 0 });
      rect.fillStyle(0xffffff).fillRect(0, 0, 2, 2);
      rect.generateTexture("pixel", 2, 2);
      rect.destroy();
    }

    this.particles = this.add.particles(0, 0, "pixel", {
      alpha: { start: 0.8, end: 0 },
      scale: { start: 2, end: 0.3 },
      speed: { min: 100, max: 300 },
      lifespan: 1000,
      emitting: false
    });

    this.scanlineEffect = this.add.graphics();
    this.drawScanlines();
    this.glitchLayer = this.add.graphics().setAlpha(0);
  }

  private drawScanlines() {
    this.scanlineEffect.clear();
    this.scanlineEffect.lineStyle(1, 0x00d4ff, 0.05);
    for (let y = 0; y < 768; y += 4) {
      this.scanlineEffect.lineBetween(0, y, 1024, y);
    }
  }

  private setupUI() {
    this.scoreText = this.add.text(30, 30, "INFECTED: 0%", { fontFamily: "monospace", fontSize: "28px", color: "#00d4ff", fontStyle: "bold" });
    this.waveText = this.add.text(1024 - 30, 30, "WAVE 1", { fontFamily: "monospace", fontSize: "24px", color: "#ff0066", fontStyle: "bold" }).setOrigin(1, 0);
    this.comboText = this.add.text(512, 30, "", { fontFamily: "monospace", fontSize: "24px", color: "#ffff00", fontStyle: "bold" }).setOrigin(0.5, 0).setAlpha(0);
    this.stabilityText = this.add.text(30, 75, "FIREWALL: 100%", { fontFamily: "monospace", fontSize: "20px", color: "#00ff00", fontStyle: "bold" });
    this.stabilityBar = this.add.graphics();
    this.displayTarget = this.add.text(512, 350, "", { fontFamily: "monospace", fontSize: "54px", color: "#333333", fontStyle: "bold" }).setOrigin(0.5).setAlpha(0.6);
    this.displayInput = this.add.text(512, 350, "", { fontFamily: "monospace", fontSize: "54px", color: "#00ff00", fontStyle: "bold" }).setOrigin(0.5);
    this.hintText = this.add.text(512, 450, "TYPE THE CODES TO QUARANTINE VIRUSES", { fontFamily: "monospace", fontSize: "16px", color: "#00d4ff" }).setOrigin(0.5).setAlpha(0.7);
  }

  private startSignalFlow() {
    this.signalStream = this.add.graphics();

    this.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 3000,
      repeat: -1,
      onUpdate: (tween) => {
        const offset = tween.getValue();
        if (offset === null) return;

        this.signalStream.clear();
        this.signalStream.lineStyle(3, 0x00d4ff, 0.2);
        this.signalStream.beginPath();
        for (let x = 0; x < 1024; x += 10) {
          const y = 384 + Math.sin((x + offset) * 0.02) * 20;
          if (x === 0) this.signalStream.moveTo(x, y);
          else this.signalStream.lineTo(x, y);
        }
        this.signalStream.strokePath();
      }
    });
  }

  private setupInput() {
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => this.handleTyping(e));
    this.input.keyboard?.on("keydown-R", () => { if (this.isGameOver) this.scene.restart(); });
    this.input.keyboard?.on("keydown-P", () => this.togglePause());
  }

  private startSystems() {
    this.time.addEvent({
      delay: this.spawnRate,
      callback: this.spawnVirus,
      callbackScope: this,
      loop: true
    });

    this.time.addEvent({
      delay: 15000,
      callback: this.advanceWave,
      callbackScope: this,
      loop: true
    });
  }

  private spawnVirus() {
    if (this.isGameOver || this.isPaused) return;

    const target = Phaser.Math.RND.pick(CHECKSUMS) ?? "ERROR";
    const y = 384 + Phaser.Math.Between(-150, 150);

    const virus = this.add.circle(1100, y, 18, 0xff0066) as VirusObject;
    this.physics.add.existing(virus);
    virus.checksum = target;
    this.virusObjects.push(virus);

    this.tweens.add({
      targets: virus,
      x: -50,
      duration: Math.max(2000, 5000 / this.difficultyMultiplier),
      onComplete: () => {
        if (virus.active) this.onVirusEscape(virus);
      }
    });

    if (this.currentTargetText === "") this.updateNextTarget();
  }

  private updateNextTarget() {
    if (this.virusObjects.length > 0) {
      this.currentTargetText = this.virusObjects[0].checksum ?? "";
      this.displayTarget.setText(this.currentTargetText);
    }
  }

  private onVirusEscape(virus: VirusObject) {
    this.stability = Math.max(0, this.stability - 15);
    this.firewall.takeDamage(15);
    this.comboCount = 0;

    const idx = this.virusObjects.indexOf(virus);
    if (idx !== -1) this.virusObjects.splice(idx, 1);

    virus.destroy();
    this.cameras.main.shake(150, 0.03);
    this.createGlitchEffect();
    this.playSynth(100, 0.2, 0.3, "square");

    if (this.currentTargetText === virus.checksum) {
      this.resetInput();
      this.updateNextTarget();
    }
  }

  private handleTyping(e: KeyboardEvent) {
    if (this.isGameOver || this.isPaused || this.currentTargetText === "") return;

    const char = e.key.toUpperCase();
    if (this.currentTargetText.startsWith(this.currentInputText + char)) {
      this.currentInputText += char;
      this.displayInput.setText(this.currentInputText);
      this.playSynth(400 + this.currentInputText.length * 50, 0.05, 0.1);

      if (this.currentInputText === this.currentTargetText) {
        this.resolveVirus();
      }
    } else {
      this.currentInputText = "";
      this.displayInput.setText("");
      this.playSynth(150, 0.1, 0.1, "sawtooth");
    }
  }

  private resolveVirus() {
    const virus = this.virusObjects.shift();
    if (virus) {
      this.particles.emitParticleAt(virus.x, virus.y, 30);
      this.playSynth(800, 0.1, 0.2, "sine", 100);
      virus.destroy();
    }

    this.comboCount++;
    this.score += Math.floor(10 * (1 + (this.comboCount - 1) * 0.2) * this.difficultyMultiplier);
    this.updateUI();
    this.resetInput();
    this.updateNextTarget();
  }

  private resetInput() {
    this.currentInputText = "";
    this.currentTargetText = "";
    this.displayInput.setText("");
    this.displayTarget.setText("");
  }

  private updateUI() {
    this.scoreText.setText(`INFECTED: ${Math.min(100, Math.floor(this.score / 10))}%`);
    if (this.comboCount > 1) {
      this.comboText.setText(`×${this.comboCount} COMBO`).setAlpha(1);
    }
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem("machineVirusHighScore", this.highScore.toString());
    }
  }

  private advanceWave() {
    if (this.isGameOver) return;
    this.wave++;
    this.difficultyMultiplier += 0.2;
    this.waveText.setText(`WAVE ${this.wave}`);
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) this.physics.pause();
    else this.physics.resume();
  }

  private createGlitchEffect() {
    this.glitchLayer.setAlpha(0.3).clear().fillStyle(0xff0066, 0.2);
    for (let i = 0; i < 5; i++) {
      this.glitchLayer.fillRect(Phaser.Math.Between(0, 1024), Phaser.Math.Between(0, 768), Phaser.Math.Between(50, 200), Phaser.Math.Between(2, 10));
    }
    this.time.delayedCall(100, () => this.glitchLayer.setAlpha(0));
  }

  private playSynth(freq: number, vol: number, dur: number, type: OscillatorType = "sine", endFreq?: number) {
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + dur);

    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + dur);
  }

  private playAmbientSound() {
    if (!this.audioContext) return;

    const osc = this.audioContext.createOscillator();
    const g = this.audioContext.createGain();

    osc.frequency.setValueAtTime(50, this.audioContext.currentTime);
    g.gain.setValueAtTime(0.01, this.audioContext.currentTime);

    osc.connect(g);
    g.connect(this.audioContext.destination);
    osc.start();
  }

  update() {
    if (this.isGameOver || this.isPaused) return;

    this.stabilityBar.clear();
    const color = this.stability > 50 ? 0x00ff00 : (this.stability > 25 ? 0xffaa00 : 0xff0066);
    this.stabilityBar.fillStyle(color, 1);
    this.stabilityBar.fillRect(30, 100, this.stability * 3.6, 12);
    this.stabilityText.setText(`FIREWALL: ${Math.ceil(this.stability)}%`);

    if (this.stability <= 0) {
      this.isGameOver = true;
      this.physics.pause();
      this.add.rectangle(512, 384, 1024, 768, 0x000000, 0.8);
      this.add.text(512, 384, "SYSTEM CRITICAL\nPRESS R TO REBOOT", {
        fontFamily: "monospace", fontSize: "42px", color: "#ff0066", align: "center"
      }).setOrigin(0.5);
    }
  }
}
