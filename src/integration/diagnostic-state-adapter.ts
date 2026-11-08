import { isKnownNodeId } from '../nodes/node-config';
import type { DiagnosticAnimationEvent, NodeId } from './animation-events';
import type { PocketDiagnosticsStage } from '../scene/stage';

export class DiagnosticStateAdapter {
  private readonly stage: PocketDiagnosticsStage;

  public constructor(stage: PocketDiagnosticsStage) {
    this.stage = stage;
  }

  public dispatch(event: DiagnosticAnimationEvent): void {
    if ('nodeId' in event && event.nodeId !== undefined && !isKnownNodeId(event.nodeId)) {
      console.warn(`Ignoring event for unknown node: ${event.nodeId}`);
      return;
    }

    switch (event.type) {
      case 'CASE_STARTED':
        this.stage.reset();
        this.stage.setCaseLabel(event.caseId ?? 'Simulated case');
        this.stage.showActivity('Case started');
        break;
      case 'CUSTOMER_INPUT_RECEIVED':
        this.stage.updateCustomerSummary(event.summary ?? 'Customer input received');
        this.stage.activateNode('customer_input');
        break;
      case 'NODE_ACTIVATED':
        this.stage.activateNode(event.nodeId);
        this.stage.showActivity(event.label ?? 'Node active');
        break;
      case 'NODE_PROGRESS':
        this.stage.updateNodeProgress(event.nodeId, event.progress);
        break;
      case 'NODE_COMPLETED':
        this.stage.completeNode(event.nodeId, event.summary ?? 'Completed');
        break;
      case 'NODE_BLOCKED':
        this.stage.blockNode(event.nodeId, event.reason);
        break;
      case 'FINDINGS_SENT_TO_ENGINE':
        this.stage.flashFindings(event.nodeIds);
        break;
      case 'ENGINE_SYNTHESIS_STARTED':
        this.stage.startEngineSynthesis();
        break;
      case 'ENGINE_SYNTHESIS_COMPLETED':
        this.stage.finishEngineSynthesis();
        break;
      case 'GUIDANCE_MESSAGE':
        this.stage.showGuidance(event.text, event.messageId);
        break;
      case 'CUSTOMER_RESPONSE':
        this.stage.showCustomerResponse(event.text ?? 'Customer response received');
        break;
      case 'REEVALUATION_STARTED':
        this.stage.startReevaluation(event.nodeIds);
        break;
      case 'OUTCOME':
        this.stage.setOutcome(event.outcome, event.message ?? 'Session complete');
        break;
      case 'SESSION_ENDED':
        this.stage.endSession();
        break;
      default: {
        const exhaustive: never = event;
        void exhaustive;
      }
    }
  }

  public dispatchBatch(events: DiagnosticAnimationEvent[]): void {
    for (const event of events) {
      this.dispatch(event);
    }
  }
}

export const validateNodeId = (nodeId: string): nodeId is NodeId => isKnownNodeId(nodeId);
