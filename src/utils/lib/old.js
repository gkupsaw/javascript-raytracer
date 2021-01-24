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

export { proxifyVec, vec3Obj, vec4Obj, old_vec3, old_vec4, old_mat3 };
