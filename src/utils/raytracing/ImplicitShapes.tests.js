import { Ray, vec4, normalize } from '../lib';
import * as ImplicitShapes from './ImplicitShapes';

const sphereTests = () => {
    let rays = [
        {
            t: 0.5,
            ray: new Ray(vec4(-1, 0, 0, 1), normalize(vec4(1, 0, 0, 0))),
        },
        {
            t: Infinity,
            ray: new Ray(vec4(-1, 0, 0, 1), normalize(vec4(-1, 0, 0, 0))),
        },
    ];
    rays.forEach(({ t, ray }, i) => {
        const minT = ImplicitShapes.implicitSphere(ray).t;
        if (minT !== t) {
            console.error(
                `failed test ${i}\ncalculated: ${minT}\nexpected: ${t}`
            );
        }
    });
};

const runTests = () => {
    sphereTests();
};

export { runTests };
export default runTests;
