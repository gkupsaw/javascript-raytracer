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

class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;

        if (y === undefined && z === undefined) {
            this.y = x;
            this.z = x;
        }
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

        if (y === undefined && z === undefined && w === undefined) {
            this.y = x;
            this.z = x;
            this.w = x;
        }
    }

    get a() {
        return this.w;
    }

    xyz = () => new vec3(this.x, this.y, this.z);
}

class mat3 {
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

class ShapeData {
    constructor(primitive, transformation, inverseTransformation, texture) {
        this.primitive = primitive;
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

const primitiveTypes = {
    CONE: 'CONE',
    CYLINDER: 'CYLINDER',
    CUBE: 'CUBE',
    SPHERE: 'SPHERE',
};

const lightTypes = { POINT: 'POINT', DIRECTIONAL: 'DIRECTIONAL' };

const clamp = (val, min, max) => Math.max(Math.min(val, max), min);

const unused = { proxifyVec, vec3Obj, vec4Obj };
export {
    vec3,
    vec4,
    mat3,
    RGBA,
    Ray,
    ShapeData,
    IntersectionData,
    primitiveTypes,
    lightTypes,
    clamp,
    unused,
};
