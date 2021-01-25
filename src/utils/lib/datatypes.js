import { vec4 } from './glm';

const primitiveTypes = {
    CONE: 'cone',
    CYLINDER: 'cylinder',
    CUBE: 'cube',
    SPHERE: 'sphere',
    UNK: 'UNK',
};

const lightTypes = {
    POINT: 'point',
    DIRECTIONAL: 'directional',
    UNK: 'UNK',
};

const transformationTypes = {
    TRANSLATE: 'translate',
    ROTATE: 'rotate',
    SCALE: 'scale',
    UNK: 'UNK',
};

class DataType {
    setProperty = (propName, val) => {
        if (this.hasOwnProperty(propName)) {
            this[propName] = val;
        } else {
            console.error(
                `Bad property name given to setProperty for DataType: ${propName}`
            );
        }
    };
}

class RGBA extends DataType {
    constructor(r, g, b, a) {
        super();
        this.r = parseInt(r) ?? 1;
        this.g = parseInt(g) ?? 1;
        this.b = parseInt(b) ?? 1;
        this.a = parseInt(a) ?? 1;
    }
}

class Ray extends DataType {
    constructor(eye, dir) {
        super();
        this.eye = eye;
        this.dir = dir;
    }
}

class GlobalData extends DataType {
    constructor({ kd, ka, ks } = {}) {
        super();
        this.kd = kd;
        this.ka = ka;
        this.ks = ks;
    }
}

class LightData extends DataType {
    constructor({ id, type, color, func, pos, dir } = {}) {
        super();
        this.id = id;
        this.type = type;
        this.color = color;
        this.func = func;
        this.pos = pos;
        this.dir = dir;
    }
}

class ShapeData extends DataType {
    constructor({
        primitive,
        transformation,
        inverseTransformation,
        texture,
    } = {}) {
        super();
        this.primitive = primitive ?? new Primitive();
        this.transformation = transformation;
        this.inverseTransformation = inverseTransformation;
        this.texture = texture;
    }
}

class IntersectionData extends DataType {
    constructor(normal, t, shape) {
        super();
        this.normal = normal;
        this.t = t ?? Infinity;
        this.shape = shape ?? new ShapeData();
    }
}

class Primitive extends DataType {
    constructor({ type, meshfile, material } = {}) {
        super();
        this.type = type ?? primitiveTypes.UNK;
        this.meshfile = meshfile;
        this.material = material ?? new Material();
    }
}

class Material extends DataType {
    constructor({
        cDiffuse,
        cAmbient,
        cSpecular,
        cReflective,
        blend,
        shininess,
    } = {}) {
        super();
        this.cDiffuse = cDiffuse;
        this.cAmbient = cAmbient;
        this.cSpecular = cSpecular;
        this.cReflective = cReflective;
        this.blend = blend;
        this.shininess = shininess;
    }
}

class Transformation extends DataType {
    constructor({ type, translate, scale, rotate, angle, matrix } = {}) {
        super();
        this.type = type ?? transformationTypes.UNK;
        this.translate = translate;
        this.scale = scale;
        this.rotate = rotate;
        this.angle = angle;
        this.matrix = matrix;
    }
}

class CanvasData {
    dataSize = 4;

    constructor(size) {
        this.data = new Uint8ClampedArray(size * this.dataSize);
    }

    set = (val, index) => {
        if (isNaN(val)) {
            const vec = val;
            if (vec.forEach) {
                vec.forEach((v, i) => {
                    const indivIndex = i.length ? i[0] : i;
                    this.data[this.dataSize * index + indivIndex] = v;
                });
            } else {
                console.error('Bad arg for setting CanvasData');
            }
        } else {
            this.data[index] = val;
        }
    };

    get = () => this.data;
}

class Canvas {
    constructor(height, width) {
        this.height_val = height;
        this.width_val = width;
        this.pixel_data = new CanvasData(height * width);
    }

    height = () => this.height_val;
    width = () => this.width_val;
    data = () => this.pixel_data;
    update = () => {};
}

export {
    primitiveTypes,
    lightTypes,
    transformationTypes,
    RGBA,
    Ray,
    GlobalData,
    LightData,
    ShapeData,
    IntersectionData,
    Primitive,
    Material,
    Transformation,
    CanvasData,
    Canvas,
};
