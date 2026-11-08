import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';
import type { NodeDefinition } from '../nodes/node-config';

export function createCentralEngineScene(
  root: Container,
  node: NodeDefinition,
  assetAvailable: boolean
): void {
  const container = new Container();
  const center = node.position;

  if (assetAvailable && node.asset) {
    const artwork = Sprite.from(node.asset);
    artwork.anchor.set(0.5);
    const scale = Math.min((node.width - 18) / artwork.texture.width, node.height / artwork.texture.height);
    artwork.scale.set(scale);
    artwork.position.set(center.x, center.y);
    container.addChild(artwork);
  } else {
    const scene = new Graphics();
    scene.ellipse(0, 60, 130, 28).fill({ color: 0x041d27, alpha: 0.65 });
    scene.roundRect(-112, 6, 224, 67, 10).fill(0x567985);
    scene.roundRect(-112, -5, 224, 22, 8).fill(0xd0e2e4);
    scene.rect(-99, 60, 10, 47).fill(0x819ca2);
    scene.rect(90, 60, 10, 47).fill(0x819ca2);
    scene.roundRect(-81, -85, 67, 59, 5).fill(0xdce9e9);
    scene.roundRect(-74, -78, 53, 43, 3).fill(0x124b5c);
    scene.roundRect(16, -100, 79, 74, 5).fill(0xdce9e9);
    scene.roundRect(23, -93, 65, 58, 3).fill(0x124b5c);
    scene.roundRect(-6, -23, 12, 20, 3).fill(0x607a82);
    scene.circle(0, -57, 14).fill(0xe4b48b);
    scene.roundRect(-17, -42, 34, 41, 10).fill(0x358e9c);
    scene.moveTo(-11, -7).lineTo(-18, 19).stroke({ color: 0x203e47, width: 8 });
    scene.moveTo(11, -7).lineTo(18, 19).stroke({ color: 0x203e47, width: 8 });
    scene.roundRect(-105, -2, 24, 8, 2).fill(0x77dded);
    scene.roundRect(76, -2, 24, 8, 2).fill(0x77dded);
    scene.position.set(center.x, center.y);
    container.addChild(scene);

    const artworkLabel = new Text({
      text: 'VECTOR ART PLACEHOLDER',
      style: new TextStyle({
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 9,
        fill: 0x9fc9d3,
        fontWeight: '700',
        align: 'center',
        letterSpacing: 0.4
      })
    });
    artworkLabel.anchor.set(0.5);
    artworkLabel.position.set(center.x, center.y + 155);
    container.addChild(artworkLabel);
  }

  const label = new Text({
    text: 'EXPERT GUIDANCE ENGINE',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 17,
      fill: 0x9cf6ff,
      fontWeight: '800',
      align: 'center',
      letterSpacing: 0.5
    })
  });
  label.anchor.set(0.5);
  label.position.set(center.x, center.y + 100);
  container.addChild(label);

  // const artworkLabel = new Text({
  //   text: 'VECTOR ART PLACEHOLDER',
  //   style: new TextStyle({
  //     fontFamily: 'Segoe UI, sans-serif',
  //     fontSize: 9,
  //     fill: 0x9fc9d3,
  //     fontWeight: '700',
  //     align: 'center',
  //     letterSpacing: 0.4
  //   })
  // });
  // artworkLabel.anchor.set(0.5);
  // artworkLabel.position.set(center.x, center.y + 155);
  // container.addChild(artworkLabel);
  root.addChild(container);
  root.addChild(container);
}
