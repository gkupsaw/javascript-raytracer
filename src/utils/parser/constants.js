import { RGBA, vec4 } from '../lib';

const defaultData = {
    global: { cAmbient: 0.5, cDiffuse: 0.5, cSpecular: 0.5 },
    camera: {
        pos: vec4(5, 5, 5, 1),
        up: vec4(0, 1, 0, 0),
        look: vec4(-1, -1, -1, 0),
        heightAngle: 45,
        aspectRatio: 1,
    },
    light: [],
    object: [],

    material: {
        cDiffuse: new RGBA(0.5, 0.5, 0.5, 1),
        cAmbient: new RGBA(0.5, 0.5, 0.5, 1),
        cSpecular: new RGBA(0.5, 0.5, 0.5, 1),
    },
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
