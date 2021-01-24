import { lightTypes, clamp, dot, normalize } from '../lib';

const reflectRay = (v, n) => {
    const dotted = clamp(dot(n, v), 0, 1);
    return 2 * n * dotted - v;
};

const computeAttenuation = (p_f, p_i, light) => {
    if (light.type === lightTypes.DIRECTIONAL) {
        return 1;
    }

    const sqrD =
        pow(p_f.x + p_i.x, 2) + pow(p_f.y + p_i.y, 2) + pow(p_f.z + p_i.z, 2);
    const c_const = lightunction.x;
    const c_lin = lightunction.y;
    const c_quad = lightunction.z;
    return clamp(1 / (c_const + c_lin * sqrt(sqrD) + c_quad * sqrD), 0, 1);
};

const computeDiffuse = (intensity, N, L) => {
    const dotted = clamp(dot(N, L), 0, 1);
    return intensity * dotted;
};

const computeSpecular = (intensity, N, L, V, shininess) => {
    // does the dot product need to be clamped?
    const R = normalize(reflectRay(L, N));
    const dotted = clamp(dot(R, V), 0, 1);
    return intensity * pow(dotted, shininess);
};

export { reflectRay, computeAttenuation, computeDiffuse, computeSpecular };
