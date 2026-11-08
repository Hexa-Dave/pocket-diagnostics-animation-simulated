export const NODE_IDS = [
  'customer_input',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'central_engine',
  'conversation',
  'outcome_resolved',
  'outcome_provider',
  'outcome_technician'
] as const;

export type NodeId = (typeof NODE_IDS)[number];
export type BlockReason = 'safety' | 'warranty' | 'insurance' | 'capability' | 'unknown';
export type DiagnosticOutcome = 'resolved' | 'contact_provider' | 'contact_technician';

export type DiagnosticAnimationEvent =
  | { type: 'CASE_STARTED'; caseId?: string; label?: string }
  | { type: 'CUSTOMER_INPUT_RECEIVED'; summary?: string }
  | { type: 'NODE_ACTIVATED'; nodeId: NodeId; label?: string }
  | { type: 'NODE_PROGRESS'; nodeId: NodeId; progress: number }
  | { type: 'NODE_COMPLETED'; nodeId: NodeId; summary?: string }
  | { type: 'NODE_BLOCKED'; nodeId: NodeId; reason: BlockReason }
  | { type: 'FINDINGS_SENT_TO_ENGINE'; nodeIds: NodeId[] }
  | { type: 'ENGINE_SYNTHESIS_STARTED' }
  | { type: 'ENGINE_SYNTHESIS_COMPLETED' }
  | { type: 'GUIDANCE_MESSAGE'; messageId: string; text: string }
  | { type: 'CUSTOMER_RESPONSE'; messageId: string; text?: string }
  | { type: 'REEVALUATION_STARTED'; nodeIds: NodeId[] }
  | { type: 'OUTCOME'; outcome: DiagnosticOutcome; message?: string }
  | { type: 'SESSION_ENDED' };
