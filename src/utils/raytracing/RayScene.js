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
    mat_inv,
    mat_transpose,
    mat_mul,
    dotMultiply,
    mat_add,
} from '../lib';
import {
    computeAttenuation,
    computeDiffuse,
    computeSpecular,
    reflectRay,
} from './LightingUtils';
import * as ImplicitShapes from './ImplicitShapes';

const MAX_DEPTH = 4;

const processEvents = () => {};

const computeUVColor = () => {};

const settings = { usePointLights: true };

class RayScene {
    constructor(global, lights, shapes) {
        this.halt = false;
        this.global = global ?? {};
        this.lights = lights ?? [];
        this.shapes = shapes ?? [];
    }

    cancel = () => {
        this.halt = true;
    };

    render = (canvas, camera) => {
        this.halt = false;

        const height = canvas.height();

        const filmToWorld = mat_inv(
            mat_mul(camera.getScaleMatrix(), camera.getViewMatrix())
        );
        const pEye = mat_mul(filmToWorld, vec4(0, 0, 0, 1));
        const yMax = height;

        let y;
        for (y = 0; y < yMax; y++) {
            // if (y !== 800) continue;
            console.log(`rendering row (${y + 1}/${yMax})`);
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
        const bgColor = vec4(0, 0, 0, 255); // new RGBA

        let x;
        for (x = 0; x < xMax; x++) {
            const filmPlaneLoc = vec4(
                (2 * x) / xMax - 1,
                1 - (2 * y) / yMax,
                -1,
                1
            );
            // transform that point to world space
            const worldSpaceLoc = mat_mul(filmToWorld, filmPlaneLoc);
            const dir = normalize(mat_add(worldSpaceLoc, pEye.negate()));
            const ray = new Ray(pEye, dir);

            // calculate intersection of this ray for every shape in this.shapes
            // find closest intersection
            // calculate lighting at that point

            const initialDepth = 0;
            const pixelIntersection = this.computeIntersection(ray);
            const pixelIndex = xMax * y + x;

            // no intersection
            let pixelColor;
            if (pixelIntersection.t === Infinity) {
                pixelColor = bgColor;
            } else {
                const wscIntersectionPoint = mat_add(
                    ray.eye,
                    mat_mul(ray.dir, pixelIntersection.t)
                );

                let pixelIntensity = this.computeIntensity(
                    initialDepth,
                    ray.dir,
                    pixelIntersection,
                    wscIntersectionPoint
                );
                pixelIntensity = mat_mul(pixelIntensity, 255);
                pixelColor = vec4(
                    // new RGBA
                    pixelIntensity.xyz(),
                    255
                );
            }

            data.set(pixelColor, pixelIndex);
        }

        processEvents();
        canvas.update();
    };

    computeIntersection = (ray) => {
        let closestIntersection = new IntersectionData(),
            currIntersection;

        for (const shape of this.shapes) {
            const objectToWorld = shape.inverseTransformation;
            // transform to object space (p + d*t = MO => M^-1 * (p + d*t) = O)
            const rayOS = new Ray(
                mat_mul(objectToWorld, ray.eye),
                mat_mul(objectToWorld, ray.dir)
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
        const ambientIntensity = mat_mul(mat.cAmbient, this.global.ka);
        let diffuseIntensity = mat_mul(mat.cDiffuse, this.global.kd);
        const specularIntensity = mat_mul(mat.cSpecular, this.global.ks);
        const recursiveIntensity = mat_mul(mat.cReflective, this.global.ks);
        const V = normalize(wscRayDir.negate()); // normalized wsc line of sight
        const shininess = mat.shininess;

        let lightSummation = vec4(0, 0, 0, 0);
        const objectNormalToWorld = mat_transpose(
            mat3(shape.inverseTransformation)
        );
        const N = normalize(
            vec4(mat_mul(objectNormalToWorld, oscIntersection.normal.xyz()), 0)
        );

        // most of texture mapping is in this block
        if (settings.useTextureMapping && !shape.texture.isNull()) {
            const uvColor = computeUVColor(
                oscIntersection,
                mat_mul(shape.inverseTransformation, wscIntersectionPoint)
            );
            const blend = mat.blend;
            //fixrgba
            diffuseIntensity = blend * uvColor + (1 - blend) * diffuseIntensity;
        }

        console.log('starting');
        for (const light of this.lights) {
            let L = vec4(0);

            switch (light.type) {
                case lightTypes.POINT:
                    if (!settings.usePointLights) {
                        continue;
                    }

                    // from point TO light
                    L = normalize(
                        mat_add(light.pos, wscIntersectionPoint.negate())
                    );
                    break;
                case lightTypes.DIRECTIONAL:
                    if (!settings.useDirectionalLights) {
                        continue;
                    }

                    L = normalize(light.dir.negate());
                    break;
                default:
                    break;
            }

            let isOccluded = false;
            // check for occlusion
            if (settings.useShadows) {
                // need to offset to account for self-intersection
                const offsetShadowSource = mat_add(
                    wscIntersectionPoint,
                    mat_mul(N, EPSILON)
                );
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
                        new Ray(light.pos, L.negate())
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
            let diffuseComponent = vec4(0),
                specularComponent = vec4(0);
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

            lightSummation = mat_add(
                lightSummation,
                mat_mul(
                    dotMultiply(
                        light.color,
                        mat_add(diffuseComponent, specularComponent)
                    ),
                    attenuation
                )
            );
        }

        // most of reflection is in this block
        let recursiveComponent = vec4(0);
        if (settings.useReflection && depth < MAX_DEPTH) {
            const R = normalize(reflectRay(wscRayDir.negate(), N));
            const offsetReflectionSource = mat_add(
                wscIntersectionPoint,
                mat_mul(R, EPSILON)
            );
            const nextRay = new Ray(offsetReflectionSource, R);
            const nextIntersection = this.computeIntersection(nextRay);

            if (nextIntersection.t !== Infinity) {
                const nextIntersectionPoint = mat_add(
                    nextRay.eye,
                    mat_mul(nextRay.dir, nextIntersection.t)
                );
                recursiveComponent = mat_mul(
                    recursiveIntensity,
                    this.computeIntensity(
                        depth + 1,
                        nextRay.dir,
                        nextIntersection,
                        nextIntersectionPoint
                    )
                );
            }
        }

        let final = mat_add(
            ambientIntensity,
            mat_add(lightSummation, recursiveComponent)
        );

        final = clamp(final, 0, 1);

        return final;
    };
}

export { RayScene };
