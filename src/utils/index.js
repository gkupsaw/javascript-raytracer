import { parse } from './parser/scene-parser';
import { RayScene } from './raytracing/RayScene';
import Camera from './raytracing/Camera';
import { Canvas } from './lib/datatypes';

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

const canvasDims = {
    height: 1169,
    width: 871,

    height: 400,
    width: 400
}

const runRaytracer = () => {
    const CAMERA = new Camera();
    const CANVAS = new Canvas(canvasDims.height, canvasDims.width);
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

    context.putImageData(data, 0, 0);

    document.getElementById('root').appendChild(canvas);
};

export { runRaytracer };
