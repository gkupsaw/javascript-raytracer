#ifndef RAYSCENE_H
#define RAYSCENE_H

#include "Scene.h"
#include "RGBA.h"
#include "Canvas2D.h"

#include "MySceneData.h"
#include "ImplicitShapes.h"
#include "LightingUtils.h"
#include "TextureMappingUtils.h"

/**
 * @class RayScene
 *
 *  Implements a raytracing renderer.
 */
class RayScene : public Scene {
public:
    RayScene(Scene &scene);
    virtual ~RayScene();

    void rayTrace(Canvas2D* canvas, Camera *camera);
    void cancel();
    void renderRow(Canvas2D* canvas, int y,
                   const glm::mat4x4 &filmToWorld, const glm::vec4 &pEye);
    IntersectionData computeIntersection(const Ray &ray);

    glm::vec4 computeIntensity(int depth, const glm::vec4 &wscRayDir,
                               const IntersectionData &oscIntersection, const glm::vec4 &wscIntersectionPoint);

private:
    ImplicitShapes m_implicitUtils;
    bool m_halt;
};

#endif // RAYSCENE_H
