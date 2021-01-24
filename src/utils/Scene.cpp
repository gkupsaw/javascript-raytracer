#include "Scene.h"
#include "CS123ISceneParser.h"

#include "glm/gtx/transform.hpp"
#include <iostream>


Scene::Scene()
{
}

Scene::Scene(Scene &scene):
    m_global({ 1, 1, 1, 1 }),
    m_lights(std::vector<CS123SceneLightData>()),
    m_shapes(std::vector<CS123ShapeData>())
{
    // We need to set the global constants to one when we duplicate a scene,
    // otherwise the global constants will be double counted (squared)
    CS123SceneGlobalData global = { 1, 1, 1, 1};
    setGlobal(global);

    // TODO [INTERSECT]
    // Make sure to copy over the lights and the scenegraph from the old scene,
    // as well as any other member variables your new scene will need.

    setGlobal(scene.m_global);
    for (CS123SceneLightData light : scene.m_lights)
        addLight(light);
    for (CS123ShapeData shape : scene.m_shapes)
        addPrimitive(shape.primitive, shape.transformation);
}

Scene::~Scene()
{
    // Do not delete m_camera, it is owned by SupportCanvas3D
    for (CS123ShapeData shape : m_shapes)
    {
        shape.texture.~QImage();
    }
}

void Scene::parse(Scene *sceneToFill, CS123ISceneParser *parser) {
    CS123SceneGlobalData global;
    parser->getGlobalData(global);
    sceneToFill->setGlobal(global);

    for (int lightCount = 0 ; lightCount < parser->getNumLights() ; lightCount++) {
        CS123SceneLightData light;
        parser->getLightData(lightCount, light);
        sceneToFill->addLight(light);
    }

    sceneToFill->processNode(*parser->getRootNode(), glm::mat4x4());
}

void Scene::addPrimitive(const CS123ScenePrimitive &scenePrimitive, const glm::mat4x4 &matrix) {
    QImage img = QImage();
    if (!scenePrimitive.material.textureMap.filename.empty()) {
        img = QImage(scenePrimitive.material.textureMap.filename.data());
    }

    m_shapes.push_back({ scenePrimitive, matrix, glm::inverse(matrix), img });
}

void Scene::addLight(const CS123SceneLightData &sceneLight) {
    m_lights.push_back(sceneLight);
}

void Scene::setGlobal(const CS123SceneGlobalData &global) {
    m_global = global;
}

void Scene::processNode(const CS123SceneNode &node, const glm::mat4x4 &prevTransform) {
    int numTransformations = node.transformations.size();
    int numPrimitives = node.primitives.size();
    int numChildren = node.children.size();

    glm::mat4x4 transform = prevTransform;
    CS123SceneTransformation* transformData;
    glm::mat4x4 nextTransform;
    for (int transformCount = 0 ; transformCount < numTransformations ; transformCount++) {
        transformData = node.transformations[transformCount];
        switch (transformData->type) {
            case TRANSFORMATION_TRANSLATE:
                transform = glm::translate(transform, transformData->translate);
                break;
            case TRANSFORMATION_SCALE:
                transform = glm::scale(transform, transformData->scale);
                break;
            case TRANSFORMATION_ROTATE:
                transform = glm::rotate(transform, transformData->angle, transformData->rotate);
                break;
            case TRANSFORMATION_MATRIX:
                transform *= transformData->matrix;
                break;
            default:
                transform *= transformData->matrix;
                break;
        }
    }

    for (int primCount = 0 ; primCount < numPrimitives ; primCount++) {
        addPrimitive(*node.primitives[primCount], transform);
    }

    for (int childCount = 0 ; childCount < numChildren ; childCount++) {
        processNode(*node.children[childCount], transform);
    }
}
