const parse = (scene) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(scene, 'text/xml');
    const globalTagnames = {
        DIFFUSE: 'diffusecoeff',
        SPECULAR: 'specularcoeff',
        AMBIENT: 'ambientcoeff',
    };

    let globalData = {},
        lightData = {},
        cameraData = {},
        scenegraph = {};

    const global = xmlDoc.getElementsByTagName('globaldata');
    const light = xmlDoc.getElementsByTagName('lightdata');
    const camera = xmlDoc.getElementsByTagName('cameradata');
    const object = xmlDoc.getElementsByTagName('object');

    for (const datum of global) {
        switch (datum.tagName) {
            case globalTagnames.DIFFUSE:
                globalData['diffuse'] = datum.getAttribute('v');
                break;
            case globalTagnames.SPECULAR:
                globalData['specular'] = datum.getAttribute('v');
                break;
            case globalTagnames.AMBIENT:
                globalData['ambient'] = datum.getAttribute('v');
                break;
            default:
                console.error(`Unknown global data tag: ${datum.tagName}`);
                break;
        }
    }

    for (const datum of global) {
        switch (datum.tagName) {
            case globalTagnames.DIFFUSE:
                globalData['diffuse'] = datum.getAttribute('v');
                break;
            case globalTagnames.SPECULAR:
                globalData['specular'] = datum.getAttribute('v');
                break;
            case globalTagnames.AMBIENT:
                globalData['ambient'] = datum.getAttribute('v');
                break;
            default:
                console.error(`Unknown global data tag: ${datum.tagName}`);
                break;
        }
    }

    return { globalData, lightData, cameraData, scenegraph };
};

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

console.log(parse(scene));
