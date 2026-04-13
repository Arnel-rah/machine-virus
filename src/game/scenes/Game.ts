import { Scene } from 'phaser';
import { RuleTree } from '../entities/RuleTree';
import { LEVELS } from '../data/levels';

export class Game extends Scene {
    private tree!: RuleTree;

    constructor() {
        super('Game');
    }

    create() {
        this.add.text(512, 50, "/// INFILTRATION EN COURS ///", {
            fontFamily: 'monospace', fontSize: '20px', color: '#00ff00'
        }).setOrigin(0.5);

        this.tree = new RuleTree(this);
        this.tree.render(LEVELS[0].nodes);
    }
}
