import { vec4, RGBA, Ray, IntersectionData, primitiveTypes } from '../lib';

const MAX_DEPTH = 4;
const mat_inv = () => {};
const mat_transpose = () => {};
const mat_mul = () => {};
const vec_normalize = () => {};
const clamp = () => {};

const processEvents = () => {};

const computeUVColor = () => {};

const computeAttenuation = () => {};
const computeDiffuse = () => {};
const computeSpecular = () => {};
const reflectRay = () => {};

const mat3 = () => {};

const settings = {};

class RayScene {
    constructor() {
        this.implicitShapes = ImplicitShapes();
        this.halt = false;
        this.shapes = [];
        this.lights = [];
    }

    cancel = () => {
        this.m_halt = true;
    };

    render = (canvas, camera) => {
        this.m_halt = false;

        const height = canvas.height();

        const filmToWorld = mat_inv(
            mat_mul(camera.getScaleMatrix() * camera.getViewMatrix())
        );
        const pEye = filmToWorld * new vec4(0, 0, 0, 1);
        const yMax = height;

        let y;
        for (y = 0; y < yMax; y++) {
            renderRow(canvas, y, filmToWorld, pEye);
            if (m_halt) {
                break;
            }
        }

        this.m_halt = false;
    };

    renderRow = (canvas, y, filmToWorld, pEye) => {
        const data = canvas.data();
        const yMax = canvas.height();
        const xMax = canvas.width();
        const bgColor = new RGBA(0, 0, 0, 255);

        let x;
        for (x = 0; x < xMax; x++) {
            const filmPlaneLoc = new vec4(
                (2 * x) / xMax - 1,
                1 - (2 * y) / yMax,
                -1,
                1
            );
            // transform that point to world space
            const worldSpaceLoc = filmToWorld * filmPlaneLoc;
            const dir = vec_normalize(worldSpaceLoc - pEye);
            const ray = new Ray(pEye, dir);

            // calculate intersection of this ray for every shape in m_shapes
            // find closest intersection
            // calculate lighting at that point

            const initialDepth = 0;
            const pixelIntersection = computeIntersection(ray);

            // no intersection
            if (pixelIntersection.t === Infinity) {
                data[xMax * y + x] = bgColor;
            } else {
                const wscIntersectionPoint =
                    ray.eye + ray.dir * pixelIntersection.t;

                let pixelIntensity = computeIntensity(
                    initialDepth,
                    ray.dir,
                    pixelIntersection,
                    wscIntersectionPoint
                );
                pixelIntensity *= 255;
                data[xMax * y + x] = new RGBA(
                    pixelIntensity.x,
                    pixelIntensity.y,
                    pixelIntensity.z,
                    255
                );
            }
        }

        processEvents();
        canvas.update();
    };

    computeIntersection = (ray) => {
        let closestIntersection, currIntersection;

        for (const shape of this.m_shapes) {
            const objectToWorld = shape.inverseTransformation;
            // transform to object space (p + d*t = MO => M^-1 * (p + d*t) = O)
            const rayOS = new Ray(
                objectToWorld * ray.eye,
                objectToWorld * ray.dir
            );

            switch (shape.primitive.type) {
                case primitiveTypes.CONE:
                    currIntersection = m_implicitUtils.implicitCone(rayOS);
                    break;
                case primitiveTypes.CYLINDER:
                    currIntersection = m_implicitUtils.implicitCylinder(rayOS);
                    break;
                case primitiveTypes.CUBE:
                    currIntersection = m_implicitUtils.implicitCube(rayOS);
                    break;
                case primitiveTypes.SPHERE:
                    currIntersection = m_implicitUtils.implicitSphere(rayOS);
                    break;
                default:
                    currIntersection = new IntersectionData();
                    break;
            }
            if (currIntersection.t < closestIntersection.t) {
                closestIntersection = currIntersection;
                closestIntersection.shape = shape;
            }
        }

        return closestIntersection;
    };

    computeIntensity = (
        depth,
        wscRayDir,
        oscIntersection,
        wscIntersectionPoint
    ) => {
        // for testing
        const useAttenuation = true;
        const useDiffuse = true;
        const useSpecular = true;

        const EPSILON = 1e-2;
        const shape = oscIntersection.shape;
        const mat = shape.primitive.material;
        const ambientIntensity = m_global.ka * mat.cAmbient;
        let diffuseIntensity = m_global.kd * mat.cDiffuse;
        const specularIntensity = m_global.ks * mat.cSpecular;
        const recursiveIntensity = m_global.ks * mat.cReflective;
        const V = vec_normalize(-wscRayDir); // normalized wsc line of sight
        const shininess = mat.shininess;

        let lightSummation = new vec4(0);
        const objectNormalToWorld = mat_transpose(
            mat3(shape.inverseTransformation)
        );
        const N = vec_normalize(
            new vec4(objectNormalToWorld * oscIntersection.normal.xyz(), 0)
        );

        // most of texture mapping is in this block
        if (settings.useTextureMapping && !shape.texture.isNull()) {
            const uvColor = computeUVColor(
                oscIntersection,
                shape.inverseTransformation * wscIntersectionPoint
            );
            const blend = mat.blend;
            diffuseIntensity = blend * uvColor + (1 - blend) * diffuseIntensity;
        }

        for (const light of this.lights) {
            let L = new vec4(0);

            switch (light.type) {
                case lightTypes.LIGHT_POINT: {
                    if (!settings.usePointLights) {
                        continue;
                    }

                    // from point TO light
                    L = vec_normalize(light.pos - wscIntersectionPoint);

                    break;
                }
                case lightTypes.LIGHT_DIRECTIONAL: {
                    if (!settings.useDirectionalLights) {
                        continue;
                    }

                    L = vec_normalize(-light.dir);

                    break;
                }
                default: {
                    break;
                }
            }

            let isOccluded = false;
            // check for occlusion
            if (settings.useShadows) {
                // need to offset to account for self-intersection
                const offsetShadowSource = wscIntersectionPoint + N * EPSILON;
                const rayToLight = new Ray(offsetShadowSource, L);
                const shadowRayIntersection = computeIntersection(rayToLight);

                // only count intersections up to the light, and not past
                // (only applicable for lights with position)
                let tToLight = Infinity;
                if (light.type != lightTypes.LIGHT_DIRECTIONAL) {
                    // compute t for intersection with of ray from point to light
                    // and a plane at the light source pointing towards the point
                    tToLight = m_implicitUtils.implicitPlane(
                        rayToLight,
                        new Ray(light.pos, -L)
                    );
                }

                if (
                    shadowRayIntersection.t != Infinity &&
                    shadowRayIntersection.t < tToLight
                ) {
                    isOccluded = true;
                }
            }

            let attenuation = 1;
            let diffuseComponent,
                specularComponent = new vec4(0);
            if (!isOccluded) {
                if (useAttenuation) {
                    attenuation = computeAttenuation(
                        light.pos,
                        wscIntersectionPoint,
                        light
                    );
                }

                if (useDiffuse) {
                    diffuseComponent = computeDiffuse(diffuseIntensity, N, L);
                }

                if (useSpecular) {
                    specularComponent = computeSpecular(
                        specularIntensity,
                        N,
                        L,
                        V,
                        shininess
                    );
                }
            }

            lightSummation +=
                attenuation *
                light.color *
                (diffuseComponent + specularComponent);
        }

        // most of reflection is in this block
        let recursiveComponent = new vec4(0);
        if (settings.useReflection && depth < MAX_DEPTH) {
            const R = vec_normalize(reflectRay(-wscRayDir, N));
            const offsetReflectionSource = wscIntersectionPoint + R * EPSILON;
            const nextRay = new Ray(offsetReflectionSource, R);
            const nextIntersection = computeIntersection(nextRay);

            if (nextIntersection.t != Infinity) {
                const nextIntersectionPoint =
                    nextRay.eye + nextRay.dir * nextIntersection.t;
                recursiveComponent =
                    recursiveIntensity *
                    computeIntensity(
                        depth + 1,
                        nextRay.dir,
                        nextIntersection,
                        nextIntersectionPoint
                    );
            }
        }

        let final = ambientIntensity + lightSummation + recursiveComponent;
        final = clamp(final, 0, 1);

        return final;
    };
}

export { RayScene };
