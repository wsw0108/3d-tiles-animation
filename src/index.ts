import { TilesRenderer, Tile, TilesRendererEventMap } from "3d-tiles-renderer";
import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"; // !!!  '.js'

interface Cached {
    metadata: GLTF;
    scene: THREE.Object3D;
}

interface TileEx extends Tile {
    cached: Cached;
}

interface TilesRendererPlugin {
    name: string;
    init?: (tiles: TilesRenderer) => void;
    dispose?: () => void;
}

const mixerKey = "__animation_mixer__";

export class AnimationPlugin implements TilesRendererPlugin {
    name: string;

    // @internal
    private tiles?: TilesRenderer;

    // @internal
    private clock: THREE.Clock;

    constructor() {
        this.name = "ANIMATION_PLUGIN";
        this.tiles = undefined;
        this.clock = new THREE.Clock();
    }

    init(tiles: TilesRenderer) {
        this.tiles = tiles;

        tiles.addEventListener("load-model", this._onLoadModel);
        tiles.addEventListener("dispose-model", this._onDisposeModel);

        tiles.traverse((tileObj) => {
            const tile = tileObj as Tile;
            const tileEx = tileObj as TileEx;
            if (tileEx.cached.scene) {
                this._onLoadModel({ scene: tileEx.cached.scene, tile: tile });
            }
            return true;
        }, null);
    }

    // @internal
    _onLoadModel({ scene, tile }: TilesRendererEventMap["load-model"]) {
        const tileEx = tile as TileEx;
        const gltf = tileEx.cached.metadata;

        if (gltf.animations.length === 0) {
            return;
        }

        const mixer = new THREE.AnimationMixer(scene);
        for (const clip of gltf.animations) {
            const action = mixer.clipAction(clip);
            action.play();
        }
        scene.userData[mixerKey] = mixer;
    }

    // @internal
    _onDisposeModel({ scene }: TilesRendererEventMap["dispose-model"]) {
        if (mixerKey in scene.userData) {
            const mixer: THREE.AnimationMixer = scene.userData[mixerKey];
            mixer.stopAllAction();
        }
    }

    dispose() {
        if (!this.tiles) {
            return;
        }

        const tiles = this.tiles!;

        tiles.removeEventListener("load-model", this._onLoadModel);
        tiles.removeEventListener("dispose-model", this._onDisposeModel);
    }

    update() {
        if (!this.tiles) {
            return;
        }

        const tiles = this.tiles!;

        tiles.forEachLoadedModel((scene) => {
            if (mixerKey in scene.userData) {
                const mixer: THREE.AnimationMixer = scene.userData[mixerKey];
                const delta = this.clock.getDelta();
                mixer.update(delta);
            }
        });

        THREE.Group.prototype.updateMatrixWorld.call(tiles.group, true);
    }
}
