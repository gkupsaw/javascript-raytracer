import {
    vec4,
    mat3,
    RGBA,
    Ray,
    IntersectionData,
    primitiveTypes,
    lightTypes,
    clamp,
    normalize,
} from '../lib';
import {
    computeAttenuation,
    computeDiffuse,
    computeSpecular,
    reflectRay,
} from './LightingUtils';
import * as ImplicitShapes from './ImplicitShapes';

const MAX_DEPTH = 4;
const mat_inv = () => {};
const mat_transpose = () => {};
const mat_mul = () => {};

const processEvents = () => {};

const computeUVColor = () => {};

const CAMERA = {
    getScaleMatrix: () => {},
    getViewMatrix: () => {},
};

const CANVAS = {
    data: () => {},
    height: () => 0,
    width: () => 0,
    update: () => {},
};

const settings = {};

class RayScene {
    constructor() {
        this.halt = false;
        this.global = {};
        this.shapes = [];
        this.lights = [];
    }

    cancel = () => {
        this.halt = true;
    };

    render = (canvas, camera) => {
        this.halt = false;

        const height = canvas.height();

        const filmToWorld = mat_inv(
            mat_mul(camera.getScaleMatrix() * camera.getViewMatrix())
        );
        const pEye = filmToWorld * new vec4(0, 0, 0, 1);
        const yMax = height;

        let y;
        for (y = 0; y < yMax; y++) {
            this.renderRow(canvas, y, filmToWorld, pEye);
            if (this.halt) {
                break;
            }
        }

        this.halt = false;
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
            const dir = normalize(worldSpaceLoc - pEye);
            const ray = new Ray(pEye, dir);

            // calculate intersection of this ray for every shape in m_shapes
            // find closest intersection
            // calculate lighting at that point

            const initialDepth = 0;
            const pixelIntersection = this.computeIntersection(ray);

            // no intersection
            if (pixelIntersection.t === Infinity) {
                data[xMax * y + x] = bgColor;
            } else {
                const wscIntersectionPoint =
                    ray.eye + ray.dir * pixelIntersection.t;

                let pixelIntensity = this.computeIntensity(
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
                    currIntersection = ImplicitShapes.implicitCone(rayOS);
                    break;
                case primitiveTypes.CYLINDER:
                    currIntersection = ImplicitShapes.implicitCylinder(rayOS);
                    break;
                case primitiveTypes.CUBE:
                    currIntersection = ImplicitShapes.implicitCube(rayOS);
                    break;
                case primitiveTypes.SPHERE:
                    currIntersection = ImplicitShapes.implicitSphere(rayOS);
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
        const ambientIntensity = this.global.ka * mat.cAmbient;
        let diffuseIntensity = this.global.kd * mat.cDiffuse;
        const specularIntensity = this.global.ks * mat.cSpecular;
        const recursiveIntensity = this.global.ks * mat.cReflective;
        const V = normalize(-wscRayDir); // normalized wsc line of sight
        const shininess = mat.shininess;

        let lightSummation = new vec4(0);
        const objectNormalToWorld = mat_transpose(
            new mat3(shape.inverseTransformation)
        );
        const N = normalize(
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
                case lightTypes.POINT:
                    if (!settings.usePointLights) {
                        continue;
                    }

                    // from point TO light
                    L = normalize(light.pos - wscIntersectionPoint);
                    break;
                case lightTypes.DIRECTIONAL:
                    if (!settings.useDirectionalLights) {
                        continue;
                    }

                    L = normalize(-light.dir);
                    break;
                default:
                    break;
            }

            let isOccluded = false;
            // check for occlusion
            if (settings.useShadows) {
                // need to offset to account for self-intersection
                const offsetShadowSource = wscIntersectionPoint + N * EPSILON;
                const rayToLight = new Ray(offsetShadowSource, L);
                const shadowRayIntersection = this.computeIntersection(
                    rayToLight
                );

                // only count intersections up to the light, and not past
                // (only applicable for lights with position)
                let tToLight = Infinity;
                if (light.type !== lightTypes.DIRECTIONAL) {
                    // compute t for intersection with of ray from point to light
                    // and a plane at the light source pointing towards the point
                    tToLight = ImplicitShapes.implicitPlane(
                        rayToLight,
                        new Ray(light.pos, -L)
                    );
                }

                if (
                    shadowRayIntersection.t !== Infinity &&
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
            const R = normalize(reflectRay(-wscRayDir, N));
            const offsetReflectionSource = wscIntersectionPoint + R * EPSILON;
            const nextRay = new Ray(offsetReflectionSource, R);
            const nextIntersection = this.computeIntersection(nextRay);

            if (nextIntersection.t !== Infinity) {
                const nextIntersectionPoint =
                    nextRay.eye + nextRay.dir * nextIntersection.t;
                recursiveComponent =
                    recursiveIntensity *
                    this.computeIntensity(
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
