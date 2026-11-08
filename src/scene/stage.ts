import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import { gsap } from 'gsap';
import type { BlockReason, DiagnosticOutcome, NodeId } from '../integration/animation-events';
import { NODE_DEFINITIONS, getNodeConfig } from '../nodes/node-config';
import type { CustomerInput } from '../nodes/symptom-workflows';
import { createBackground } from './background';
import { createCentralEngineScene } from './central-engine-scene';
import { createDepartmentNodeVisual } from './department-scenes';
import { createOutcomeBanner } from './outcome-scenes';

const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;
const CONVERSATION_PANEL_X = 1300;
const CONVERSATION_ART_POSITION = { x: 1180, y: 447.5 };
const VISUAL_NODE_IDS: NodeId[] = ['customer_input', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
const ENGINE_POSITION = { x: 750, y: 460 };
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class PocketDiagnosticsStage {
  public readonly app: Application;
  public root!: Container;
  public readonly ready: Promise<void>;

  private readonly nodeVisuals = new Map<NodeId, ReturnType<typeof createDepartmentNodeVisual>>();
  private readonly signalLayer = new Container();
  private readonly activeSignals: Graphics[] = [];
  private readonly loadedAssets = new Set<string>();
  private activeRipple: Container | undefined;
  private readonly currentStatus = new Text({
    text: 'Waiting for case input',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 14,
      fill: 0xbfe5eb,
      fontWeight: '700'
    })
  });
  private readonly caseLabel = new Text({
    text: 'SIMULATED CASE',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 13,
      fill: 0x7ce5f0,
      fontWeight: '800',
      letterSpacing: 0.6
    })
  });
  private readonly guidanceText = new Text({
    text: 'Waiting for the next message from the host application.',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 20,
      fill: 0xf3fbff,
      fontWeight: '700',
      wordWrap: true,
      wordWrapWidth: 290,
      breakWords: true
    })
  });
  private readonly customerResponse = new Text({
    text: 'Customer response will appear here.',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 15,
      fill: 0xb9d7de,
      fontWeight: '500',
      wordWrap: true,
      wordWrapWidth: 290,
      breakWords: true
    })
  });
  private outcomeBanner!: ReturnType<typeof createOutcomeBanner>;
  private resizeObserver: ResizeObserver | undefined;
  private destroyed = false;
  private pixiInitialized = false;

  public constructor(
    private readonly host: HTMLElement,
    private readonly onCustomerInputSubmit?: (input: CustomerInput) => void,
    private readonly conversationOverlay?: HTMLElement
  ) {
    this.app = new Application();
    this.ready = this.initialize();
  }

  private async initialize(): Promise<void> {
    await this.app.init({
      width: this.host.clientWidth || SCENE_WIDTH,
      height: this.host.clientHeight || SCENE_HEIGHT,
      antialias: true,
      backgroundAlpha: 0,
      resizeTo: this.host
    });
    this.pixiInitialized = true;

    if (this.destroyed) {
      this.app.destroy(true, { children: true, texture: false });
      return;
    }
    this.host.appendChild(this.app.canvas);

    const assetPaths = [...new Set(
      NODE_DEFINITIONS.flatMap((node) => node.asset ? [node.asset] : [])
    )];
    await Promise.all(assetPaths.map(async (assetPath) => {
      try {
        await Assets.load(assetPath);
        this.loadedAssets.add(assetPath);
      } catch (error) {
        console.error(`Unable to load workstation asset "${assetPath}"`, error);
      }
    }));

    this.root = new Container();
    this.app.stage.addChild(this.root);
    createBackground(this.root);

    const centralEngineConfig = getNodeConfig('central_engine');
    if (!centralEngineConfig) {
      throw new Error('Missing visual configuration for node "central_engine"');
    }
    createCentralEngineScene(
      this.root,
      centralEngineConfig,
      centralEngineConfig.asset !== null && this.loadedAssets.has(centralEngineConfig.asset)
    );

    for (const nodeId of VISUAL_NODE_IDS) {
      const config = getNodeConfig(nodeId);
      if (!config) {
        throw new Error(`Missing visual configuration for node "${nodeId}"`);
      }
      const view = createDepartmentNodeVisual(
        config,
        config.asset !== null && this.loadedAssets.has(config.asset),
        nodeId === 'customer_input'
          ? this.onCustomerInputSubmit
          : undefined
      );
      this.nodeVisuals.set(nodeId, view);
      this.root.addChild(view.container);
    }

    this.createConversationPanel();
    const technicianAsset = getNodeConfig('outcome_technician')?.asset;
    this.outcomeBanner = createOutcomeBanner(
      technicianAsset && this.loadedAssets.has(technicianAsset) ? technicianAsset : undefined
    );
    this.root.addChild(this.outcomeBanner.container);
    this.app.stage.eventMode = 'passive';

    this.resizeObserver = new ResizeObserver(() => this.resizeToHost());
    this.resizeObserver.observe(this.host);
    this.resizeToHost();
    this.reset();
  }

  public resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
    this.fitScene(width, height);
  }

  public reset(preserveCustomerInput = false): void {
    if (!this.root) {
      return;
    }

    this.currentStatus.text = 'Waiting for case input';
    this.caseLabel.text = 'SIMULATED CASE';
    this.guidanceText.text = 'Waiting for the next message from the host application.';
    this.customerResponse.text = 'Customer response will appear here.';
    this.customerResponse.position.y = Math.max(
      245,
      this.guidanceText.position.y + this.guidanceText.height + 8
    );
    for (const [nodeId, view] of this.nodeVisuals) {
      gsap.killTweensOf(view.art.scale);
      view.art.alpha = 0.88;
      view.art.scale.set(1);
      if (!preserveCustomerInput) {
        view.resetInput();
      }
      this.setNodeStatus(nodeId, 'Waiting');
    }

    this.clearActiveRipple();
    this.outcomeBanner.container.visible = false;
    this.clearSignals();
  }

  public setCaseLabel(caseId: string): void {
    this.caseLabel.text = `SIMULATED CASE · ${caseId}`;
  }

  public showActivity(text: string): void {
    this.currentStatus.text = text;
  }

  public updateCustomerSummary(summary: string): void {
    const input = this.nodeVisuals.get('customer_input');
    if (input && summary) {
      this.setNodeStatus('customer_input', summary.length > 28 ? `${summary.slice(0, 25)}...` : summary);
    }
  }

  public activateNode(nodeId: NodeId): void {
    const view = this.nodeVisuals.get(nodeId);
    if (!view) {
      return;
    }

    view.art.alpha = 1;
    this.setNodeStatus(nodeId, 'In progress');
    this.showActiveRipple(nodeId);
    gsap.killTweensOf(view.art.scale);
    if (!REDUCED_MOTION) {
      gsap.to(view.art.scale, {
        x: 1.07,
        y: 1.07,
        duration: 0.65,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1
      });
    }
  }

  public updateNodeProgress(nodeId: NodeId, progress: number): void {
    const view = this.nodeVisuals.get(nodeId);
    if (!view) {
      return;
    }

    this.setNodeStatus(nodeId, `In progress · ${Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%`);
  }

  public completeNode(nodeId: NodeId, summary: string): void {
    const view = this.nodeVisuals.get(nodeId);
    if (!view) {
      return;
    }

    gsap.killTweensOf(view.art.scale);
    view.art.scale.set(1);
    this.clearActiveRipple(nodeId);
    this.setNodeStatus(nodeId, 'Completed');
    this.currentStatus.text = `${getNodeConfig(nodeId)?.displayName ?? nodeId} completed: ${summary}`;
  }

  public blockNode(nodeId: NodeId, reason: BlockReason): void {
    const view = this.nodeVisuals.get(nodeId);
    const config = getNodeConfig(nodeId);
    if (!view || !config) {
      return;
    }

    gsap.killTweensOf(view.art.scale);
    this.clearActiveRipple(nodeId);
    view.art.alpha = 1;
    this.setNodeStatus(nodeId, `Blocked · ${reason}`);
    if (!REDUCED_MOTION) {
      gsap.to(view.art.scale, {
        x: 1.06,
        y: 1.06,
        duration: 0.3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 3,
        onComplete: () => view.art.scale.set(1)
      });
    }
    this.currentStatus.text = `Blocked: ${reason}`;
  }

  public flashFindings(nodeIds: NodeId[]): void {
    for (const nodeId of nodeIds) {
      const view = this.nodeVisuals.get(nodeId);
      if (view) {
        this.createSignal(view.art.x, view.art.y, ENGINE_POSITION.x, ENGINE_POSITION.y, 0x7ae2ff);
      }
    }
    this.currentStatus.text = 'Selected findings sent to the engine';
  }

  public startEngineSynthesis(): void {
    this.currentStatus.text = 'Engine synthesising supplied findings';
  }

  public finishEngineSynthesis(): void {
    this.currentStatus.text = 'Engine synthesis complete';
  }

  public showGuidance(text: string, messageId: string): void {
    this.guidanceText.text = text;
    this.customerResponse.position.y = Math.max(
      245,
      this.guidanceText.position.y + this.guidanceText.height + 8
    );
    this.currentStatus.text = `Guidance message ${messageId}`;
    this.createSignal(ENGINE_POSITION.x, ENGINE_POSITION.y, 1190, 410, 0x7ae2ff);
    gsap.fromTo(this.guidanceText.scale, { x: 0.97, y: 0.97 }, { x: 1, y: 1, duration: 0.25, ease: 'power1.out' });
  }

  public showCustomerResponse(text: string): void {
    this.customerResponse.text = text;
  }

  public routeCustomerReply(nodeId: NodeId, onComplete: () => void): void {
    const target = this.nodeVisuals.get(nodeId);
    if (!target) {
      onComplete();
      return;
    }

    this.createSignal(
      CONVERSATION_ART_POSITION.x,
      CONVERSATION_ART_POSITION.y,
      ENGINE_POSITION.x,
      ENGINE_POSITION.y,
      0x7ae2ff,
      () => this.createSignal(
        ENGINE_POSITION.x,
        ENGINE_POSITION.y,
        target.art.x,
        target.art.y,
        0x7ae2ff,
        onComplete
      )
    );
  }

  public startReevaluation(nodeIds: NodeId[]): void {
    this.currentStatus.text = 'Re-evaluating selected checks';
    for (const nodeId of nodeIds) {
      const view = this.nodeVisuals.get(nodeId);
      if (view) {
        this.setNodeStatus(nodeId, 'Re-evaluating');
        gsap.killTweensOf(view.art.scale);
        if (!REDUCED_MOTION) {
          gsap.to(view.art.scale, {
            x: 1.07,
            y: 1.07,
            duration: 0.65,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1
          });
        }
      }
    }
  }

  public setOutcome(outcome: DiagnosticOutcome, message: string): void {
    this.outcomeBanner.container.visible = true;
    this.outcomeBanner.icon.clear();
    this.outcomeBanner.icon.visible = outcome !== 'contact_technician';
    if (this.outcomeBanner.technicianArtwork) {
      this.outcomeBanner.technicianArtwork.visible = outcome === 'contact_technician';
    }

    if (outcome === 'contact_technician') {
      const cardCenterX = 1450;
      const cardWidth = 260;
      const cardPadding = 16;
      this.outcomeBanner.panel.position.set(cardCenterX, 0);
      this.outcomeBanner.technicianArtwork?.position.set(cardCenterX, 432);
      this.outcomeBanner.title.anchor.set(0.5, 0);
      this.outcomeBanner.title.position.set(cardCenterX, 500);
      this.outcomeBanner.title.style.wordWrapWidth = cardWidth - cardPadding * 2;
      this.outcomeBanner.body.anchor.set(0.5, 0);
      this.outcomeBanner.body.style.fontSize = 12;
      this.outcomeBanner.body.style.wordWrapWidth = cardWidth - cardPadding * 2;
    } else {
      this.outcomeBanner.title.anchor.set(0.5, 0);
      this.outcomeBanner.body.anchor.set(0.5, 0);
      this.outcomeBanner.body.style.fontSize = 14;
      this.outcomeBanner.body.style.wordWrapWidth = 210;
    }

    switch (outcome) {
      case 'resolved':
        this.outcomeBanner.icon.circle(0, 0, 20).fill(0x55c8a5);
        this.outcomeBanner.icon.moveTo(-9, 0).lineTo(-2, 7).lineTo(11, -8).stroke({ color: 0x073a36, width: 4 });
        this.outcomeBanner.title.text = 'Resolved / permitted';
        break;
      case 'contact_provider':
        this.outcomeBanner.icon.poly([-20, 17, 0, -19, 20, 17]).fill(0xffc35c);
        this.outcomeBanner.icon.moveTo(0, -8).lineTo(0, 5).stroke({ color: 0x543a08, width: 3 });
        this.outcomeBanner.icon.circle(0, 11, 1.8).fill(0x543a08);
        this.outcomeBanner.title.text = 'Contact provider';
        break;
      case 'contact_technician':
        this.outcomeBanner.title.text = 'Contact Qualified Technician';
        break;
    }

    this.outcomeBanner.body.text = message;
    if (outcome !== 'contact_technician') {
      const cardCenterX = 1450;
      const cardWidth = 250;
      const cardTop = 350;
      const cardPadding = 18;
      const iconY = cardTop + 35;
      this.outcomeBanner.icon.position.set(cardCenterX, iconY);
      this.outcomeBanner.title.position.set(cardCenterX, cardTop + 60);
      this.outcomeBanner.body.position.set(
        cardCenterX,
        this.outcomeBanner.title.position.y + this.outcomeBanner.title.height + 10
      );
      const cardHeight = this.outcomeBanner.body.position.y
        + this.outcomeBanner.body.height
        + cardPadding
        - cardTop;
      this.outcomeBanner.panel.position.set(cardCenterX, cardTop);
      this.outcomeBanner.panel.clear()
        .roundRect(-cardWidth / 2, 0, cardWidth, cardHeight, 16)
        .fill({ color: 0x0b3340, alpha: 0.96 })
        .roundRect(-cardWidth / 2, 0, cardWidth, cardHeight, 16)
        .stroke({ color: 0x78cad6, alpha: 0.8, width: 2 });
    } else {
      const cardCenterX = 1450;
      const cardTop = 350;
      this.outcomeBanner.body.position.set(
        cardCenterX,
        this.outcomeBanner.title.position.y + this.outcomeBanner.title.height + 8
      );
      const cardPadding = 16;
      const cardHeight = this.outcomeBanner.body.position.y
        + this.outcomeBanner.body.height
        + cardPadding
        - cardTop;
      this.outcomeBanner.panel.clear()
        .roundRect(-130, cardTop, 260, cardHeight, 16)
        .fill({ color: 0x0b3340, alpha: 0.96 })
        .roundRect(-130, cardTop, 260, cardHeight, 16)
        .stroke({ color: 0x78cad6, alpha: 0.8, width: 2 });
    }
    this.currentStatus.text = 'Session ended';
  }

  public endSession(): void {
    this.currentStatus.text = 'Session ended';
    this.clearActiveRipple();
    for (const view of this.nodeVisuals.values()) {
      gsap.killTweensOf(view.art.scale);
      view.art.scale.set(1);
    }
  }

  public destroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.clearSignals();
    gsap.killTweensOf(this.root);
    if (this.pixiInitialized) {
      this.app.destroy(true, { children: true, texture: false });
    }
  }

  private createConversationPanel(): void {
    const panel = new Graphics()
      .roundRect(CONVERSATION_PANEL_X, 105, 340, 220, 16)
      .fill({ color: 0x0b3340, alpha: 0.94 })
      .roundRect(CONVERSATION_PANEL_X, 105, 340, 220, 16)
      .stroke({ color: 0x477f8d, alpha: 0.85, width: 2 });
    this.root.addChild(panel);

    const conversationAsset = getNodeConfig('conversation')?.asset;
    if (conversationAsset && this.loadedAssets.has(conversationAsset)) {
      const conversationNode = getNodeConfig('conversation');
      const artwork = Sprite.from(conversationAsset);
      artwork.anchor.set(0.5);
      if (conversationNode) {
        const scale = Math.min(
          (conversationNode.width - 4) / artwork.texture.width,
          (conversationNode.height - 44) / artwork.texture.height
        );
        artwork.scale.set(scale);
      }
      artwork.position.set(CONVERSATION_ART_POSITION.x, CONVERSATION_ART_POSITION.y);
      this.root.addChild(artwork);
    }

    const heading = new Text({
      text: 'CUSTOMER CONVERSATION',
      style: new TextStyle({
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 13,
        fill: 0x7ce5f0,
        fontWeight: '800',
        letterSpacing: 0.5
      })
    });
    heading.position.set(CONVERSATION_PANEL_X + 18, 121);
    this.root.addChild(heading);

    this.caseLabel.position.set(CONVERSATION_PANEL_X + 18, 146);
    this.currentStatus.position.set(CONVERSATION_PANEL_X + 18, 169);
    this.guidanceText.position.set(CONVERSATION_PANEL_X + 18, 191);
    this.customerResponse.position.set(CONVERSATION_PANEL_X + 18, 245);
    this.root.addChild(this.caseLabel, this.currentStatus, this.guidanceText, this.customerResponse);
  }

  private createSignal(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: number,
    onComplete?: () => void
  ): void {
    const pulse = new Graphics().circle(0, 0, 7).fill(color);
    this.signalLayer.addChild(pulse);
    this.root.addChild(this.signalLayer);
    this.activeSignals.push(pulse);
    gsap.fromTo(
      pulse,
      { x: fromX, y: fromY, alpha: 1 },
      {
        x: toX,
        y: toY,
        alpha: 0.2,
        duration: 1.25,
        ease: 'power1.inOut',
        onComplete: () => {
          this.signalLayer.removeChild(pulse);
          pulse.destroy();
          const index = this.activeSignals.indexOf(pulse);
          if (index >= 0) {
            this.activeSignals.splice(index, 1);
          }
          onComplete?.();
        }
      }
    );
  }

  private clearSignals(): void {
    for (const signal of this.activeSignals) {
      gsap.killTweensOf(signal);
      signal.destroy();
    }
    this.activeSignals.length = 0;
    this.signalLayer.removeChildren();
  }

  private showActiveRipple(nodeId: NodeId): void {
    this.clearActiveRipple();
    if (REDUCED_MOTION || nodeId === 'customer_input') {
      return;
    }

    const config = getNodeConfig(nodeId);
    if (!config) {
      return;
    }

    const ripple = new Container();
    ripple.label = nodeId;
    ripple.position.set(
      config.position.x,
      config.position.y + config.height / 2 - 28
    );
    for (let index = 0; index < 3; index += 1) {
      const ring = new Graphics()
        .ellipse(0, 0, 42, 10)
        .stroke({ color: 0x7ae2ff, alpha: 0.75, width: 2 });
      ripple.addChild(ring);
      gsap.fromTo(
        ring,
        { alpha: 0.75, scale: 0.35 },
        {
          alpha: 0,
          scale: 1.65,
          duration: 1.6,
          delay: index * 0.48,
          repeat: -1,
          ease: 'sine.out'
        }
      );
    }

    const nodeContainer = this.nodeVisuals.get(nodeId)?.container;
    const nodeIndex = nodeContainer ? this.root.children.indexOf(nodeContainer) : -1;
    if (nodeIndex >= 0) {
      this.root.addChildAt(ripple, nodeIndex);
    } else {
      this.root.addChild(ripple);
    }
    this.activeRipple = ripple;
  }

  private clearActiveRipple(nodeId?: NodeId): void {
    if (!this.activeRipple || (nodeId && this.activeRipple.label !== nodeId)) {
      return;
    }
    for (const ring of this.activeRipple.children) {
      gsap.killTweensOf(ring);
    }
    this.activeRipple.parent?.removeChild(this.activeRipple);
    this.activeRipple.destroy({ children: true });
    this.activeRipple = undefined;
  }

  private setNodeStatus(nodeId: NodeId, status: string): void {
    const view = this.nodeVisuals.get(nodeId);
    const config = getNodeConfig(nodeId);
    if (view && config) {
      view.label.text = `${config.displayName}\n${status}`;
    }
  }

  private resizeToHost(): void {
    this.fitScene(this.host.clientWidth, this.host.clientHeight);
  }

  private fitScene(width: number, height: number): void {
    if (!this.root || width <= 0 || height <= 0) {
      return;
    }
    const scale = Math.min(width / SCENE_WIDTH, height / SCENE_HEIGHT);
    this.root.scale.set(scale);
    this.root.position.set((width - SCENE_WIDTH * scale) / 2, (height - SCENE_HEIGHT * scale) / 2);
    if (this.conversationOverlay) {
      this.conversationOverlay.style.left = `${this.root.position.x + CONVERSATION_PANEL_X * scale}px`;
      this.conversationOverlay.style.top = `${this.root.position.y + 105 * scale}px`;
      this.conversationOverlay.style.transform = `scale(${scale})`;
      this.conversationOverlay.style.setProperty('--conversation-font-13', `${13 / scale}px`);
      this.conversationOverlay.style.setProperty('--conversation-font-12', `${12 / scale}px`);
      this.conversationOverlay.style.setProperty('--conversation-font-11', `${11 / scale}px`);
    }
  }
}
