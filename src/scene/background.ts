import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export function createBackground(root: Container): void {
  const backdrop = new Graphics().rect(0, 0, 1600, 900).fill(0x062d3b);
  root.addChild(backdrop);

  const title = new Text({
    text: 'POCKET DIAGNOSTICS',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 24,
      fill: 0xf0fbff,
      fontWeight: '800',
      letterSpacing: 1
    })
  });
  title.position.set(45, 28);
  root.addChild(title);

  const subtitle = new Text({
    text: 'First-response workflow  ·  Departments activate only when selected by the case',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 14,
      fill: 0x9fc9d3,
      fontWeight: '500'
    })
  });
  subtitle.position.set(45, 61);
  root.addChild(subtitle);
}
