// EVE Online Planetary Interaction Mock Data Service

export interface Character {
  id: string;
  name: string;
  corp: string;
  alliance?: string;
  avatarUrl: string;
  rank: string;
  level: number;
  crebits: number; // Cyberpunk-themed credits / ISK
}

export interface PIItem {
  typeId: number;
  name: string;
  tier: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  volume: number; // m3 per unit
  iconUrl?: string;
}

export interface ExtractorHead {
  id: number;
  latitude: number;
  longitude: number;
}

export interface ExtractorDetails {
  cycleTime: number; // total duration in seconds
  cycleTimeRemaining: number; // remaining in seconds
  productTypeId: number;
  qtyPerCycle: number;
  headPositions: ExtractorHead[];
}

export interface FactoryDetails {
  schematicId: number;
  productTypeId: number;
  cycleTime: number;
  cycleTimeRemaining: number;
  inputs: { typeId: number; amount: number }[];
  outputs: { typeId: number; amount: number }[];
}

export interface Pin {
  id: string;
  typeId: number;
  typeName: string;
  category: 'extractor' | 'factory' | 'storage' | 'command_center';
  factoryType?: 'basic' | 'advanced' | 'high_tech';
  status: 'active' | 'idle' | 'warning' | 'error'; // green to red status
  contents?: { typeId: number; amount: number }[];
  extractorDetails?: ExtractorDetails;
  factoryDetails?: FactoryDetails;
}

export interface Planet {
  id: string;
  name: string;
  type: 'Temperate' | 'Lava' | 'Barren' | 'Storm' | 'Oceanic' | 'Gas' | 'Plasma' | 'Ice';
  commandCenterLevel: number;
  pins: Pin[];
}

export const MOCK_CHARACTERS: Character[] = [
  {
    id: '90001001',
    name: 'Raven Shazih',
    corp: 'Valkyrie Tactical Syndicate',
    alliance: 'Pandemic Horde',
    avatarUrl: 'https://images.evetech.net/characters/95465499/portrait?size=256',
    rank: 'PRIME OPERATIVE',
    level: 42,
    crebits: 452900300
  },
  {
    id: '90001002',
    name: 'Vance Corinth',
    corp: 'Jita Trade Cartel',
    alliance: 'Caldari State',
    avatarUrl: 'https://images.evetech.net/characters/91462344/portrait?size=256',
    rank: 'MARKET CONTROLLER',
    level: 38,
    crebits: 12895400000
  },
  {
    id: '90001003',
    name: 'Lyra Vance',
    corp: 'State War Academy',
    avatarUrl: 'https://images.evetech.net/characters/93452299/portrait?size=256',
    rank: 'CADET PILOT',
    level: 15,
    crebits: 18900420
  }
];

export const PI_COMMODITIES: PIItem[] = [
  // P0 Raw materials
  { typeId: 2082, name: 'Aqueous Liquids', tier: 'P0', volume: 0.01 },
  { typeId: 2086, name: 'Autotrophs', tier: 'P0', volume: 0.01 },
  { typeId: 2096, name: 'Carbon Compounds', tier: 'P0', volume: 0.01 },
  { typeId: 2099, name: 'Felsic Magma', tier: 'P0', volume: 0.01 },
  { typeId: 2112, name: 'Ionic Liquids', tier: 'P0', volume: 0.01 },
  { typeId: 2267, name: 'Microorganisms', tier: 'P0', volume: 0.01 },
  { typeId: 2268, name: 'Noble Gas', tier: 'P0', volume: 0.01 },
  { typeId: 2270, name: 'Non-CS Crystals', tier: 'P0', volume: 0.01 },
  { typeId: 2272, name: 'Planktic Colonies', tier: 'P0', volume: 0.01 },
  { typeId: 2286, name: 'Reactive Gas', tier: 'P0', volume: 0.01 },
  { typeId: 2287, name: 'Suspended Plasma', tier: 'P0', volume: 0.01 },

  // P1 Processed materials
  { typeId: 3645, name: 'Water', tier: 'P1', volume: 0.38 },
  { typeId: 3683, name: 'Oxygen', tier: 'P1', volume: 0.38 },
  { typeId: 3689, name: 'Mechanical Parts', tier: 'P1', volume: 0.38 }, // Wait, in game P1 are Biofuels, Biomass, etc. Let's list the accurate ones
  { typeId: 3693, name: 'Consumer Electronics', tier: 'P1', volume: 0.38 },
  { typeId: 3779, name: 'Biofuels', tier: 'P1', volume: 0.38 },
  { typeId: 3679, name: 'Industrial Fibers', tier: 'P1', volume: 0.38 },
  { typeId: 3680, name: 'Reactive Metals', tier: 'P1', volume: 0.38 },
  { typeId: 3686, name: 'Toxic Metals', tier: 'P1', volume: 0.38 },
  { typeId: 3725, name: 'Silicon', tier: 'P1', volume: 0.38 },
  { typeId: 3727, name: 'Chiral Structures', tier: 'P1', volume: 0.38 },
  { typeId: 9830, name: 'Electrolytes', tier: 'P1', volume: 0.38 },
  { typeId: 9832, name: 'Bacteria', tier: 'P1', volume: 0.38 },
  { typeId: 9836, name: 'Proteins', tier: 'P1', volume: 0.38 },
  { typeId: 9838, name: 'Oxides', tier: 'P1', volume: 0.38 },
  { typeId: 9840, name: 'Precious Metals', tier: 'P1', volume: 0.38 },

  // P2 Refined commodities
  { typeId: 3828, name: 'Construction Blocks', tier: 'P2', volume: 1.5 },
  { typeId: 9837, name: 'Coolant', tier: 'P2', volume: 1.5 },
  { typeId: 9839, name: 'Consumer Electronics', tier: 'P2', volume: 1.5 },
  { typeId: 9841, name: 'Enriched Uranium', tier: 'P2', volume: 1.5 },
  { typeId: 9842, name: 'Mechanical Parts', tier: 'P2', volume: 1.5 },
  { typeId: 9846, name: 'Polyaramids', tier: 'P2', volume: 1.5 },
  { typeId: 9848, name: 'Silicates', tier: 'P2', volume: 1.5 },
  { typeId: 9850, name: 'Fertilizer', tier: 'P2', volume: 1.5 },
  { typeId: 9852, name: 'Genetically Enhanced Livestock', tier: 'P2', volume: 1.5 },
  { typeId: 9860, name: 'Synthetic Oil', tier: 'P2', volume: 1.5 },

  // P3 Specialized commodities
  { typeId: 9849, name: 'Robotics', tier: 'P3', volume: 6.0 },
  { typeId: 9851, name: 'Synthetic Synapses', tier: 'P3', volume: 6.0 },
  { typeId: 9853, name: 'Supercomputers', tier: 'P3', volume: 6.0 },
  { typeId: 9858, name: 'Cryoprotectants', tier: 'P3', volume: 6.0 },
  { typeId: 9862, name: 'Condensates', tier: 'P3', volume: 6.0 },

  // P4 Advanced commodities
  { typeId: 2876, name: 'Broadcast Node', tier: 'P4', volume: 100.0 },
  { typeId: 2875, name: 'Integrity Response Drones', tier: 'P4', volume: 100.0 },
  { typeId: 2872, name: 'Nano-Factory', tier: 'P4', volume: 100.0 },
  { typeId: 2867, name: 'Wetware Mainframe', tier: 'P4', volume: 100.0 }
];

// Commodity base market prices in Jita (Buy/Sell)
export interface MarketPrice {
  typeId: number;
  buyPrice: number;  // highest buy order
  sellPrice: number; // lowest sell order
}

export const BASE_MARKET_PRICES: Record<number, { buy: number; sell: number }> = {
  // P0
  2082: { buy: 8, sell: 12 },     // Aqueous Liquids
  2086: { buy: 9, sell: 14 },     // Autotrophs
  2112: { buy: 11, sell: 16 },    // Ionic Liquids
  2286: { buy: 10, sell: 15 },    // Reactive Gas
  2287: { buy: 12, sell: 18 },    // Suspended Plasma
  
  // P1
  3645: { buy: 420, sell: 490 },  // Water
  3683: { buy: 380, sell: 450 },  // Oxygen
  3680: { buy: 350, sell: 410 },  // Reactive Metals
  3725: { buy: 390, sell: 460 },  // Silicon
  3727: { buy: 410, sell: 480 },  // Chiral Structures
  9830: { buy: 430, sell: 510 },  // Electrolytes
  9832: { buy: 400, sell: 480 },  // Bacteria
  
  // P2
  3828: { buy: 7200, sell: 7800 },   // Construction Blocks
  9837: { buy: 8800, sell: 9500 },   // Coolant
  9839: { buy: 8100, sell: 8800 },   // Consumer Electronics
  9842: { buy: 9200, sell: 9900 },   // Mechanical Parts
  9860: { buy: 7800, sell: 8400 },   // Synthetic Oil
  
  // P3
  9849: { buy: 58000, sell: 63000 },  // Robotics
  9853: { buy: 62000, sell: 67000 },  // Supercomputers
  
  // P4
  2876: { buy: 2350000, sell: 2580000 }, // Broadcast Node
  2875: { buy: 2200000, sell: 2420000 }, // Integrity Response Drones
  2872: { buy: 2150000, sell: 2380000 }, // Nano-Factory
  2867: { buy: 2450000, sell: 2700000 }  // Wetware Mainframe
};

// Generates slightly fluctuating prices to simulate a live market
export function getSimulatedPrice(typeId: number): MarketPrice {
  const base = BASE_MARKET_PRICES[typeId] || { buy: 100, sell: 110 };
  // Fluctuates by up to +-2.5%
  const factor = 1 + (Math.random() * 0.05 - 0.025);
  return {
    typeId,
    buyPrice: Math.round(base.buy * factor),
    sellPrice: Math.round(base.sell * factor)
  };
}

export function getPIItemById(typeId: number): PIItem | undefined {
  return PI_COMMODITIES.find(i => i.typeId === typeId);
}

// Mock planets data for each character
export const MOCK_PLANETS: Record<string, Planet[]> = {
  // Raven's Planets (P2/P3 Production focus)
  '90001001': [
    {
      id: '40001001',
      name: 'Rens III - Temperate',
      type: 'Temperate',
      commandCenterLevel: 5,
      pins: [
        {
          id: 'pin_1_1',
          typeId: 2256,
          typeName: 'Storage Facility',
          category: 'storage',
          status: 'active',
          contents: [
            { typeId: 2082, amount: 48000 }, // Aqueous Liquids (P0)
            { typeId: 3645, amount: 2400 },   // Water (P1)
            { typeId: 9837, amount: 320 }     // Coolant (P2)
          ]
        },
        {
          id: 'pin_1_2',
          typeId: 2257,
          typeName: 'Launchpad',
          category: 'storage',
          status: 'active',
          contents: [
            { typeId: 9837, amount: 1450 }    // Coolant (P2) ready for transport
          ]
        },
        {
          id: 'pin_1_3',
          typeId: 2848,
          typeName: 'Extractor Control Unit',
          category: 'extractor',
          status: 'active',
          extractorDetails: {
            cycleTime: 86400,
            cycleTimeRemaining: 23200, // 6h 26m
            productTypeId: 2082, // Aqueous Liquids
            qtyPerCycle: 28000,
            headPositions: [
              { id: 1, latitude: 12.34, longitude: 56.78 },
              { id: 2, latitude: 12.85, longitude: 56.12 },
              { id: 3, latitude: 13.11, longitude: 57.02 }
            ]
          }
        },
        {
          id: 'pin_1_4',
          typeId: 2469,
          typeName: 'Basic Industry Facility',
          category: 'factory',
          factoryType: 'basic',
          status: 'active',
          factoryDetails: {
            schematicId: 80,
            productTypeId: 3645, // Water
            cycleTime: 1800,
            cycleTimeRemaining: 450, // 7.5m
            inputs: [{ typeId: 2082, amount: 3000 }],
            outputs: [{ typeId: 3645, amount: 20 }]
          }
        },
        {
          id: 'pin_1_5',
          typeId: 2470,
          typeName: 'Advanced Industry Facility',
          category: 'factory',
          factoryType: 'advanced',
          status: 'active',
          factoryDetails: {
            schematicId: 125,
            productTypeId: 9837, // Coolant
            cycleTime: 3600,
            cycleTimeRemaining: 1800, // 30m
            inputs: [
              { typeId: 3645, amount: 40 }, // Water
              { typeId: 9830, amount: 40 }  // Electrolytes
            ],
            outputs: [{ typeId: 9837, amount: 5 }]
          }
        }
      ]
    },
    {
      id: '40001002',
      name: 'Rens V - Lava',
      type: 'Lava',
      commandCenterLevel: 4,
      pins: [
        {
          id: 'pin_2_1',
          typeId: 2257,
          typeName: 'Launchpad',
          category: 'storage',
          status: 'active',
          contents: [
            { typeId: 2099, amount: 85000 }, // Felsic Magma
            { typeId: 3680, amount: 6200 }   // Reactive Metals
          ]
        },
        {
          id: 'pin_2_2',
          typeId: 2848,
          typeName: 'Extractor Control Unit',
          category: 'extractor',
          status: 'warning', // Running low on extraction yields
          extractorDetails: {
            cycleTime: 86400,
            cycleTimeRemaining: 80200, // 22h 16m
            productTypeId: 2099, // Felsic Magma
            qtyPerCycle: 14000,
            headPositions: [
              { id: 1, latitude: -45.12, longitude: 22.45 },
              { id: 2, latitude: -44.88, longitude: 23.01 }
            ]
          }
        },
        {
          id: 'pin_2_3',
          typeId: 2469,
          typeName: 'Basic Industry Facility',
          category: 'factory',
          factoryType: 'basic',
          status: 'active',
          factoryDetails: {
            schematicId: 82,
            productTypeId: 3680, // Reactive Metals
            cycleTime: 1800,
            cycleTimeRemaining: 120, // 2m
            inputs: [{ typeId: 2099, amount: 3000 }],
            outputs: [{ typeId: 3680, amount: 20 }]
          }
        }
      ]
    }
  ],

  // Vance's Planets (High value P4 Setup)
  '90001002': [
    {
      id: '40002001',
      name: 'Jita IV - Oceanic',
      type: 'Oceanic',
      commandCenterLevel: 5,
      pins: [
        {
          id: 'pin_3_1',
          typeId: 2257,
          typeName: 'Launchpad',
          category: 'storage',
          status: 'active',
          contents: [
            { typeId: 9837, amount: 4800 },  // Coolant
            { typeId: 9839, amount: 5600 },  // Consumer Electronics
            { typeId: 2876, amount: 28 }     // Broadcast Nodes (P4)
          ]
        },
        {
          id: 'pin_3_2',
          typeId: 2472,
          typeName: 'High-Tech Industry Facility',
          category: 'factory',
          factoryType: 'high_tech',
          status: 'active',
          factoryDetails: {
            schematicId: 215,
            productTypeId: 2876, // Broadcast Node
            cycleTime: 86400,
            cycleTimeRemaining: 14400, // 4 hrs left
            inputs: [
              { typeId: 9837, amount: 100 }, // Coolant
              { typeId: 9839, amount: 100 }  // Consumer Electronics
            ],
            outputs: [{ typeId: 2876, amount: 1 }]
          }
        },
        {
          id: 'pin_3_3',
          typeId: 2472,
          typeName: 'High-Tech Industry Facility',
          category: 'factory',
          factoryType: 'high_tech',
          status: 'error', // Missing input materials!
          factoryDetails: {
            schematicId: 215,
            productTypeId: 2876,
            cycleTime: 86400,
            cycleTimeRemaining: 0, // Stopped
            inputs: [
              { typeId: 9837, amount: 100 },
              { typeId: 9839, amount: 100 }
            ],
            outputs: [{ typeId: 2876, amount: 1 }]
          }
        }
      ]
    }
  ],

  // Lyra's Planets (Starter setups)
  '90001003': [
    {
      id: '40003001',
      name: 'Amarr Prime II - Barren',
      type: 'Barren',
      commandCenterLevel: 2,
      pins: [
        {
          id: 'pin_4_1',
          typeId: 2256,
          typeName: 'Storage Facility',
          category: 'storage',
          status: 'active',
          contents: [
            { typeId: 2082, amount: 5400 } // Aqueous Liquids
          ]
        },
        {
          id: 'pin_4_2',
          typeId: 2848,
          typeName: 'Extractor Control Unit',
          category: 'extractor',
          status: 'active',
          extractorDetails: {
            cycleTime: 86400,
            cycleTimeRemaining: 44000,
            productTypeId: 2082,
            qtyPerCycle: 8000,
            headPositions: [{ id: 1, latitude: 10, longitude: 20 }]
          }
        }
      ]
    }
  ]
};
