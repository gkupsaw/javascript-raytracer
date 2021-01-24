// const proxifyVec = (vec) =>
//     new Proxy(vec, {
//         get: function (self, prop) {
//             switch (prop) {
//                 case 'r':
//                     return self.x;
//                 case 'g':
//                     return self.y;
//                 case 'b':
//                     return self.z;
//                 case 'a':
//                     return self.w;
//                 default:
//                     return Reflect.get(...arguments);
//             }
//         },
//     });
// vec3 = proxifyVec(vec3);
// vec4 = proxifyVec(vec4);
class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    get r() {
        return this.x;
    }

    get g() {
        return this.y;
    }

    get b() {
        return this.z;
    }
}
class vec4 extends vec3 {
    constructor(x, y, z, w) {
        super(x, y, z);
        this.w = w;
    }

    get a() {
        return this.w;
    }
}

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
                    switch (datum.tagName) {
                        case tagnames.global.DIFFUSE:
                            data.global['diffuse'] = datum.getAttribute('v');
                            break;
                        case tagnames.global.SPECULAR:
                            data.global['specular'] = datum.getAttribute('v');
                            break;
                        case tagnames.global.AMBIENT:
                            data.global['ambient'] = datum.getAttribute('v');
                            break;
                        default:
                            console.error(
                                `Unknown global data tag: ${datum.tagName}`
                            );
                            break;
                    }
                }
                break;
            case LIGHT:
                const light = child;
                const lightData = {};
                for (const attr of light.children) {
                    switch (attr.tagName) {
                        case tagnames.light.ID:
                            lightData['id'] = attr.getAttribute('v');
                            break;
                        case tagnames.light.COLOR:
                            lightData['color'] = extractRGB(attr);
                            break;
                        case tagnames.light.POS:
                            lightData['position'] = extractXYZ(attr);
                            break;
                        default:
                            console.error(
                                `Unknown light data tag: ${attr.tagName}`
                            );
                            break;
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
                            cameraData['position'] = extractXYZ(attr);
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
                data.object.concat(parseObject(child));
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
