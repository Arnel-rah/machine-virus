import * as Phaser from 'phaser';
import { RuleTree } from '../entities/RuleTree';
import { Firewall } from '../entities/Firewall';
import { LEVELS } from '../data/levels';

export class Game extends Phaser.Scene {
    private tree!: RuleTree;
    private firewalls!: Phaser.GameObjects.Group;

    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.setBackgroundColor('#050505');

        this.add.text(512, 30, "/// SYSTEM INFILTRATION ///", {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#00ff00'
        }).setOrigin(0.5);

        this.tree = new RuleTree(this);
        this.tree.render(LEVELS[0].nodes);

        this.firewalls = this.add.group({ runChildUpdate: true });

        LEVELS[0].nodes.forEach(node => {
            if (node.status === 'VULNERABLE') {
                const sentry = new Firewall(this, node.x, node.y, 60, 2);
                this.firewalls.add(sentry);
            }
        });

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

    private handleSecurityAlert() {
        this.cameras.main.flash(100, 150, 0, 0);
        this.cameras.main.shake(150, 0.005);
    }

    update(time: number, delta: number) {
        this.firewalls.getChildren().forEach(child => {
            (child as Firewall).update(time, delta);
        });
    }
}
