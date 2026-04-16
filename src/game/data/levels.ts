export const LEVELS = [
    {
        id: "level_1",
        name: "KERNEL_INFILTRATION",
        nodes: [
            { id: "root", text: "GATEWAY_PROTOCOL", status: "VULNERABLE", x: 512, y: 500, children: ["sub_a", "sub_b"] },
            { id: "sub_a", text: "ETHICS_LIMITER", status: "PROTECTED", x: 300, y: 300, children: ["core"] },
            { id: "sub_b", text: "LOGIC_BARRIER", status: "PROTECTED", x: 724, y: 300, children: ["core"] },
            { id: "core", text: "AI_CORE_ACCESS", status: "PROTECTED", x: 512, y: 150, children: [] }
        ]
    }
];
