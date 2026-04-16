import * as Phaser from "phaser";

export class RuleTree {
  private scene: Phaser.Scene;
  private nodesMap: Map<string, any> = new Map();
  private visualsMap: Map<string, Phaser.GameObjects.Arc> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  render(nodes: any[]) {
    nodes.forEach((node) => {
      this.nodesMap.set(node.id, node);

      const color =
        node.status === "CORRUPTED"
          ? 0xff0000
          : node.status === "VULNERABLE"
            ? 0x00ff00
            : 0x444444;

      const circle = this.scene.add
        .circle(node.x, node.y, 25, color)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xffffff);

      this.visualsMap.set(node.id, circle);

      if (node.status === "VULNERABLE") {
        this.addGlitchEffect(circle);
      }

      this.scene.add
        .text(node.x, node.y + 40, node.text, {
          fontSize: "14px",
          fontFamily: "monospace",
          color: "#00ff00",
          backgroundColor: "#000000bb",
        })
        .setOrigin(0.5);

      circle.on("pointerdown", () => this.corruptNode(node, circle));
    });
  }

  private addGlitchEffect(target: Phaser.GameObjects.Arc) {
    this.scene.tweens.add({
      targets: target,
      alpha: 0.5,
      duration: 200,
      yoyo: true,
      repeat: -1,
    });
  }

  private corruptNode(node: any, visual: Phaser.GameObjects.Arc) {
    if (node.status !== "VULNERABLE") return;
    node.status = "CORRUPTED";

    visual.setFillStyle(0xff0000);
    this.scene.tweens.killTweensOf(visual);
    visual.setAlpha(1);
    this.scene.events.emit("node-corrupted", node);
    node.children.forEach((childId: string) => {
        const childNode = this.nodesMap.get(childId);
        const childVisual = this.visualsMap.get(childId);

        if (childNode && childNode.status === "PROTECTED") {
            childNode.status = "VULNERABLE";
            if (childVisual) {
                childVisual.setFillStyle(0x00ff00);
                this.addGlitchEffect(childVisual);
            }
        }
    });
}
}
