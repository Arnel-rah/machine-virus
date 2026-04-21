import * as Phaser from "phaser";

export interface Rule {
  id: string;
  name: string;
  checksum: string;
  priority: number;
  enabled: boolean;
}

export class RuleTree {
  private scene: Phaser.Scene;
  private rules: Map<string, Rule> = new Map();
  private graphics!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeRules();
    this.createVisualization();
  }

  private initializeRules() {
    const defaultRules: Rule[] = [
      { id: "r1", name: "SYN Check", checksum: "SYN_ACK", priority: 1, enabled: true },
      { id: "r2", name: "Buffer Overflow", checksum: "BUFFER_0", priority: 2, enabled: true },
      { id: "r3", name: "UDP Validation", checksum: "UDP_DROP", priority: 3, enabled: true },
      { id: "r4", name: "IP Check", checksum: "IP_V6_ERR", priority: 4, enabled: true },
      { id: "r5", name: "CRC Check", checksum: "CRC_32_BIT", priority: 5, enabled: true },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private createVisualization() {
    this.graphics = this.scene.add.graphics();
  }

  public drawRules() {
    this.graphics.clear();
    // Draw rules as a tree structure on screen if needed
  }

  public getRule(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  public getAllRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  public enableRule(id: string) {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = true;
  }

  public disableRule(id: string) {
    const rule = this.rules.get(id);
    if (rule) rule.enabled = false;
  }

  public updateRule(id: string, updates: Partial<Rule>) {
    const rule = this.rules.get(id);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  public getActiveRules(): Rule[] {
    return Array.from(this.rules.values()).filter(r => r.enabled);
  }

  public destroy() {
    this.graphics.destroy();
  }
}
