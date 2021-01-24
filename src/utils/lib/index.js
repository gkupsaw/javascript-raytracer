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
    Matrix,
} from 'mathjs';

Matrix.x = function () {
    'hi';
};

matrix().x();

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

const proxifyVec = (vec) =>
    new Proxy(vec, {
        get: function (self, prop) {
            switch (prop) {
                case 'r':
                    return self.x;
                case 'g':
                    return self.y;
                case 'b':
                    return self.z;
                case 'a':
                    return self.w;
                default:
                    return Reflect.get(...arguments);
            }
        },
    });
const vec3Obj = (x, y, z) => ({ x, y, z });
const vec4Obj = (x, y, z, w) => ({ x, y, z, w });

class old_vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.dim = 3;

        if (y === undefined && z === undefined) {
            this.y = x;
            this.z = x;
        }
    }

    negate = () => {
        return new vec3(-this.x, -this.y, -this.z);
    };

    add = (vec) => {
        if (vec.dim === 3) {
            return new vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
        } else if (!isNaN(vec)) {
            const val = vec;
            return new vec3(this.x + val, this.y + val, this.z + val);
        }
        console.error('Bad val to vec3 add');
        return vec;
    };

    multiply = (vec) => {
        if (vec.dim === 3) {
            return new vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
        } else if (!isNaN(vec)) {
            const val = vec;
            return new vec3(this.x * val, this.y * val, this.z * val);
        }
        console.error('Bad val to vec3 multiply');
        return vec;
    };

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
class old_vec4 extends old_vec3 {
    constructor(x, y, z, w) {
        super(x, y, z);
        this.w = w;
        this.dim = 4;

        if (y === undefined && z === undefined && w === undefined) {
            this.y = x;
            this.z = x;
            this.w = x;
        }
    }

    negate = () => {
        return new vec4(-this.x, -this.y, -this.z, -this.w);
    };

    multiply = (vec) => {
        if (vec.dim === 4) {
            return new vec4(
                this.x * vec.x,
                this.y * vec.y,
                this.z * vec.z,
                this.w * vec.w
            );
        } else if (!isNaN(vec)) {
            const val = vec;
            return new vec4(
                this.x * val,
                this.y * val,
                this.z * val,
                this.w * val
            );
        }
        console.error('Bad val to vec4 multiply');
        return vec;
    };

    add = (vec) => {
        if (vec.dim === 4) {
            return new vec4(
                this.x + vec.x,
                this.y + vec.y,
                this.z + vec.z,
                this.w + vec.w
            );
        } else if (!isNaN(vec)) {
            const val = vec;
            return new vec4(
                this.x + val,
                this.y + val,
                this.z + val,
                this.w + val
            );
        }
        console.error('Bad val to vec4 add');
        return vec;
    };

    get a() {
        return this.w;
    }

    xyz = () => new vec3(this.x, this.y, this.z);
}
class old_mat3 {
    constructor(row1, row2, row3) {
        if (Array.isArray(row1)) {
            if (Array.isArray(row2)) {
                this.mat = [row1, row2, row3];
            } else {
                this.mat = [row1, row1, row1];
            }
        } else {
            const singleVal = row1;
            for (let i = 0; i < 3; i++) {
                let row = [];
                for (let j = 0; j < 3; j++) {
                    row.push(singleVal);
                }
                this.mat.push(row);
            }
        }
    }
}

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

const unused = { proxifyVec, vec3Obj, vec4Obj, old_vec3, old_vec4, old_mat3 };
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
    unused,
};
