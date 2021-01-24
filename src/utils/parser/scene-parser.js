import { vec3 } from '../lib';
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

const extractXYZ = (xmlEl) =>
    new vec3(
        xmlEl.getAttribute('x'),
        xmlEl.getAttribute('y'),
        xmlEl.getAttribute('z')
    );
const extractRGB = (xmlEl) =>
    new vec3(
        xmlEl.getAttribute('r'),
        xmlEl.getAttribute('g'),
        xmlEl.getAttribute('b')
    );

const parseObject = (object, transformations = []) => {
    const name = object.getAttribute('name');
    const type = object.getAttribute('type');
    let objects = [];

    switch (type) {
        case 'primitive':
            let objectData = { type, name, transformations };

            for (const attr of object.children) {
                switch (attr.tagName) {
                    case tagnames.object.DIFFUSE:
                        objectData['diffuse'] = extractRGB(attr);
                        break;
                    case tagnames.object.SPECULAR:
                        objectData['specular'] = extractRGB(attr);

                        break;
                    case tagnames.object.AMBIENT:
                        objectData['ambient'] = extractRGB(attr);
                        break;
                    default:
                        console.error(
                            `Unknown primitive object data tag: ${attr.tagName}`
                        );
                        break;
                }
            }

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
                                case tagnames.transblock.ROTATE:
                                case tagnames.transblock.SCALE:
                                    transformations.push({
                                        type: treeChild.tagName,
                                        vec: extractXYZ(treeChild),
                                    });
                                    break;
                                case OBJECT:
                                    objects.push(
                                        parseObject(treeChild, transformations)
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
                        objects.push(parseObject(attr, transformations));
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
            objects.push({ ...instantiatedObjects[name], type });
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

    // if (scenefiledata.length !== 1) {
    //     console.error(
    //         'No or too many scenefiles in one file. Using first if it exists.'
    //     );
    // }

    let child = scenefile.firstElementChild;
    while (child) {
        switch (child.tagName) {
            case GLOBAL:
                for (const datum of child.children) {
                    let propName, propVal;
                    switch (datum.tagName) {
                        case tagnames.global.DIFFUSE:
                            propName = 'diffuse';
                            propVal = datum.getAttribute('v');
                            break;
                        case tagnames.global.SPECULAR:
                            propName = 'specular';
                            propVal = datum.getAttribute('v');
                            break;
                        case tagnames.global.AMBIENT:
                            propName = 'ambient';
                            propVal = datum.getAttribute('v');
                            break;
                        default:
                            console.error(
                                `Unknown global data tag: ${datum.tagName}`
                            );
                            break;
                    }
                    if (propName) {
                        data.global[propName] = propVal;
                    }
                }
                break;
            case LIGHT:
                const light = child;
                const lightData = {};
                for (const attr of light.children) {
                    let propName, propVal;
                    switch (attr.tagName) {
                        case tagnames.light.ID:
                            propName = 'id';
                            propVal = attr.getAttribute('v');
                            break;
                        case tagnames.light.COLOR:
                            propName = 'color';
                            propVal = extractRGB(attr);
                            break;
                        case tagnames.light.POS:
                            propName = 'position';
                            propVal = extractXYZ(attr);
                            break;
                        default:
                            console.error(
                                `Unknown light data tag: ${attr.tagName}`
                            );
                            break;
                    }
                    if (propName) {
                        data.global[propName] = propVal;
                    }
                }
                data.light.push(lightData);
                break;
            case CAMERA:
                const camera = child;
                const cameraData = {};
                for (const attr of camera.children) {
                    switch (attr.tagName) {
                        case tagnames.camera.POS:
                            cameraData['pos'] = extractXYZ(attr);
                            break;
                        case tagnames.camera.UP:
                            cameraData['up'] = extractXYZ(attr);
                            break;
                        default:
                            console.error(
                                `Unknown camera data tag: ${attr.tagName}`
                            );
                            break;
                    }
                }
                data.camera = cameraData;
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
