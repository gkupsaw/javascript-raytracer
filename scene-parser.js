const parse = (scene) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(scene, 'text/xml');

    const objects = xmlDoc.getElementsByTagName('object');
    const object1Children = objects[0].children;
    const object1Child1Value = object1Children.nodeValue;
    const globaldata = xmlDoc.getElementsByTagName('globaldata');
    return globaldata;
};

const main = (scenefilePath) => {
    const scene = null;
    const scenegraph = parse(scene);
    return scenegraph;
};

module.exports = { parse, main };
