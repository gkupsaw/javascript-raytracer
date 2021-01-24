import { vec4 } from '../lib';

const defaultData = {
    global: { ambient: 0.5, diffuse: 0.5, specular: 0.5 },
    camera: {
        pos: new vec4(5, 5, 5, 1),
        up: new vec4(0, 1, 0, 0),
        look: new vec4(-1, -1, -1, 0),
        heightAngle: 45,
        aspectRatio: 1,
    },
    light: [],
    object: [],
};

const GLOBAL = 'globaldata';
const LIGHT = 'lightdata';
const CAMERA = 'cameradata';
const TRANSBLOCK = 'transblock';
const OBJECT = 'object';

const tagnames = {
    global: {
        DIFFUSE: 'diffusecoeff',
        SPECULAR: 'specularcoeff',
        AMBIENT: 'ambientcoeff',
    },
    light: {
        ID: 'id',
        COLOR: 'color',
        POS: 'position',
    },
    camera: {
        POS: 'pos',
        UP: 'up',
    },
    object: {
        DIFFUSE: 'diffuse',
        SPECULAR: 'specular',
        AMBIENT: 'ambient',
    },
    transblock: {
        TRANSLATE: 'translate',
        SCALE: 'scale',
        ROTATE: 'rotate',
    },
};

export { defaultData, GLOBAL, LIGHT, CAMERA, TRANSBLOCK, OBJECT, tagnames };
