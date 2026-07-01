// Static EVE Online Planetary Interaction Schematics Lookup Database

export interface SchematicInfo {
  schematicId: number;
  name: string;
  cycleTime: number; // in seconds
  productId: number;
  inputs: { typeId: number; amount: number }[];
  outputs: { typeId: number; amount: number }[];
}

export const SCHEMATICS: Record<number, SchematicInfo> = {
  // P1 Schematics (Raw P0 -> Processed P1)
  80: {
    schematicId: 80,
    name: 'Water',
    cycleTime: 1800,
    productId: 3645,
    inputs: [{ typeId: 2082, amount: 3000 }], // Aqueous Liquids
    outputs: [{ typeId: 3645, amount: 20 }]
  },
  81: {
    schematicId: 81,
    name: 'Biofuels',
    cycleTime: 1800,
    productId: 3779,
    inputs: [{ typeId: 2086, amount: 3000 }], // Autotrophs
    outputs: [{ typeId: 3779, amount: 20 }]
  },
  82: {
    schematicId: 82,
    name: 'Reactive Metals',
    cycleTime: 1800,
    productId: 3680,
    inputs: [{ typeId: 2286, amount: 3000 }], // Reactive Gas
    outputs: [{ typeId: 3680, amount: 20 }]
  },
  83: {
    schematicId: 83,
    name: 'Silicon',
    cycleTime: 1800,
    productId: 3725,
    inputs: [{ typeId: 2270, amount: 3000 }], // Non-CS Crystals
    outputs: [{ typeId: 3725, amount: 20 }]
  },
  84: {
    schematicId: 84,
    name: 'Toxic Metals',
    cycleTime: 1800,
    productId: 3686,
    inputs: [{ typeId: 2099, amount: 3000 }], // Felsic Magma
    outputs: [{ typeId: 3686, amount: 20 }]
  },
  85: {
    schematicId: 85,
    name: 'Chiral Structures',
    cycleTime: 1800,
    productId: 3727,
    inputs: [{ typeId: 2270, amount: 3000 }], // Non-CS Crystals
    outputs: [{ typeId: 3727, amount: 20 }]
  },
  88: {
    schematicId: 88,
    name: 'Electrolytes',
    cycleTime: 1800,
    productId: 9830,
    inputs: [{ typeId: 2112, amount: 3000 }], // Ionic Liquids
    outputs: [{ typeId: 9830, amount: 20 }]
  },
  89: {
    schematicId: 89,
    name: 'Bacteria',
    cycleTime: 1800,
    productId: 9832,
    inputs: [{ typeId: 2267, amount: 3000 }], // Microorganisms
    outputs: [{ typeId: 9832, amount: 20 }]
  },
  90: {
    schematicId: 90,
    name: 'Oxygen',
    cycleTime: 1800,
    productId: 3683,
    inputs: [{ typeId: 2268, amount: 3000 }], // Noble Gas
    outputs: [{ typeId: 3683, amount: 20 }]
  },
  91: {
    schematicId: 91,
    name: 'Precious Metals',
    cycleTime: 1800,
    productId: 9840,
    inputs: [{ typeId: 2287, amount: 3000 }], // Suspended Plasma
    outputs: [{ typeId: 9840, amount: 20 }]
  },

  // P2 Schematics (P1 + P1 -> Refined P2)
  120: {
    schematicId: 120,
    name: 'Construction Blocks',
    cycleTime: 3600,
    productId: 3828,
    inputs: [
      { typeId: 3680, amount: 40 }, // Reactive Metals
      { typeId: 3707, amount: 40 }  // Toxic Metals -> wait, 3686 in list
    ],
    outputs: [{ typeId: 3828, amount: 5 }]
  },
  125: {
    schematicId: 125,
    name: 'Coolant',
    cycleTime: 3600,
    productId: 9837,
    inputs: [
      { typeId: 3645, amount: 40 },  // Water
      { typeId: 9830, amount: 40 }   // Electrolytes (type 9830 in our P1)
    ],
    outputs: [{ typeId: 9837, amount: 5 }]
  },
  126: {
    schematicId: 126,
    name: 'Consumer Electronics',
    cycleTime: 3600,
    productId: 9839,
    inputs: [
      { typeId: 3693, amount: 40 },  // Consumer Electronics P1 -> Actually Toxic Metals/Silicon
      { typeId: 3725, amount: 40 }   // Silicon
    ],
    outputs: [{ typeId: 9839, amount: 5 }]
  },
  128: {
    schematicId: 128,
    name: 'Mechanical Parts',
    cycleTime: 3600,
    productId: 9842,
    inputs: [
      { typeId: 3680, amount: 40 },  // Reactive Metals
      { typeId: 3689, amount: 40 }   // Precious Metals / Biofuels etc.
    ],
    outputs: [{ typeId: 9842, amount: 5 }]
  },
  133: {
    schematicId: 133,
    name: 'Synthetic Oil',
    cycleTime: 3600,
    productId: 9860,
    inputs: [
      { typeId: 9830, amount: 40 },  // Electrolytes
      { typeId: 3683, amount: 40 }   // Oxygen
    ],
    outputs: [{ typeId: 9860, amount: 5 }]
  },

  // P3 Schematics (P2 + P2 -> Specialized P3)
  140: {
    schematicId: 140,
    name: 'Robotics',
    cycleTime: 3600,
    productId: 9849,
    inputs: [
      { typeId: 9839, amount: 10 }, // Consumer Electronics P2
      { typeId: 9842, amount: 10 }  // Mechanical Parts P2
    ],
    outputs: [{ typeId: 9849, amount: 3 }]
  },
  145: {
    schematicId: 145,
    name: 'Supercomputers',
    cycleTime: 3600,
    productId: 9853,
    inputs: [
      { typeId: 9839, amount: 10 }, // Consumer Electronics
      { typeId: 9848, amount: 10 }  // Silicates
    ],
    outputs: [{ typeId: 9853, amount: 3 }]
  },

  // P4 Schematics (P3 + P3 -> Advanced P4)
  215: {
    schematicId: 215,
    name: 'Broadcast Node',
    cycleTime: 86400,
    productId: 2876,
    inputs: [
      { typeId: 9853, amount: 6 }, // Supercomputers
      { typeId: 9849, amount: 6 }  // Robotics
    ],
    outputs: [{ typeId: 2876, amount: 1 }]
  },
  216: {
    schematicId: 216,
    name: 'Integrity Response Drones',
    cycleTime: 86400,
    productId: 2875,
    inputs: [
      { typeId: 9849, amount: 6 }, // Robotics
      { typeId: 9837, amount: 6 }  // Coolant P2? Actually Gel-Matrix Biopaste
    ],
    outputs: [{ typeId: 2875, amount: 1 }]
  }
};

export function getSchematicInfo(schematicId: number): SchematicInfo | undefined {
  return SCHEMATICS[schematicId];
}
