import {
    dot,
    cross,
    det,
    inv,
    transpose as mat_transpose,
    multiply,
    matrix,
    index,
    subset,
} from 'mathjs';
const { sin, cos, tan, atan } = Math;

const normalize = (vec) => {
    let sqrSum = 0;

    vec.forEach((val) => (sqrSum += Math.pow(val, 2)));

    const magnitude = Math.sqrt(sqrSum);

    return multiply(vec, 1 / magnitude);
};

const translate = (M, x) => {
    const dim = parseInt(M.size()[1]);
    const maxDim = dim - 1;
    let indices = [],
        replacements = [];

    for (let i = 0; i < maxDim; i++) {
        indices.push(i);
        replacements.push(subset(M, index(i, maxDim)) - subset(x, index(i)));
    }

    M = subset(M, index(indices, maxDim), replacements);
    return M;
};
const scale = (M, x) => {
    const dim = parseInt(M.size()[1]);
    const maxDim = dim - 1;

    for (let i = 0; i < maxDim; i++) {
        M = subset(
            M,
            index(i, i),
            subset(M, index(i, i)) * subset(x, index(i))
        ); // is this less efficient?
    }

    return M;
};
const rotate = (M, x, a) => {
    console.error('No rotate!');
    return M;
};
const mat_inv = (M) => {
    if (det(M) === 0) {
        console.error(M);
        return M;
        //id4();
    } else {
        return inv(M);
    }
};
const radians = (deg) => (deg * Math.PI) / 180;
const degrees = (rad) => (180 * rad) / Math.PI;
const clamp = (M, min = 0, max = 1) => {
    return M.map((value) => {
        return Math.max(Math.min(value, max), min);
    });
};

const mat3 = (row1, row2, row3) => {
    if (row1 && row2 === undefined && row3 === undefined) {
        const mat4ToShrink = row1.clone();
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
    } else {
        vec = matrix([x, y, z]);
    }

    return vec;
};

const vec4 = (x, y, z, w) => {
    let vec;

    if (y === undefined && z === undefined && w === undefined) {
        vec = matrix([x, x, x, x]);
    } else if (z === undefined && w === undefined) {
        vec = x.clone();
        vec.resize([4], y);
    } else {
        vec = matrix([x, y, z, w]);
    }

    return vec;
};

const id4 = () =>
    matrix([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]);

const tests = () => {
    const M = id4();
    const x = vec3(1, 2, 3);

    const translateSuccess =
        translate(M, x) ===
        matrix([
            [1, 0, 0, -1],
            [0, 1, 0, -2],
            [0, 0, 1, -3],
            [0, 0, 0, 1],
        ]);
};

export {
    clamp,
    normalize,
    dot,
    cross,
    mat_inv,
    mat_transpose,
    translate,
    scale,
    rotate,
    sin,
    cos,
    tan,
    atan,
    radians,
    degrees,
    vec3,
    vec4,
    mat3,
    mat4x4,
    id4,
};
