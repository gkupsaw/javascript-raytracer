#ifndef SCENE_H
#define SCENE_H

#include "CS123SceneData.h"
#include "Camera.h"
#include "MySceneData.h"

#include "glm/ext.hpp"

class Camera;
class CS123ISceneParser;


/**
 * @class Scene
 *
 * @brief This is the base class for all scenes. Modify this class if you want to provide
 * common functionality to all your scenes.
 */
class Scene {
public:
    Scene();
    Scene(Scene &scene);
    virtual ~Scene();

    virtual void settingsChanged() {}

    static void parse(Scene *sceneToFill, CS123ISceneParser *parser);

protected:

    // Adds a primitive to the scene.
    virtual void addPrimitive(const CS123ScenePrimitive &scenePrimitive, const glm::mat4x4 &matrix);

    // Adds a light to the scene.
    virtual void addLight(const CS123SceneLightData &sceneLight);

    // Sets the global data for the scene.
    virtual void setGlobal(const CS123SceneGlobalData &global);

    void processNode(const CS123SceneNode &node, const glm::mat4x4 &prevTransform);

    CS123SceneGlobalData m_global;
    std::vector<CS123SceneLightData> m_lights;
    std::vector<CS123ShapeData> m_shapes;

};

#endif // SCENE_H
