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

    // Nouvelles variables de progression
    private infiltrationPercent: number = 0;
    private progressFill!: Phaser.GameObjects.Graphics;
    private percentText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor('#050505');
        this.add.grid(512, 384, 1024, 768, 32, 32, 0x000000, 0, 0x00ff00, 0.05);

        const networkLines = this.add.graphics();
        networkLines.lineStyle(2, 0x00ff00, 0.2);
        LEVELS[0].nodes.forEach(node => {
            node.children.forEach(childId => {
                const child = LEVELS[0].nodes.find(n => n.id === childId);
                if (child) {
                    networkLines.lineBetween(node.x, node.y, child.x, child.y);
                }
            });
        });

        this.add.rectangle(512, 100, 400, 20, 0x000000).setStrokeStyle(1, 0x00ff00);
        this.progressFill = this.add.graphics();
        this.percentText = this.add.text(512, 130, "INFILTRATION: 0%", {
            fontFamily: 'monospace', fontSize: '18px', color: '#00ff00'
        }).setOrigin(0.5);
        this.scanline = this.add.graphics();
        this.scanline.fillStyle(0x00ff00, 0.1).fillRect(0, 0, 1024, 2);
        this.tweens.add({ targets: this.scanline, y: 768, duration: 3000, loop: -1 });
        this.add.text(512, 30, "/// SYSTEM INFILTRATION ///", {
            fontFamily: 'monospace', fontSize: '24px', color: '#00ff00'
        }).setOrigin(0.5);

        this.logText = this.add.text(20, 600, "", {
            fontFamily: 'monospace', fontSize: '14px', color: '#00ff00'
        });

        this.tree = new RuleTree(this);
        this.tree.render(LEVELS[0].nodes);
        this.firewalls = this.add.group({ runChildUpdate: true });
        this.events.on('node-corrupted', (node: any) => {
            this.addTerminalLog(`SUCCESS: ${node.text} COMPROMISED`);
            this.updateInfiltration(25);
        });

        this.events.on('node-unlocked', (node: any) => {
            this.addTerminalLog(`ACCESS GRANTED: ${node.text}`);
        });

        this.addTerminalLog("CONNECTION ESTABLISHED...");
        this.addTerminalLog("READY TO BYPASS...");
    }

    private updateInfiltration(amount: number) {
        this.infiltrationPercent = Math.min(this.infiltrationPercent + amount, 100);
        this.progressFill.clear();
        this.progressFill.fillStyle(0x00ff00, 0.5);
        this.progressFill.fillRect(312, 90, 4 * this.infiltrationPercent, 20);
        this.percentText.setText(`INFILTRATION: ${this.infiltrationPercent}%`);

        if (this.infiltrationPercent >= 100) {
            this.addTerminalLog("CRITICAL: SYSTEM FULLY CORRUPTED.");
            this.cameras.main.flash(500, 0, 255, 0);
        }
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
