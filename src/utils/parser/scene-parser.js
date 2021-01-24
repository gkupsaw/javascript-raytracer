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
        TRANSBLOCK: 'transblock',
        DIFFUSE: 'diffuse',
        SPECULAR: 'specular',
        AMBIENT: 'ambient',
    },
    transform: {
        TRANSLATE: 'translate',
        SCALE: 'scale',
        ROTATE: 'rotate',
    },
};
let instantiatedObjects = {}; // TODO: make this non-global

const parseObject = (object, transformData = {}) => {
    const name = object.getAttribute('name');
    const type = object.getAttribute('type');
    let objects = [];

    switch (type) {
        case 'primitive':
            let objectData = { type, name };

            for (const attr of object.children) {
                switch (attr.tagName) {
                    case tagnames.object.DIFFUSE:
                        objectData['diffuse'] = new vec3(
                            attr.getAttribute('r'),
                            attr.getAttribute('g'),
                            attr.getAttribute('b')
                        );
                        break;
                    case tagnames.object.SPECULAR:
                        objectData['specular'] = new vec3(
                            attr.getAttribute('r'),
                            attr.getAttribute('g'),
                            attr.getAttribute('b')
                        );
                        break;
                    case tagnames.object.AMBIENT:
                        objectData['ambient'] = new vec3(
                            attr.getAttribute('r'),
                            attr.getAttribute('g'),
                            attr.getAttribute('b')
                        );
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
                    case tagnames.object.TRANSBLOCK:
                        for (const transform of attr.children) {
                            switch (transform.tagName) {
                                case tagnames.transform.TRANSLATE:
                                    transformData['translate'] = {
                                        x: attr.getAttribute('x'),
                                        y: attr.getAttribute('y'),
                                        z: attr.getAttribute('z'),
                                    };
                                    break;
                                case tagnames.transform.ROTATE:
                                    transformData['rotate'] = {
                                        x: attr.getAttribute('x'),
                                        y: attr.getAttribute('y'),
                                        z: attr.getAttribute('z'),
                                    };
                                    break;
                                case tagnames.transform.SCALE:
                                    transformData['scale'] = {
                                        x: attr.getAttribute('x'),
                                        y: attr.getAttribute('y'),
                                        z: attr.getAttribute('z'),
                                    };
                                    break;
                            }
                        }
                        break;
                    case 'object':
                        objects.push(parseObject(attr, transformData));
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

    const globaldata = xmlDoc.getElementsByTagName('globaldata');
    const lights = xmlDoc.getElementsByTagName('lightdata');
    const cameras = xmlDoc.getElementsByTagName('cameradata');
    const objects = xmlDoc.getElementsByTagName('object');

    if (globaldata.length > 1) {
        console.error('Multiple global data given. Last one will be used.');
    }

    for (const datum of globaldata[globaldata.length - 1].children) {
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
                console.error(`Unknown global data tag: ${datum.tagName}`);
                break;
        }
    }

    for (const light of lights) {
        const lightData = {};
        for (const attr of light.children) {
            switch (attr.tagName) {
                case tagnames.light.ID:
                    lightData['id'] = attr.getAttribute('v');
                    break;
                case tagnames.light.COLOR:
                    lightData['color'] = new vec3(
                        attr.getAttribute('r'),
                        attr.getAttribute('g'),
                        attr.getAttribute('b')
                    );
                    break;
                case tagnames.light.POS:
                    lightData['position'] = new vec3(
                        attr.getAttribute('x'),
                        attr.getAttribute('y'),
                        attr.getAttribute('z')
                    );
                    break;
                default:
                    console.error(`Unknown light data tag: ${attr.tagName}`);
                    break;
            }
        }
        data.light.push(lightData);
    }

    for (const camera of cameras) {
        const cameraData = {};
        for (const attr of camera.children) {
            switch (attr.tagName) {
                case tagnames.camera.POS:
                    cameraData['position'] = new vec3(
                        attr.getAttribute('x'),
                        attr.getAttribute('y'),
                        attr.getAttribute('z')
                    );
                    break;
                case tagnames.camera.UP:
                    cameraData['up'] = new vec3(
                        attr.getAttribute('x'),
                        attr.getAttribute('y'),
                        attr.getAttribute('z')
                    );
                    break;
                default:
                    console.error(`Unknown camera data tag: ${attr.tagName}`);
                    break;
            }
        }
        data.camera = cameraData;
    }

    for (const object of objects) {
        data.object.concat(parseObject(object));
    }

    return data;
};

const main = (scenefilePath) => {
    const scene = null;
    const scenegraph = parse(scene);
    return scenegraph;
};

export { parse, main };
