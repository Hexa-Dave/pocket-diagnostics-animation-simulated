import { Container, Graphics, Sprite, Text, TextStyle } from 'pixi.js';

export function createOutcomeBanner(technicianArtworkPath?: string): {
  container: Container;
  panel: Graphics;
  icon: Graphics;
  technicianArtwork: Sprite | null;
  title: Text;
  body: Text;
} {
  const container = new Container();
  const panel = new Graphics()
    .roundRect(-105, -75, 210, 150, 16)
    .fill({ color: 0x0b3340, alpha: 0.96 })
    .roundRect(-105, -75, 210, 150, 16)
    .stroke({ color: 0x78cad6, alpha: 0.8, width: 2 });
  panel.position.set(1480, 475);
  container.addChild(panel);

  const icon = new Graphics();
  icon.position.set(1480, 425);
  container.addChild(icon);

  let technicianArtwork: Sprite | null = null;
  if (technicianArtworkPath) {
    technicianArtwork = Sprite.from(technicianArtworkPath);
    technicianArtwork.anchor.set(0.5);
    const scale = Math.min(
      95 / technicianArtwork.texture.width,
      128 / technicianArtwork.texture.height
    );
    technicianArtwork.scale.set(scale);
    technicianArtwork.position.set(1480, 432);
    technicianArtwork.visible = false;
    container.addChild(technicianArtwork);
  }

  const title = new Text({
    text: 'Session outcome',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 17,
      fill: 0xf0fbff,
      fontWeight: '800',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 188
    })
  });
  title.anchor.set(0.5);
  title.position.set(1480, 470);
  container.addChild(title);

  const body = new Text({
    text: 'No terminal outcome yet',
    style: new TextStyle({
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: 14,
      fill: 0xc3dde3,
      fontWeight: '500',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 180
    })
  });
  body.anchor.set(0.5);
  body.position.set(1480, 515);
  container.addChild(body);

  container.visible = false;
  return { container, panel, icon, technicianArtwork, title, body };
}
