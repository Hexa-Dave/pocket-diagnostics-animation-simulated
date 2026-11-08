import { Container, Graphics, Rectangle, Sprite, Text, TextStyle } from 'pixi.js';
import type { NodeDefinition } from '../nodes/node-config';
import { SYMPTOMS, type CustomerInput } from '../nodes/symptom-workflows';

export function createDepartmentNodeVisual(
  node: NodeDefinition,
  assetAvailable: boolean,
  onCustomerInputSubmit?: (input: CustomerInput) => void
): {
  container: Container;
  art: Container;
  label: Text;
  resetInput: () => void;
} {
  const container = new Container();
  const labelOverArtwork = ['A', 'B', 'C', 'D', 'E'].includes(node.id);
  const panel = new Graphics()
    .roundRect(-node.width / 2, -node.height / 2, node.width, node.height, 16)
    // .fill({ color: 0x0b3340, alpha: 0.34 })
    .roundRect(-node.width / 2, -node.height / 2, node.width, node.height, 16)
    // .stroke({ color: node.accent, alpha: 0.26, width: 1.5 });
  panel.position.set(node.position.x, node.position.y);

  const art = new Container();
  art.position.set(node.position.x, node.position.y - 7);

  let resetInput = (): void => {};
  let updateCustomerInputLayout = (_expanded: boolean): void => {};
  if (assetAvailable && node.asset) {
    const sprite = Sprite.from(node.asset);
    sprite.anchor.set(0.5);
    const scale = node.artWidth
      ? node.artWidth / sprite.texture.width
      : Math.min((node.width - 18) / sprite.texture.width, (node.height - 44) / sprite.texture.height);
    sprite.scale.set(scale);
    art.addChild(sprite);
  } else {
    drawPlaceholderWorkstation(art, node.accent, !labelOverArtwork);
  }
  if (node.id === 'customer_input') {
    resetInput = createCustomerInputChecklist(
      art,
      onCustomerInputSubmit,
      (expanded) => updateCustomerInputLayout(expanded)
    );
  }

  const customerInputLabelY = node.position.y + node.height / 2 + 15;
  const labelY = labelOverArtwork
    ? node.position.y + node.height / 2 + 5
    : node.id === 'customer_input'
      ? customerInputLabelY
      : node.position.y + node.height / 2 + 12;
  const label = new Text({
    text: `${node.displayName}\nWaiting`,
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 12,
      fill: 0xf1fdfd,
      fontWeight: '700',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: node.width - 18
    })
  });
  label.anchor.set(0.5);
  label.position.set(node.position.x, labelY);
  updateCustomerInputLayout = (expanded): void => {
    if (node.id === 'customer_input') {
      const inputX = node.position.x - (expanded ? 75 : 0);
      art.position.x = inputX;
      label.position.x = inputX;
    }
  };

  container.addChild(panel, art);
  container.addChild(label);
  return { container, art, label, resetInput };
}

function createCustomerInputChecklist(
  container: Container,
  onSubmit?: (input: CustomerInput) => void,
  onExpansionChange?: (expanded: boolean) => void
): () => void {
  const panel = new Container();
  panel.position.set(-55, 130);
  panel.eventMode = 'static';
  container.addChild(panel);

  const card = new Graphics();
  panel.addChild(card);

  let expanded = false;
  const heading = new Text({
    text: 'FEATURES',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 10,
      fill: 0x9cf6ff,
      fontWeight: '800',
      letterSpacing: 0.5
    })
  });
  heading.anchor.set(0.5);
  heading.position.set(55, 10);
  panel.addChild(heading);

  const options = new Map<string, { selected: boolean; redraw: () => void; view: Container }>();
  const expandedContent = new Container();
  panel.addChild(expandedContent);

  const drawCard = (): void => {
    const width = expanded ? 370 : 110;
    const height = expanded ? 200 : 24;
    panel.position.set(expanded ? 120 : -55, expanded ? -70 : 130);
    card.clear()
      .roundRect(0, 0, width, height, 8)
      .fill({ color: 0x082b36, alpha: 0.97 })
      .stroke({ color: 0x71dceb, alpha: 0.9, width: 1.5 });
    panel.hitArea = expanded
      ? new Rectangle(-177, -2, 549, 228)
      : new Rectangle(-2, -202, 549, 228);
    heading.position.x = width / 2;
    expandedContent.visible = expanded;
  };
  const setExpanded = (value: boolean): void => {
    if (expanded !== value) {
      expanded = value;
      drawCard();
      onExpansionChange?.(expanded);
    }
  };
  panel.on('pointerover', () => setExpanded(true));
  panel.on('pointerleave', () => setExpanded(false));

  const addOption = (key: string, textLabel: string, x: number, y: number, width: number): void => {
    const option = new Container();
    option.position.set(x, y);

    const checkbox = new Graphics();
    const redraw = (): void => {
      checkbox.clear()
        .roundRect(0, 0, 11, 11, 2)
        .fill({ color: options.get(key)?.selected ? 0x4bd4e4 : 0x103d49 })
        .stroke({ color: 0xa5eaf1, width: 1 });
      if (options.get(key)?.selected) {
        checkbox
          .moveTo(2.5, 5.5)
          .lineTo(4.5, 8)
          .lineTo(8.5, 3)
          .stroke({ color: 0x062d3b, width: 1.8 });
      }
    };
    option.addChild(checkbox);

    const text = new Text({
      text: textLabel,
      style: new TextStyle({
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 8,
        fill: 0xf1fdfd,
        fontWeight: '600'
      })
    });
    text.position.set(15, -1);
    option.addChild(text);

    const selection = { selected: false, redraw, view: option };
    options.set(key, selection);
    redraw();
    option.eventMode = 'static';
    option.cursor = 'pointer';
    option.hitArea = new Rectangle(-2, -3, width, 17);
    option.on('pointertap', () => {
      selection.selected = !selection.selected;
      redraw();
    });
    expandedContent.addChild(option);
  };

  addOption('Appliance', 'Appliance', 12, 29, 165);
  addOption('Model', 'Model', 190, 29, 165);
  addOption('Age', 'Age', 12, 45, 165);
  addOption('Insurance/Warranty', 'Insurance/Warranty', 190, 45, 165);

  const symptomsHeading = new Text({
    text: 'SYMPTOM OPTIONS',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 8,
      fill: 0xb9d9df,
      fontWeight: '700',
      letterSpacing: 0.3
    })
  });
  symptomsHeading.position.set(12, 62);
  expandedContent.addChild(symptomsHeading);

  SYMPTOMS.forEach((symptom, index) => {
    const column = Math.floor(index / 6);
    const row = index % 6;
    addOption(
      `symptom:${symptom.code}`,
      `${symptom.code}. ${symptom.label}`,
      12 + column * 178,
      76 + row * 14,
      165
    );
  });

  const symptomSelection = (): string[] => [...options]
    .filter(([key, option]) => key.startsWith('symptom:') && option.selected)
    .map(([key]) => key.slice('symptom:'.length));

  const inputSelection = (): CustomerInput => ({
    appliance: options.get('Appliance')?.selected ?? false,
    model: options.get('Model')?.selected ?? false,
    age: options.get('Age')?.selected ?? false,
    insuranceWarranty: options.get('Insurance/Warranty')?.selected ?? false,
    symptoms: symptomSelection()
  });

  const sendButton = new Container();
  sendButton.position.set(185, 177);
  const sendBackground = new Graphics();
  sendBackground.roundRect(-31, 0, 62, 16, 5);
  sendButton.addChild(sendBackground);
  const sendLabel = new Text({
    text: 'SEND',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 9,
      fill: 0x062d3b,
      fontWeight: '800',
      align: 'center',
      letterSpacing: 0.5
    })
  });
  sendLabel.anchor.set(0.5);
  sendLabel.position.set(0, 8);
  sendButton.addChild(sendLabel);
  sendButton.eventMode = 'static';
  sendButton.cursor = 'pointer';
  sendButton.hitArea = new Rectangle(-34, -2, 68, 20);
  const redrawSendButton = (): void => {
    const hasSelection = symptomSelection().length > 0;
    sendBackground.clear()
      .roundRect(-31, 0, 62, 16, 5)
      .fill({ color: hasSelection ? 0x69e2c3 : 0x66828a, alpha: 0.95 });
    sendLabel.style.fill = hasSelection ? 0x062d3b : 0xd5e1e3;
    sendButton.cursor = hasSelection ? 'pointer' : 'default';
  };
  for (const { view } of options.values()) {
    view.on('pointertap', redrawSendButton);
  }
  sendButton.on('pointertap', () => {
    const input = inputSelection();
    if (input.symptoms.length > 0) {
      onSubmit?.(input);
    }
  });
  expandedContent.addChild(sendButton);
  drawCard();
  redrawSendButton();

  return () => {
    for (const option of options.values()) {
      option.selected = false;
      option.redraw();
    }
    redrawSendButton();
    setExpanded(false);
  };
}

function drawPlaceholderWorkstation(container: Container, accent: string, showLabel = true): void {
  const art = new Graphics();
  art.roundRect(-42, 4, 84, 8, 3).fill({ color: 0x9bb7bd, alpha: 0.95 });
  art.rect(-34, 12, 5, 15).fill({ color: 0x718c94 });
  art.rect(29, 12, 5, 15).fill({ color: 0x718c94 });
  art.roundRect(-18, -31, 39, 29, 3).fill({ color: 0xd8e7e7 });
  art.roundRect(-14, -27, 31, 20, 2).fill({ color: 0x174d5b });
  art.circle(-3, -18, 5).fill({ color: accent });
  art.rect(-5, -12, 4, 9).fill({ color: accent });
  art.circle(31, -25, 6).fill({ color: 0xe9bb91 });
  art.roundRect(24, -18, 14, 21, 5).fill({ color: 0x59a6b0 });
  art.moveTo(27, 2).lineTo(24, 11).stroke({ color: 0x254751, width: 4 });
  art.moveTo(35, 2).lineTo(38, 11).stroke({ color: 0x254751, width: 4 });
  container.addChild(art);

  if (showLabel) {
    const placeholderLabel = new Text({
      text: 'VECTOR ART PLACEHOLDER',
      style: new TextStyle({
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 8,
        fill: 0x9fc9d3,
        fontWeight: '700',
        align: 'center',
        letterSpacing: 0.4
      })
    });
    placeholderLabel.anchor.set(0.5);
    placeholderLabel.position.set(0, 40);
    container.addChild(placeholderLabel);
  }
}
