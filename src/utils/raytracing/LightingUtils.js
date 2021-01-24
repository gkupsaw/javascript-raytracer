import { lightTypes, clamp, dot, normalize } from '../lib';

const reflectRay = (v, n) => {
    const dotted = clamp(dot(n, v), 0, 1);
    return n.multiply(2 * dotted).add(v.negate());
};

const computeAttenuation = (p_f, p_i, light) => {
    if (light.type === lightTypes.DIRECTIONAL) {
        return 1;
    }

    const sqrD =
        Math.pow(p_f.x + p_i.x, 2) +
        Math.pow(p_f.y + p_i.y, 2) +
        Math.pow(p_f.z + p_i.z, 2);
    const c_const = light.func.x;
    const c_lin = light.func.y;
    const c_quad = light.func.z;
    return clamp(1 / (c_const + c_lin * Math.sqrt(sqrD) + c_quad * sqrD), 0, 1);
};

const computeDiffuse = (intensity, N, L) => {
    const dotted = clamp(dot(N, L), 0, 1);
    return intensity.multiply(dotted);
};

const computeSpecular = (intensity, N, L, V, shininess) => {
    // does the dot product need to be clamped?
    const R = normalize(reflectRay(L, N));
    const dotted = clamp(dot(R, V), 0, 1);
    return intensity.multiply(Math.pow(dotted, shininess));
};

export { reflectRay, computeAttenuation, computeDiffuse, computeSpecular };
