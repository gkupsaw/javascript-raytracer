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

class IntersectionData {
    constructor() {}
}

const primitiveTypes = {
    CONE: 'CONE',
    CYLINDER: 'CYLINDER',
    CUBE: 'CUBE',
    SPHERE: 'SPHERE',
};

const lightTypes = { POINT: 'POINT', DIRECTIONAL: 'DIRECTIONAL' };

const unused = { proxifyVec, vec3Obj, vec4Obj };
export {
    vec3,
    vec4,
    RGBA,
    Ray,
    IntersectionData,
    primitiveTypes,
    lightTypes,
    unused,
};
