import { parse } from './parser/scene-parser';
import { RayScene } from './raytracing/RayScene';
import Camera from './raytracing/Camera';

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

const CanvasData = Uint8Array;
// const pixelDataSize = 4;
// CanvasData.prototype.insert = function (vec, index) {
//     vec.forEach((val, i) => (this[index * pixelDataSize + i] = val));
// };

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
    console.log(`Got ${CANVAS.data().filter((v) => v).length} intersections`);
};

export { runRaytracer };
