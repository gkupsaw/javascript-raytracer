#ifndef LIGHTINGUTILS_H
#define LIGHTINGUTILS_H

#include "Scene.h"
#include "RGBA.h"

#include "MySceneData.h"

namespace LightingUtils {

glm::vec4 reflectRay(const glm::vec4 &v, const glm::vec4 &n);

float computeAttenuation(const glm::vec4 &p_f, const glm::vec4 &p_i, const CS123SceneLightData &light);

glm::vec4 computeDiffuse(const glm::vec4 &intensity, const glm::vec4 &N, const glm::vec4 &L);
glm::vec4 computeSpecular(const glm::vec4 &intensity, const glm::vec4 &N,
                          const glm::vec4 &L, const glm::vec4 &V, float shininess);
glm::vec4 computeRecursive(const glm::vec4 &intensity, const glm::vec4 &N,
                            const glm::vec4 &L, const glm::vec4 &V, float shininess);

}

#endif // LIGHTINGUTILS_H
