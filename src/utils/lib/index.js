import {
    dot,
    cross,
    det,
    inv,
    transpose as mat_transpose,
    multiply as mat_mul,
    add as mat_add,
    sum,
    matrix,
    index,
    range,
    subset,
    identity,
    zeros,
    chain,
    sin,
    cos,
    tan,
    atan,
} from 'mathjs';

const normalize = (vec) => mat_mul(vec, 1 / sum(vec));
// const dot = () => console.error('No dot!');
// const mat_inv = () => console.error('No matinv!');
// const mat_transpose = () => console.error('No matranspose!');
// const mat_mul = () => console.error('No matmul!');
const translate = (M, x) => {
    console.error('No translate!');
    return M;
};
const scale = (M, x) => {
    console.error('No scale!');
    return M;
};
const rotate = (M, x, a) => {
    console.error('No rotate!');
    return M;
};
const mat_inv = (M) => {
    if (det(M) === 0) {
        return id4();
    } else {
        return inv(M);
    }
};
const negate = (M) => mat_mul(M, -1);
const xyz = (vec) => subset(vec, index(range(0, 3)));
const radians = (deg) => (deg * Math.PI) / 180;
const degrees = (rad) => (180 * rad) / Math.PI;

const mat3 = (row1, row2, row3) => {
    if (row1 && row2 === undefined && row3 === undefined) {
        const mat4ToShrink = row1;
        mat4ToShrink.resize([3, 3]);
        return mat4ToShrink;
    }
    return matrix([row1, row2, row3]);
};

const mat4x4 = (row1, row2, row3, row4) => matrix([row1, row2, row3, row4]);

const vec3 = (x, y, z) => {
    let vec;

    if (y === undefined && z === undefined) {
        vec = matrix([x, x, x]);
        vec.x = x; // this is really bad, fix it later
        vec.y = x;
        vec.z = x;
    } else {
        vec = matrix([x, y, z]);
        vec.x = x;
        vec.y = y;
        vec.z = z;
    }

    return vec;
};

const vec4 = (x, y, z, w) => {
    let vec;

    if (y === undefined && z === undefined && w === undefined) {
        vec = matrix([x, x, x, x]);
        vec.x = x;
        vec.y = x;
        vec.z = x;
        vec.w = x;
    } else if (z === undefined && w === undefined) {
        x.resize([4], y);
        vec = x;
    } else {
        vec = matrix([x, y, z, w]);
        vec.x = x;
        vec.y = y;
        vec.z = z;
        vec.w = w;
    }

    return vec;
};

const zero_mat4 = () => zeros(4, 4);

const id4 = () => identity(4);

class RGBA {
    constructor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
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
    constructor({ diffuse, ambient, specular, blend, shininess } = {}) {
        this.diffuse = diffuse;
        this.ambient = ambient;
        this.specular = specular;
        this.blend = blend;
        this.shininess = shininess;
    }
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

const clamp = (val, min, max) => Math.max(Math.min(val, max), min);

export {
    vec3,
    vec4,
    mat3,
    mat4x4,
    zero_mat4,
    id4,
    matrix,
    RGBA,
    Ray,
    GlobalData,
    LightData,
    ShapeData,
    IntersectionData,
    Primitive,
    Material,
    Transformation,
    primitiveTypes,
    lightTypes,
    transformationTypes,
    clamp,
    normalize,
    dot,
    cross,
    mat_inv,
    mat_transpose,
    mat_mul,
    mat_add,
    xyz,
    negate,
    translate,
    scale,
    rotate,
    chain,
    sin,
    cos,
    tan,
    atan,
    radians,
    degrees,
};
