import { parse } from './parser/scene-parser';
import { RayScene } from './raytracing/RayScene';
import Camera from './raytracing/Camera';
import { Canvas } from './lib/datatypes';

const scenes = {
    ball: `<scenefile>
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

    </scenefile>`,
    intscttest: `<scenefile>
    <globaldata>
	<diffusecoeff v="0.5"/>
	<specularcoeff v="0.5"/>
	<ambientcoeff v="0.5"/>
    </globaldata>

    <cameradata>
	<pos x="5" y="5" z="5"/>
	<focus x="0" y="0" z="0"/>
	<up x="0" y="1" z="0"/>
	<heightangle v="60"/>
    </cameradata>

    <lightdata>
	<id v="0"/>
	<position x="0" y="2" z="1"/>
	<function v1="1" v2="0" v3="0"/>
	<color r="1" g="1" b="1"/>
    </lightdata>

    <object type="tree" name="root">
	<transblock>
	    <translate x="-8" y="0" z="2"/>
	    <scale x="5" y="5" z="5"/>
	    <object type="primitive" name="cube" >
		<diffuse r="1" g="0" b="0"/>
		<ambient r=".3" g="0" b="0"/>
	    </object>
	</transblock>
	<transblock>
	    <translate x="-2" y="2" z="0"/>
	    <rotate x="0" y="0" z="1" angle="45"/>
	    <scale x="2" y="2" z="2"/>
	    <object type="primitive" name="cylinder" >
		<ambient r="0" g="0" b=".1"/>
		<diffuse r="0" g="0" b="1"/>
	    </object>
	</transblock>
	<transblock>
	    <translate x="-1" y="0" z="0"/>
	    <rotate x="1" y="0" z="0" angle="60"/>
	    <scale x="2" y="4" z="2"/>
	    <translate x="0" y=".5" z="0"/>
	    <object type="primitive" name="cone" >
		<ambient r=".1" g=".1" b=".1"/>
		<diffuse r="1" g="1" b="1"/>
		<specular r="0" g="0" b="0"/>
	    </object>
	</transblock>
	<transblock>
	    <translate x="1" y="0" z="0"/>
	    <rotate x="1" y="0" z="0" angle="60"/>
	    <scale x="2" y="4" z="2"/>
	    <translate x="0" y=".5" z="0"/>
	    <object type="primitive" name="cone" >
		<ambient r=".1" g=".1" b=".1"/>
		<diffuse r="1" g="1" b="1"/>
		<specular r="0" g="0" b="0"/>
	    </object>
	</transblock>
	<transblock>
	    <translate x="5" y="0" z="-2"/>
	    <scale x="5" y="5" z="5"/>
	    <object type="primitive" name="sphere" >
		<ambient r="0" g=".1" b="0"/>
		<diffuse r="0" g="1" b="0"/>
	    </object>
	</transblock>
    </object>

</scenefile>`,
};

const canvasDims = {
    height: 1169,
    width: 871,

    height: 400,
    width: 400
}

const runRaytracer = () => {
    const CAMERA = new Camera();
<<<<<<< HEAD
    const CANVAS = new Canvas(canvasDims.height, canvasDims.width);
    const { global, camera, light, object } = parse(scene);
=======
    const CANVAS = new Canvas(300, 300);
    const { global, camera, light, object } = parse(scenes.intscttest);
>>>>>>> 595ca517851779d9e53cca3fc8ab008ecf594692

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
