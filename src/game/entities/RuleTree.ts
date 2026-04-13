import Phaser from 'phaser';

export interface RuleNode {
    id: string;
    text: string;
    status: 'PROTECTED' | 'VULNERABLE' | 'CORRUPTED';
    x: number;
    y: number;
    children: string[];
}

export class RuleTree {
    private scene: Phaser.Scene;
    private nodes: Map<string, RuleNode> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    addRule(node: RuleNode) {
        this.nodes.set(node.id, node);
        this.renderNode(node);
    }

    private renderNode(node: RuleNode) {
        const color = node.status === 'CORRUPTED' ? 0xff0000 : 0x00ff00;
        const circle = this.scene.add.circle(node.x, node.y, 20, color)
            .setInteractive({ useHandCursor: true });
        this.scene.add.text(node.x, node.y + 30, node.text, {
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        circle.on('pointerdown', () => {
            this.scene.events.emit('node-clicked', node);
        });
    }
}
