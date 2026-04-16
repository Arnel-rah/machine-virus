import * as Phaser from "phaser";
import { GameNode } from "../data/levels";

export class RuleTree {
  private scene: Phaser.Scene;
  private nodesMap: Map<string, GameNode> = new Map();
  private visualsMap: Map<string, Phaser.GameObjects.Arc> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(nodes: GameNode[]) {
    nodes.forEach((node) => {
      this.nodesMap.set(node.id, node);

      const color = node.status === "CORRUPTED" ? 0xff0000 :
                    node.status === "VULNERABLE" ? 0x00ff00 : 0x444444;

      const circle = this.scene.add.circle(node.x, node.y, 25, color)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xffffff)
        .setDepth(2);

      this.visualsMap.set(node.id, circle);
      if (node.status === "VULNERABLE") this.addGlitchEffect(circle);

      this.scene.add.text(node.x, node.y + 45, node.text, {
          fontSize: "12px", fontFamily: "monospace", color: "#00ff00",
          backgroundColor: "#000000bb", padding: { x: 4, y: 2 }
      }).setOrigin(0.5).setDepth(3);
      circle.on("pointerdown", () => {
          this.scene.events.emit('attempt-node-corruption', { node, visual: circle });
      });
    });
  }

  public executeCorruption(node: GameNode, visual: Phaser.GameObjects.Arc) {
    if (node.status !== "VULNERABLE") return;

    node.status = "CORRUPTED";
    visual.setFillStyle(0xff0000);
    this.scene.tweens.killTweensOf(visual);
    visual.setAlpha(1);

    this.scene.events.emit("node-corrupted", node);

    node.children.forEach((childId) => {
      const childNode = this.nodesMap.get(childId);
      const childVisual = this.visualsMap.get(childId);

      if (childNode && childNode.status === "PROTECTED") {
        childNode.status = "VULNERABLE";
        if (childVisual) {
          childVisual.setFillStyle(0x00ff00);
          this.addGlitchEffect(childVisual);
          this.scene.events.emit("node-unlocked", childNode);
        }
      }
    });
  }

  private addGlitchEffect(target: Phaser.GameObjects.Arc) {
    this.scene.tweens.add({
      targets: target, alpha: 0.4, duration: 250, yoyo: true, repeat: -1, ease: 'Cubic.easeInOut'
    });
  }
}
