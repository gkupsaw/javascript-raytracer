import {
    vec4,
    dot,
    normalize,
    IntersectionData,
    Ray,
    mat_mul,
    mat_add,
} from '../lib';

const EPSILON_RAY = 1e-5;

const implicitTrunk = (ray, a, b, c, top, bottom) => {
    let minT = Infinity;
    const discriminant = Math.pow(b, 2) - 4 * a * c;
    const p = ray.eye;
    const d = ray.dir;

    if (discriminant >= 0 && a !== 0) {
        const denom = 2 * a;
        const sqrtDiscr = Math.sqrt(discriminant);

        const t1 = (-b + sqrtDiscr) / denom;
        if (t1 >= 0) {
            const intersectPoint1 = mat_add(p, mat_mul(d, t1));
            if (
                intersectPoint1.y() >= bottom - EPSILON_RAY &&
                intersectPoint1.y() <= top + EPSILON_RAY
            ) {
                minT = t1;
            }
        }

        const t2 = (-b - sqrtDiscr) / denom;
        if (t2 >= 0 && t2 < minT) {
            const intersectPoint2 = mat_add(p, mat_mul(d, t2));
            if (intersectPoint2.y() >= bottom && intersectPoint2.y() <= top) {
                minT = t2;
            }
        }
    }

    return minT;
};

const implicitPlane = (ray, planeNormal) => {
    const denom = dot(planeNormal.dir, ray.dir);
    if (Math.abs(denom) <= EPSILON_RAY) {
        return Infinity;
    }
    const t =
        dot(planeNormal.dir, mat_add(planeNormal.eye, ray.eye.negate())) /
        denom;
    return t >= EPSILON_RAY ? t : Infinity;
};

const implicitCone = (ray) => {
    let intersection;
    const p = ray.eye;
    const d = ray.dir;

    const top = 0.5;
    const bottom = -0.5;
    const m = 2;
    const bottomR = (top - bottom) / m;

    const a = Math.pow(d.x(), 2) + Math.pow(d.z(), 2) - Math.pow(d.y(), 2) / 4;
    const b =
        2 * p.x() * d.x() + 2 * p.z() * d.z() - (p.y() * d.y()) / 2 + d.y() / 4;
    const c =
        Math.pow(p.x(), 2) +
        Math.pow(p.z(), 2) -
        Math.pow(p.y(), 2) / 4 +
        p.y() / 4 -
        Math.pow(top / m, 2);

    const trunkT = implicitTrunk(ray, a, b, c);
    const intersectionPoint1 = mat_add(p, mat_mul(d, trunkT));
    const normalAtIntersection = normalize(
        vec4(
            2 * intersectionPoint1.x(),
            (0.5 - intersectionPoint1.y()) / 2,
            2 * intersectionPoint1.z(),
            0
        )
    );
    intersection = new IntersectionData(normalAtIntersection, trunkT);

    const bottomCapNormal = new Ray(vec4(0, bottom, 0, 1), vec4(0, -1, 0, 0));
    const t3 = implicitPlane(ray, bottomCapNormal);
    if (t3 < intersection.t) {
        const intersectionPoint2 = mat_add(p, mat_mul(d, t3));
        if (
            Math.pow(intersectionPoint2.x(), 2) +
                Math.pow(intersectionPoint2.z(), 2) <=
            Math.pow(bottomR, 2)
        ) {
            intersection = new IntersectionData(bottomCapNormal.dir, t3);
        }
    }

    return intersection;
};

const implicitCylinder = (ray) => {
    let intersection;
    const p = ray.eye;
    const d = ray.dir;

    const top = 0.5;
    const bottom = -0.5;
    const r = 0.5;

    const a = Math.pow(d.x(), 2) + Math.pow(d.z(), 2);
    const b = 2 * p.x() * d.x() + 2 * p.z() * d.z();
    const c = Math.pow(p.x(), 2) + Math.pow(p.z(), 2) - Math.pow(r, 2);

    const trunkT = implicitTrunk(ray, a, b, c);
    const intersectionPoint1 = mat_add(p, mat_mul(d, trunkT));
    const intersectionNormal = normalize(
        vec4(intersectionPoint1.x() * 2, 0, intersectionPoint1.z() * 2, 0)
    );

    intersection = new IntersectionData(intersectionNormal, trunkT);

    const bottomCapNormal = new Ray(vec4(0, bottom, 0, 1), vec4(0, -1, 0, 0));
    const t3 = implicitPlane(ray, bottomCapNormal);
    if (t3 < intersection.t) {
        const intersectionPoint2 = mat_add(p, mat_mul(d, t3));
        if (
            Math.pow(intersectionPoint2.x(), 2) +
                Math.pow(intersectionPoint2.z(), 2) <=
            Math.pow(r, 2)
        ) {
            intersection = new IntersectionData(bottomCapNormal.dir, t3);
        }
    }

    const topCapNormal = new Ray(vec4(0, top, 0, 1), vec4(0, 1, 0, 0));
    const t4 = implicitPlane(ray, topCapNormal);
    if (t4 < intersection.t) {
        const intersectionPoint3 = mat_add(p, mat_mul(d, t4));
        if (
            Math.pow(intersectionPoint3.x(), 2) +
                Math.pow(intersectionPoint3.z(), 2) <=
            Math.pow(r, 2)
        ) {
            intersection = new IntersectionData(topCapNormal.dir, t4);
        }
    }

    return intersection;
};

const implicitCube = (ray) => {
    let intersection;
    const r = 0.5;
    const p = ray.eye;
    const d = ray.dir;

    const normals = [
        vec4(1, 0, 0, 0),
        vec4(-1, 0, 0, 0),
        vec4(0, 1, 0, 0),
        vec4(0, -1, 0, 0),
        vec4(0, 0, 1, 0),
        vec4(0, 0, -1, 0),
    ];

    let t;
    const limit = r + EPSILON_RAY;
    for (const normal of normals) {
        const normalRadius = vec4(mat_mul(normal.xyz(), r), 1);
        const faceRay = new Ray(normalRadius, normal);
        t = implicitPlane(ray, faceRay);
        if (t < intersection.t) {
            const pointOnShape = mat_add(p, mat_mul(d, t));
            if (
                pointOnShape.x() >= -limit &&
                pointOnShape.x() <= limit &&
                pointOnShape.y() >= -limit &&
                pointOnShape.y() <= limit &&
                pointOnShape.z() >= -limit &&
                pointOnShape.z() <= limit
            ) {
                intersection = new IntersectionData(normal, t);
            }
        }
    }

    return intersection;
};

const implicitSphere = (ray) => {
    let intersection;
    const r = 0.5;
    const p = ray.eye;
    const d = ray.dir;

    const a = Math.pow(d.x(), 2) + Math.pow(d.z(), 2) + Math.pow(d.y(), 2);
    const b = 2 * p.x() * d.x() + 2 * p.z() * d.z() + 2 * p.y() * d.y();
    const c =
        Math.pow(p.x(), 2) +
        Math.pow(p.z(), 2) +
        Math.pow(p.y(), 2) -
        Math.pow(r, 2);

    const minT = implicitTrunk(ray, a, b, c);

    const intersectionDir = mat_add(p, mat_mul(d, minT));
    const intersectionNormal = vec4(mat_mul(intersectionDir.xyz(), 2), 0);
    intersection = new IntersectionData(intersectionNormal, minT);

    return intersection;
};

export {
    implicitTrunk,
    implicitCone,
    implicitCube,
    implicitCylinder,
    implicitPlane,
    implicitSphere,
};
