import type { NodeId } from '../integration/animation-events';

export type NodeState = 'idle' | 'active' | 'progressing' | 'completed' | 'blocked';

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeDefinition {
  id: NodeId;
  displayName: string;
  asset: string | null;
  position: NodePosition;
  width: number;
  height: number;
  artWidth?: number;
  accent: string;
  description: string;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    id: 'customer_input',
    displayName: 'CUSTOMER INPUT',
    asset: "/assets/departments/customer-input/customer-workstation.png",
    position: { x: 145, y: 420 },
    width: 200,
    height: 300,
    artWidth: 200,
    accent: '#7ae2ff',
    description: 'Customer submits appliance details and observations.'
  },
  {
    id: 'A',
    displayName: 'DISHWASHER IDENTIFICATION',
    asset: '/assets/departments/dishwasher-identification/identification-workstation.png',
    position: { x: 300, y: 170 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#7ae2ff',
    description: 'Identify the dishwasher model and version.'
  },
  {
    id: 'B',
    displayName: 'MOST LIKELY CAUSES',
    asset: '/assets/departments/likely-causes/causes-workstation.png',
    position: { x: 510, y: 170 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#7ae2ff',
    description: 'Assess probable fault explanations.'
  },
  {
    id: 'C',
    displayName: 'APPLIANCE MANUALS',
    asset: '/assets/departments/expert-knowledge/knowledge-workstation.png',
    position: { x: 720, y: 170 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#7ae2ff',
    description: 'Consult expert-verified manufacturer guidance.'
  },
  {
    id: 'D',
    displayName: 'DIAGNOSTIC PROCEDURES',
    asset: '/assets/departments/diagnostic-procedures/procedures-workstation.png',
    position: { x: 930, y: 170 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#87f7d8',
    description: 'Review documented steps and safe checks.'
  },
  {
    id: 'E',
    displayName: 'SAFETY VERIFICATION',
    asset: '/assets/departments/safety-verification/safety-workstation.png',
    position: { x: 1140, y: 170 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#ffe082',
    description: 'Review hazards before advising on actions.'
  },
  {
    id: 'F',
    displayName: 'WARRANTY VERIFICATION',
    asset: "/assets/departments/warranty-verification/warranty-workstation.png",
    position: { x: 220, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#ffd166',
    description: 'Check coverage and repair restrictions.'
  },
  {
    id: 'G',
    displayName: 'INSURANCE VERIFICATION',
    asset: "/assets/departments/insurance-verification/insurance-workstation.png",
    position: { x: 440, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#ffb1c1',
    description: 'Review policy exclusions and approval requirements.'
  },
  {
    id: 'H',
    displayName: 'TOOLS VERIFICATION',
    asset: '/assets/departments/tools-verification/tools-workstation.png',
    position: { x: 660, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#7ae2ff',
    description: 'Check equipment and user capability requirements.'
  },
  {
    id: 'I',
    displayName: 'PARTS IDENTIFICATION',
    asset: '/assets/departments/parts-identification/parts-workstation.png',
    position: { x: 880, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#8fe3c8',
    description: 'Identify parts relevant to the permitted repair path.'
  },
  {
    id: 'J',
    displayName: 'REPAIR OPTIONS',
    asset: '/assets/departments/repair-options/repair-options-workstation.png',
    position: { x: 1100, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#9fe8ff',
    description: 'Compare permitted resolution paths.'
  },
  {
    id: 'K',
    displayName: 'CONTRADICTION CHECK',
    asset: '/assets/departments/contradiction-check/contradiction-workstation.png',
    position: { x: 1320, y: 760 },
    width: 200,
    height: 190,
    artWidth: 200,
    accent: '#ff9f9f',
    description: 'Cross-check multiple findings for consistency.'
  },
  {
    id: 'central_engine',
    displayName: 'EXPERT GUIDANCE ENGINE',
    asset: '/assets/central-engine/guidance-engine.png',
    position: { x: 750, y: 460 },
    width: 240,
    height: 204,
    accent: '#71f1ff',
    description: 'Synthesize findings and decide the next customer message.'
  },
  {
    id: 'conversation',
    displayName: 'Conversation',
    asset: '/assets/departments/customer-conversation/customer-conversation.png',
    position: { x: 1000, y: 410 },
    width: 308,
    height: 275,
    accent: '#7ae2ff',
    description: 'Display one customer-facing guidance message at a time.'
  },
  {
    id: 'outcome_resolved',
    displayName: 'Resolved path',
    asset: null,
    position: { x: 1450, y: 295 },
    width: 170,
    height: 120,
    accent: '#7bded4',
    description: 'Session ends with a permitted next step.'
  },
  {
    id: 'outcome_provider',
    displayName: 'Contact provider',
    asset: null,
    position: { x: 1450, y: 475 },
    width: 180,
    height: 120,
    accent: '#ffcc66',
    description: 'Session ends with advice to contact a provider.'
  },
  {
    id: 'outcome_technician',
    displayName: 'Contact technician',
    asset: '/assets/departments/final-outcome/repair-men.png',
    position: { x: 1450, y: 655 },
    width: 180,
    height: 120,
    accent: '#ff7e6b',
    description: 'Session ends with advice to contact a qualified technician.'
  }
];

export const nodeConfigLookup = new Map<NodeId, NodeDefinition>(
  NODE_DEFINITIONS.map((node) => [node.id, node])
);

export function isKnownNodeId(value: string): value is NodeId {
  return nodeConfigLookup.has(value as NodeId);
}

export function getNodeConfig(nodeId: string): NodeDefinition | undefined {
  return nodeConfigLookup.get(nodeId as NodeId);
}
