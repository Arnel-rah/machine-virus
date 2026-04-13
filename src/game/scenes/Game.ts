import * as Phaser from 'phaser';
import { RuleTree } from '../entities/RuleTree';
import { Firewall } from '../entities/Firewall';
import { LEVELS } from '../data/levels';

export class Game extends Phaser.Scene {
    private tree!: RuleTree;
    private firewalls!: Phaser.GameObjects.Group;
    private logLines: string[] = [];
    private logText!: Phaser.GameObjects.Text;
    private scanline!: Phaser.GameObjects.Graphics;

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor('#050505');
        this.add.grid(512, 384, 1024, 768, 32, 32, 0x000000, 0, 0x00ff00, 0.05);

        this.scanline = this.add.graphics();
        this.scanline.fillStyle(0x00ff00, 0.1);
        this.scanline.fillRect(0, 0, 1024, 2);

        this.tweens.add({
            targets: this.scanline,
            y: 768,
            duration: 3000,
            loop: -1
        });

        this.add.text(512, 30, "/// SYSTEM INFILTRATION ///", {
            fontFamily: 'monospace', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5);

        this.logText = this.add.text(20, 600, "", {
            fontFamily: 'monospace', fontSize: '14px', color: '#00ff00'
        });

        this.tree = new RuleTree(this);
        this.tree.render(LEVELS[0].nodes);
        this.firewalls = this.add.group({ runChildUpdate: true });

        LEVELS[0].nodes.forEach(node => {
            if (node.status === 'VULNERABLE') {
                const sentry = new Firewall(this, node.x, node.y, 60, 2);
                this.firewalls.add(sentry);
            }
        });

        this.addTerminalLog("CONNECTION ESTABLISHED...");
        this.addTerminalLog("BYPASSING ENCRYPTION...");

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.firewalls.getChildren().forEach((child) => {
                const firewall = child as Firewall;
                const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, firewall.x, firewall.y);
                if (dist < 20) {
                    this.handleSecurityAlert();
                }
            });
        });
    }

    private addTerminalLog(message: string) {
        this.logLines.push(`> ${message}`);
        if (this.logLines.length > 8) this.logLines.shift();
        this.logText.setText(this.logLines.join('\n'));
    }

    private handleSecurityAlert() {
        this.addTerminalLog("ALERT: FIREWALL COLLISION DETECTED!");
        this.cameras.main.flash(100, 150, 0, 0);
        this.cameras.main.shake(150, 0.005);
    }

    update(time: number, delta: number) {
        this.firewalls.getChildren().forEach(child => {
            (child as Firewall).update(time, delta);
        });
    }
}
