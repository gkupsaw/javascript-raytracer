#include "TextureMappingUtils.h"
#include <iostream>
#include "glm/ext.hpp"

namespace TextureMappingUtils {

    float lerp(float x, float x0, float xf, float y0, float yf) {
        return (y0 * (xf - x) + yf * (x - x0)) / (xf - x0);
    }

    glm::vec4 computeUVColor(const IntersectionData &oscIntersection, const glm::vec4 &oscIntersectionPoint) {
        CS123ShapeData shape = oscIntersection.shape;
        CS123SceneFileMap tex = shape.primitive.material.textureMap;

        glm::vec2 uv = computeUV(oscIntersection, oscIntersectionPoint);
        float u = uv.x; float v = uv.y;

        int w = shape.texture.width();
        int h = shape.texture.height();
        float j = tex.repeatU;
        float k = tex.repeatV;

        // is this casting bad practice?
        float s = ((int) (u * w * j)) % w;
        float t = ((int) (v * h * k)) % h;

        QColor color = shape.texture.pixelColor(s, t);

        return glm::vec4(color.red() / 255.f, color.green() / 255.f, color.blue() / 255.f, 1.f);
    }

    glm::vec2 computeUV(const IntersectionData &oscIntersection, const glm::vec4 &oscIntersectionPoint) {
        glm::vec2 uv = glm::vec2(0);

        switch (oscIntersection.shape.primitive.type) {
            case PrimitiveType::PRIMITIVE_CUBE: {
                uv = computeUVPlane(oscIntersectionPoint, oscIntersection.normal);
                break;
            }
            case PrimitiveType::PRIMITIVE_CONE:
            case PrimitiveType::PRIMITIVE_CYLINDER: {
                if (fabs(oscIntersection.normal.y) == 1.f) {
                    // case for cap
                    uv = computeUVPlane(oscIntersectionPoint, oscIntersection.normal);
                }
                else {
                    // case for body
                    float coneHeight = 1.f;
                    float inverseY = lerp(oscIntersectionPoint.y, 0, 1, 1, 0);
                    uv = glm::vec2(computeUTrunk(oscIntersectionPoint), inverseY + (coneHeight / 2));
                }
                break;
            }
            case PrimitiveType::PRIMITIVE_SPHERE: {
                float u = computeUTrunk(oscIntersectionPoint);
                float inverseY = lerp(oscIntersectionPoint.y, -1, 1, 1, -1);
                float v = computeVTrunk(inverseY);
                uv = glm::vec2(u, v);
                break;
            }
            default:
                break;
        }

        return uv;
    }

    glm::vec2 computeUVPlane(const glm::vec4 &oscIntersectionPoint, const glm::vec4 &normal) {
        float u = 0, v = 0;
        float r = 0.5;
        float x = oscIntersectionPoint.x + r;
        float y = oscIntersectionPoint.y + r;
        float z = oscIntersectionPoint.z + r;

        // don't technically need to calc this here, but makes everything more readable
        float inverseX = lerp(x, 0, 1, 1, 0);
        float inverseY = lerp(y, 0, 1, 1, 0);
        float inverseZ = lerp(z, 0, 1, 1, 0);

        if (normal.x == 1) {
            u = z;
            v = inverseY;
        }
        else if (normal.x == -1) {
            u = inverseZ;
            v = inverseY;
        }
        else if (normal.y == 1) {
            u = x;
            v = z;
        }
        else if (normal.y == -1) {
            u = x;
            v = inverseZ;
        }
        else if (normal.z == 1) {
            u = x;
            v = inverseY;
        }
        else if (normal.z == -1) {
            u = inverseX;
            v = inverseY;
        }

        return glm::vec2(u, v);
    }

    float computeUTrunk(const glm::vec4 &oscIntersectionPoint) {
        float x = oscIntersectionPoint.x;
        float z = oscIntersectionPoint.z;

        float u = 0;

        if (x == 0) {
            if (z == 0) {
                // special case for poles of spheres
                u = 0.5f;
            }
            else if (z < 0) {
                u = 0.25f;
            }
            else if (z > 0) {
                u = 0.75f;
            }
        }
        else {
            float theta = std::atan2(z, x);

            float partialU = -theta / (2 * M_PI);
            u = theta < 0 ? partialU : 1 + partialU;
        }

        return u;
    }

    float computeVTrunk(float y) {
        float r = 0.5f;

        float phi = glm::asin(y / r);
        float v = (phi / M_PI) + 0.5f;

        return v;
    }

}
