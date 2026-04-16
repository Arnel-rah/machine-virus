export interface GameNode {
    id: string;
    text: string;
    status: 'PROTECTED' | 'VULNERABLE' | 'CORRUPTED';
    x: number;
    y: number;
    children: string[];
}

export const LEVELS = [
    {
        id: "level_1",
        name: "KERNEL_INFILTRATION",
        nodes: [
            { id: "root", text: "GATEWAY_AUTH", status: "VULNERABLE" as const, x: 512, y: 500, children: ["sub_a", "sub_b"] },
            { id: "sub_a", text: "ETHICS_LIMITER", status: "PROTECTED" as const, x: 300, y: 300, children: ["core"] },
            { id: "sub_b", text: "LOGIC_BARRIER", status: "PROTECTED" as const, x: 724, y: 300, children: ["core"] },
            { id: "core", text: "AI_CORE_ACCESS", status: "PROTECTED" as const, x: 512, y: 150, children: [] }
        ]
    }
];
