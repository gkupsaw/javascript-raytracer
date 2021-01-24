import { parse } from './parser/scene-parser';

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

const runRaytracer = () => {
    console.log(parse(scene));
};

export { runRaytracer };