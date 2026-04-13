import Phaser from 'phaser';

export class RuleTree {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    render(nodes: any[]) {
        nodes.forEach(node => {
            const color = node.status === 'CORRUPTED' ? 0xff0000 : (node.status === 'VULNERABLE' ? 0x00ff00 : 0x444444);

            // Le "Cœur" de la règle
            const circle = this.scene.add.circle(node.x, node.y, 25, color)
                .setInteractive({ useHandCursor: true })
                .setStrokeStyle(2, 0xffffff);

            // Effet de glitch permanent si vulnérable
            if (node.status === 'VULNERABLE') {
                this.scene.tweens.add({
                    targets: circle,
                    alpha: 0.6,
                    duration: 200,
                    yoyo: true,
                    repeat: -1
                });
            }

            this.scene.add.text(node.x, node.y + 40, node.text, {
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#00ff00',
                backgroundColor: '#000000bb'
            }).setOrigin(0.5);

            circle.on('pointerdown', () => this.corruptNode(node, circle));
        });
    }

    private corruptNode(node: any, visual: Phaser.GameObjects.Arc) {
        if (node.status !== 'VULNERABLE') return;

        node.status = 'CORRUPTED';
        visual.setFillStyle(0xff0000);
        this.scene.cameras.main.shake(250, 0.01);

        console.log(`System Breach: ${node.text} compromised.`);
    }
}
