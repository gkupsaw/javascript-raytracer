import { RGBA, vec4 } from '../lib';

const defaultData = {
    global: { ka: 1, kd: 1, ks: 1 },
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
        cDiffuse: vec4(0, 0, 0, 1), // new RGBA
        cAmbient: vec4(0, 0, 0, 1), // new RGBA
        cSpecular: vec4(0, 0, 0, 1), // new RGBA
        cReflective: vec4(0, 0, 0, 1), // new RGBA
        shininess: 0.5,
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
        FUNC: 'function'
    },
    camera: {
        POS: 'pos',
        UP: 'up',
        HEIGHTANGLE: 'thetaH',
        FOCUS: 'focus'
    },
    object: {
        DIFFUSE: { name: 'diffuse', propName: 'cDiffuse' },
        SPECULAR: { name: 'specular', propName: 'cSpecular' },
        AMBIENT: { name: 'ambient', propName: 'cAmbient' },
        REFLECTIVE: { name: 'reflective', propName: 'cReflective' },
        SHININESS: { name: 'shininess', propName: 'shininess' },
        BLEND: { name: 'blend', propName: 'blend' },
    },
    transblock: {
        TRANSLATE: 'translate',
        SCALE: 'scale',
        ROTATE: 'rotate',
    },
};

export { defaultData, GLOBAL, LIGHT, CAMERA, TRANSBLOCK, OBJECT, tagnames };
