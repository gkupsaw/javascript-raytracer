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

class RGBA {
    constructor(r, g, b, a) {
        this.r = parseInt(r);
        this.g = parseInt(g);
        this.b = parseInt(b);
        this.a = parseInt(a) ?? 1;
    }
}

class Ray {
    constructor(eye, dir) {
        this.eye = eye;
        this.dir = dir;
    }
}

class GlobalData {
    constructor({ kd, ka, ks } = {}) {
        this.kd = kd;
        this.ka = ka;
        this.ks = ks;
    }
}

class LightData {
    constructor({ id, type, color, func, pos, dir } = {}) {
        this.id = id;
        this.type = type;
        this.color = color;
        this.func = func;
        this.pos = pos;
        this.dir = dir;
    }
}

class ShapeData {
    constructor({
        primitive,
        transformation,
        inverseTransformation,
        texture,
    } = {}) {
        this.primitive = primitive ?? new Primitive();
        this.transformation = transformation;
        this.inverseTransformation = inverseTransformation;
        this.texture = texture;
    }
}

class IntersectionData {
    constructor(normal, t, shape) {
        this.normal = normal;
        this.t = t ?? Infinity;
        this.shape = shape ?? new ShapeData();
    }
}

class Primitive {
    constructor({ type, meshfile, material } = {}) {
        this.type = type ?? primitiveTypes.UNK;
        this.meshfile = meshfile;
        this.material = material ?? new Material();
    }
}

class Material {
    constructor({
        cDiffuse,
        cAmbient,
        cSpecular,
        cReflective,
        blend,
        shininess,
    } = {}) {
        this.cDiffuse = cDiffuse;
        this.cAmbient = cAmbient;
        this.cSpecular = cSpecular;
        this.cReflective = cReflective;
        this.blend = blend;
        this.shininess = shininess;
    }

    setAmbient = (cAmbient) => (this.cAmbient = cAmbient);
    setDiffuse = (cDiffuse) => (this.cDiffuse = cDiffuse);
    setSpecular = (cSpecular) => (this.cSpecular = cSpecular);
    setReflective = (cReflective) => (this.cReflective = cReflective);
}

class Transformation {
    constructor({ type, translate, scale, rotate, angle, matrix } = {}) {
        this.type = type ?? transformationTypes.UNK;
        this.translate = translate;
        this.scale = scale;
        this.rotate = rotate;
        this.angle = angle;
        this.matrix = matrix;
    }
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
};
