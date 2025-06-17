# 3d-tiles-animation

Animation plugin for 3d-tiles-renderer.

Usage:

```typescript
import { AnimationPlugin } from '3d-tiles-animation';

const renderer = new WebGLRenderer({ antialias: true });

const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);

const tilesRenderer = new TilesRenderer('/path/to/tileset.json');
tilesRenderer.setCamera(camera);

const animationPlugin = new AnimationPlugin();
tilesRenderer.registerPlugin(animationPlugin);

renderer.setAnimationLoop(animate);

function animate() {
    tilesRenderer.setResolutionFromRenderer(camera, renderer);
    tilesRenderer.update();
    animationPlugin.update();

    renderer.render(scene, camera);
}
```
