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
    mat_add,
    xyz,
    negate,
    chain,
    id4,
} from '../lib';
import {
    computeAttenuation,
    computeDiffuse,
    computeSpecular,
    reflectRay,
} from './LightingUtils';
import * as ImplicitShapes from './ImplicitShapes';

//add light functions
//math ops on vecs

const MAX_DEPTH = 4;

const processEvents = () => {};

const computeUVColor = () => {};

const settings = {};

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
        // console.log(camera.getScaleMatrix());
        // console.log(camera.getViewMatrix());
        // console.log(filmToWorld);
        const pEye = mat_mul(filmToWorld, vec4(0, 0, 0, 1));
        const yMax = height;

        let y;
        for (y = 0; y < yMax; y++) {
            console.log('rendering row');
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
            const filmPlaneLoc = vec4(
                (2 * x) / xMax - 1,
                1 - (2 * y) / yMax,
                -1,
                1
            );
            // transform that point to world space
            const worldSpaceLoc = mat_mul(filmToWorld, filmPlaneLoc);
            const dir = normalize(mat_add(worldSpaceLoc, negate(pEye)));
            const ray = new Ray(pEye, dir);
            if (y === 0) {
            } //console.log({ pEye, dir, worldSpaceLoc });
            else break;

            // calculate intersection of this ray for every shape in this.shapes
            // find closest intersection
            // calculate lighting at that point

            const initialDepth = 0;
            const pixelIntersection = this.computeIntersection(ray);

            // no intersection
            if (pixelIntersection.t === Infinity) {
                data[xMax * y + x] = bgColor;
            } else {
                console.log('intersect!');
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
                pixelIntensity *= 255;
                data[xMax * y + x] = new RGBA(
                    pixelIntensity.x(),
                    pixelIntensity.y(),
                    pixelIntensity.z(),
                    255
                );
            }
        }

        processEvents();
        canvas.update();
    };

    computeIntersection = (ray) => {
        let closestIntersection = new IntersectionData(),
            currIntersection;

        for (const shape of this.shapes) {
            const objectToWorld = id4(); //shape.inverseTransformation;
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
        const ambientIntensity = mat_mul(this.global.ka, mat.cAmbient);
        let diffuseIntensity = mat_mul(this.global.kd, mat.cDiffuse);
        const specularIntensity = mat_mul(this.global.ks, mat.cSpecular);
        const recursiveIntensity = mat_mul(this.global.ks, mat.cReflective);
        const V = normalize(negate(wscRayDir)); // normalized wsc line of sight
        const shininess = mat.shininess;

        let lightSummation = vec4(0);
        const objectNormalToWorld = mat_transpose(
            //fixthis
            mat3(shape.inverseTransformation)
        );
        const N = normalize(
            vec4(mat_mul(objectNormalToWorld, xyz(oscIntersection.normal)), 0)
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

        for (const light of this.lights) {
            let L = vec4(0);

            switch (light.type) {
                case lightTypes.POINT:
                    if (!settings.usePointLights) {
                        continue;
                    }

                    // from point TO light
                    L = normalize(
                        mat_add(light.pos, negate(wscIntersectionPoint))
                    );
                    break;
                case lightTypes.DIRECTIONAL:
                    if (!settings.useDirectionalLights) {
                        continue;
                    }

                    L = normalize(negate(light.dir));
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
                        new Ray(light.pos, negate(L))
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

            lightSummation = chain(lightSummation).add(
                chain(attenuation)
                    .multiply(light.color)
                    .multiply(mat_add((diffuseComponent, specularComponent)))
            );
        }

        // most of reflection is in this block
        let recursiveComponent = vec4(0);
        if (settings.useReflection && depth < MAX_DEPTH) {
            const R = normalize(reflectRay(negate(wscRayDir), N));
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

        let final = chain(ambientIntensity)
            .add(lightSummation)
            .add(recursiveComponent);
        final = clamp(final, 0, 1);

        return final;
    };
}

export { RayScene };
