import * as Phaser from 'phaser';
import { Game } from './game/scenes/Game';

const config: any = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: true
        }
    },
    scene: [Game]
};

new Phaser.Game(config);
