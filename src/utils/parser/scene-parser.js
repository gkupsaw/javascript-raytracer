import {
    vec3,
    vec4,
    zero_mat4,
    RGBA,
    GlobalData,
    LightData,
    ShapeData,
    lightTypes,
    Primitive,
    Material,
    mat_inv,
    translate,
    scale,
    rotate,
} from '../lib';
import {
    defaultData,
    GLOBAL,
    LIGHT,
    CAMERA,
    TRANSBLOCK,
    OBJECT,
    tagnames,
} from './constants';

let instantiatedObjects = {}; // TODO: make this non-global

const getPosition = (xmlEl) =>
    new vec4(
        xmlEl.getAttribute('x'),
        xmlEl.getAttribute('y'),
        xmlEl.getAttribute('z'),
        1
    );
const getDirection = (xmlEl) =>
    new vec4(
        xmlEl.getAttribute('x'),
        xmlEl.getAttribute('y'),
        xmlEl.getAttribute('z'),
        0
    );
const getRGBA = (xmlEl) =>
    new RGBA(
        xmlEl.getAttribute('r'),
        xmlEl.getAttribute('g'),
        xmlEl.getAttribute('b'),
        1
    );

const parseGlobal = (global) => {
    let globalData = new GlobalData();

    for (const datum of global.children) {
        let propName, propVal;
        switch (datum.tagName) {
            case tagnames.global.DIFFUSE:
                propName = 'kd';
                propVal = datum.getAttribute('v');
                break;
            case tagnames.global.SPECULAR:
                propName = 'ks';
                propVal = datum.getAttribute('v');
                break;
            case tagnames.global.AMBIENT:
                propName = 'ka';
                propVal = datum.getAttribute('v');
                break;
            default:
                console.error(`Unknown global data tag: ${datum.tagName}`);
                break;
        }
        if (propName) {
            globalData[propName] = propVal;
        }
    }

    return globalData;
};

const parseCamera = (camera) => {
    let cameraData = {};

    for (const attr of camera.children) {
        switch (attr.tagName) {
            case tagnames.camera.POS:
                cameraData['pos'] = getPosition(attr);
                break;
            case tagnames.camera.UP:
                cameraData['up'] = getDirection(attr);
                break;
            default:
                console.error(`Unknown camera data tag: ${attr.tagName}`);
                break;
        }
    }

    return cameraData;
};

const parseLight = (light) => {
    let lightData = new LightData({
        type: lightTypes.POINT,
        func: new vec3(1, 0, 0),
    });

    for (const attr of light.children) {
        let propName, propVal;
        switch (attr.tagName) {
            case tagnames.light.ID:
                propName = 'id';
                propVal = attr.getAttribute('v');
                break;
            case tagnames.light.COLOR:
                propName = 'color';
                propVal = getRGBA(attr);
                break;
            case tagnames.light.POS:
                propName = 'position';
                propVal = getPosition(attr);
                break;
            default:
                console.error(`Unknown light data tag: ${attr.tagName}`);
                break;
        }
        if (propName) {
            lightData[propName] = propVal;
        }
    }

    return lightData;
};

const parseObject = (object, transformation = zero_mat4()) => {
    const name = object.getAttribute('name');
    const type = object.getAttribute('type');
    let objects = [];

    switch (type) {
        case 'primitive':
            let material = new Material();

            for (const attr of object.children) {
                switch (attr.tagName) {
                    case tagnames.object.DIFFUSE:
                        material.diffuse = getRGBA(attr);
                        break;
                    case tagnames.object.SPECULAR:
                        material.specular = getRGBA(attr);
                        break;
                    case tagnames.object.AMBIENT:
                        material.ambient = getRGBA(attr);
                        break;
                    default:
                        console.error(
                            `Unknown primitive object data tag: ${attr.tagName}`
                        );
                        break;
                }
            }

            const primitive = new Primitive({ type: name, material });
            const objectData = new ShapeData({
                primitive,
                transformation,
                inverseTransformation: mat_inv(transformation),
            });

            if (!instantiatedObjects[name]) {
                instantiatedObjects[name] = objectData;
            }

            objects.push(objectData);
            break;
        case 'tree':
            for (const attr of object.children) {
                switch (attr.tagName) {
                    case TRANSBLOCK:
                        for (const treeChild of attr.children) {
                            switch (treeChild.tagName) {
                                case tagnames.transblock.TRANSLATE:
                                    transformation = translate(
                                        transformation,
                                        getPosition(treeChild)
                                    );
                                    break;
                                case tagnames.transblock.ROTATE:
                                    transformation = rotate(
                                        transformation,
                                        treeChild.getAttribute('angle'),
                                        getPosition(treeChild)
                                    );
                                    break;
                                case tagnames.transblock.SCALE:
                                    transformation = scale(
                                        transformation,
                                        getPosition(treeChild)
                                    );
                                    break;
                                case OBJECT:
                                    objects = objects.concat(
                                        parseObject(treeChild, transformation)
                                    );
                                    break;
                                default:
                                    console.error(
                                        `Unknown treeChild data tag: ${treeChild.tagName}`
                                    );
                            }
                        }
                        break;
                    case OBJECT:
                        objects.push(parseObject(attr, transformation));
                        break;
                    default:
                        console.error(
                            `Unknown root object data tag: ${attr.tagName}`
                        );
                        break;
                }
            }
            break;
        case 'instance':
            objects.push(new ShapeData({ ...instantiatedObjects[name] }));
            break;
        default:
            console.error(`Unknown object type tag: ${type}`);
            break;
    }

    return objects;
};

const parse = (scene) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(scene, 'text/xml');

    let data = { ...defaultData };

    const scenefile = xmlDoc.getElementsByTagName('scenefile')[0];

    let child = scenefile.firstElementChild;
    while (child) {
        switch (child.tagName) {
            case GLOBAL:
                data.global = parseGlobal(child);
                break;
            case LIGHT:
                data.light.push(parseLight(child));
                break;
            case CAMERA:
                data.camera = parseCamera(child);
                break;
            case OBJECT:
                data.object = data.object.concat(parseObject(child));
                break;
            default:
                console.error(`Unknown root child tag: ${child.tagName}`);
                break;
        }

        child = child.nextElementSibling;
    }

    return data;
};

const main = (scenefilePath) => {
    const scene = null;
    const scenegraph = parse(scene);
    return scenegraph;
};

export { parse, main };
