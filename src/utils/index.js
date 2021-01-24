import { zero_mat4 } from './lib';
import { parse } from './parser/scene-parser';
import { RayScene } from './raytracing/RayScene';

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

<cameradata>
<pos x="0" y="0" z="0"/>
<up x="0" y="1" z="0"/>
</cameradata>

<object type="tree" name="root">
    <transblock>
    <translate x="0" y="0" z="-2"/>
    <scale x="0.5" y="2" z="0.5"/>
        <object type="primitive" name="sphere" >
            <diffuse r="0" g="0" b="1"/>
        </object>
    </transblock>
</object>

</scenefile>`;

const CAMERA = {
    getScaleMatrix: () => zero_mat4(),
    getViewMatrix: () => zero_mat4(),
};

const CANVAS = {
    data: () => {},
    height: () => 10,
    width: () => 10,
    update: () => {},
};

const runRaytracer = () => {
    const { global, camera, light, object } = parse(scene);
    const rayscene = new RayScene(global, light, object);
    rayscene.render(CANVAS, CAMERA);
};

export { runRaytracer };
