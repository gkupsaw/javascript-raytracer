import { parse } from './parser/scene-parser';
import { RayScene } from './raytracing/RayScene';
import Camera from './raytracing/Camera';
import { matrix, vec4 } from './lib';

const scene = `<scenefile>
<globaldata>
<diffusecoeff v="0.5"/>
<specularcoeff v="0.5"/>
<ambientcoeff v="0.5"/>
</globaldata>

<lightdata>
<id v="0"/>
<color r="1" g="1" b="1"/>
<position x="3" y="3" z="3"/>
</lightdata>

<object type="tree" name="root">
<transblock>
    <scale x='2' y='2' z='2'/>
    <translate x='0' y='2' z='0'/>
    <object type="primitive" name="sphere" >
    <diffuse r="0" g="0" b="1"/>
    </object>
</transblock>
</object>

</scenefile>`;

const CAMERA = new Camera();

class CanvasData {
    dataSize = 4;

    constructor(size) {
        this.data = new Uint8ClampedArray(size * this.dataSize);
    }

    set = (val, index) => {
        if (isNaN(val)) {
            const vec = val;
            if (vec.forEach) {
                vec.forEach((v, i) => {
                    const indivIndex = i.length ? i[0] : i;
                    this.data[this.dataSize * index + indivIndex] = v;
                });
            } else {
                console.error('Bad arg for setting CanvasData');
            }
        } else {
            this.data[index] = val;
        }
    };

    get = () => this.data;
}
// const canvasDatumSize = 4;
// const CanvasData = new Proxy(Uint8Array, {
//     set: function (self, index, val) {
//         if (isNaN(val)) {
//             const vec = val;
//             if (vec.forEach) {
//                 vec.forEach((v, i) => {
//                     console.log(v);
//                     Reflect.set(self, canvasDatumSize * index + i, v);
//                 });
//                 console.log(Reflect.get(self, canvasDatumSize * index));
//                 return val;
//             } else {
//                 console.error('Bad value passed to CanvasData');
//                 return Reflect.set(...arguments);
//             }
//         } else {
//             return Reflect.set(...arguments);
//         }
//     },
// });

class Canvas {
    constructor(height, width) {
        this.height_val = height;
        this.width_val = width;
        this.pixel_data = new CanvasData(height * width);
    }

    height = () => this.height_val;
    width = () => this.width_val;
    data = () => this.pixel_data;
    update = () => {};
}

const CANVAS = new Canvas(1169, 871);

const runRaytracer = () => {
    const { global, camera, light, object } = parse(scene);

    CAMERA.orientLook(camera.pos, camera.look, camera.up);

    const rayscene = new RayScene(global, light, object);
    rayscene.render(CANVAS, CAMERA);

    const pixelData = CANVAS.data().get();

    const canvas = document.createElement('canvas');
    canvas.width = CANVAS.width();
    canvas.height = CANVAS.height();
    const context = canvas.getContext('2d');
    const data = new ImageData(pixelData, CANVAS.width(), CANVAS.height());

    console.log(pixelData.length);
    console.log(pixelData.filter((v) => v && v !== 255));

    context.putImageData(data, 0, 0);

    document.getElementById('root').appendChild(canvas);
};

export { runRaytracer };
