#ifndef TEXTUREMAPPINGUTILS_H
#define TEXTUREMAPPINGUTILS_H

#include <QWidget>

#include "MySceneData.h"

namespace TextureMappingUtils
{

float lerp(float x, float x0, float xf, float y0, float yf);

glm::vec4 computeUVColor(const IntersectionData &oscIntersection, const glm::vec4 &oscIntersectionPoint);

glm::vec2 computeUVPlane(const glm::vec4 &oscIntersectionPoint, const glm::vec4 &normal);
float computeUTrunk(const glm::vec4 &oscIntersectionPoint);
float computeVTrunk(float y);
glm::vec2 computeUV(const IntersectionData &oscIntersection, const glm::vec4 &oscIntersectionPoint);

};

#endif // TEXTUREMAPPINGUTILS_H
