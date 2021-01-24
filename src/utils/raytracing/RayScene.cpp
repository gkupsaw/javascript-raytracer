#include "RayScene.h"
#include "Settings.h"
#include "CS123SceneData.h"

#include <iostream>
#include <QCoreApplication>

int MAX_DEPTH = 4;

RayScene::RayScene(Scene &scene) :
    Scene(scene),
    m_implicitUtils(ImplicitShapes()),
    m_halt(false)
{
    // TODO [INTERSECT]
    // Remember that any pointers or OpenGL objects (e.g. texture IDs) will
    // be deleted when the old scene is deleted (assuming you are managing
    // all your memory properly to prevent memory leaks).  As a result, you
    // may need to re-allocate some things here.
}

RayScene::~RayScene()
{
}

void RayScene::rayTrace(Canvas2D* canvas, Camera *camera) {
    m_halt = false;

    int height = canvas->height();

    glm::mat4x4 filmToWorld = glm::inverse(camera->getScaleMatrix() * camera->getViewMatrix());
    glm::vec4 pEye = filmToWorld * glm::vec4(0,0,0,1);
    int yMax = height;

    int y;
    for (y = 0 ; y < yMax ; y++) {
        renderRow(canvas, y, filmToWorld, pEye);
        if (m_halt) {
            break;
        }
    }

    m_halt = false;
}

void RayScene::cancel() {
    m_halt = true;
}

void RayScene::renderRow(Canvas2D* canvas, int y,
                         const glm::mat4x4 &filmToWorld, const glm::vec4 &pEye) {
    RGBA* data = canvas->data();
    int yMax = canvas->height();
    int xMax = canvas->width();
    RGBA bgColor = RGBA(0, 0, 0, 255);

    int x;
    for (x = 0 ; x < xMax ; x++) {
        glm::vec4 filmPlaneLoc = glm::vec4(
                    (2.f * x / xMax) - 1.f,
                    1.f - (2.f * y / yMax),
                    -1.f,
                    1.f);
        // transform that point to world space
        glm::vec4 worldSpaceLoc = filmToWorld * filmPlaneLoc;
        glm::vec4 dir = glm::normalize(worldSpaceLoc - pEye);
        Ray ray = { pEye, dir };

        // calculate intersection of this ray for every shape in m_shapes
        // find closest intersection
        // calculate lighting at that point

        int initialDepth = 0;
        IntersectionData pixelIntersection = computeIntersection(ray);

        // no intersection
        if (pixelIntersection.t == INFINITY) {
            data[xMax * y + x] = bgColor;
        }
        else {
            glm::vec4 wscIntersectionPoint = ray.eye + ray.dir * pixelIntersection.t;

            glm::vec4 pixelIntensity = computeIntensity(initialDepth, ray.dir,
                                                        pixelIntersection, wscIntersectionPoint);
            pixelIntensity *= 255.f;
            data[xMax * y + x] = RGBA(pixelIntensity.x, pixelIntensity.y, pixelIntensity.z, 255);
        }
    }

    QCoreApplication::processEvents();
    canvas->update();
}

IntersectionData RayScene::computeIntersection(const Ray &ray) {
    IntersectionData closestIntersection, currIntersection;

    for (CS123ShapeData shape : m_shapes) {
        glm::mat4x4 objectToWorld = shape.inverseTransformation;
        // transform to object space (p + d*t = MO => M^-1 * (p + d*t) = O)
        Ray rayOS = { objectToWorld * ray.eye, objectToWorld * ray.dir };

        switch (shape.primitive.type) {
            case PrimitiveType::PRIMITIVE_CONE:
                currIntersection = m_implicitUtils.implicitCone(rayOS);
                break;
            case PrimitiveType::PRIMITIVE_CYLINDER:
                currIntersection = m_implicitUtils.implicitCylinder(rayOS);
                break;
            case PrimitiveType::PRIMITIVE_CUBE:
                currIntersection = m_implicitUtils.implicitCube(rayOS);
                break;
            case PrimitiveType::PRIMITIVE_SPHERE:
                currIntersection = m_implicitUtils.implicitSphere(rayOS);
                break;
            default:
                currIntersection = IntersectionData();
                break;
        }
        if (currIntersection.t < closestIntersection.t) {
            closestIntersection = currIntersection;
            closestIntersection.shape = shape;
        }
    }

    return closestIntersection;
}

glm::vec4 RayScene::computeIntensity(int depth, const glm::vec4 &wscRayDir,
                                     const IntersectionData &oscIntersection, const glm::vec4 &wscIntersectionPoint) {
    // for testing
    bool useAttenuation = true;
    bool useDiffuse = true;
    bool useSpecular = true;

    float EPSILON = 1e-2;
    CS123ShapeData shape = oscIntersection.shape;
    CS123SceneMaterial mat = shape.primitive.material;
    glm::vec4 ambientIntensity = m_global.ka * mat.cAmbient;
    glm::vec4 diffuseIntensity = m_global.kd * mat.cDiffuse;
    glm::vec4 specularIntensity = m_global.ks * mat.cSpecular;
    glm::vec4 recursiveIntensity = m_global.ks * mat.cReflective;
    glm::vec4 V = glm::normalize(-wscRayDir); // normalized wsc line of sight
    float shininess = mat.shininess;

    glm::vec4 lightSummation = glm::vec4(0.f);
    glm::mat3 objectNormalToWorld = glm::transpose(glm::mat3(shape.inverseTransformation));
    glm::vec4 N = glm::normalize(glm::vec4(objectNormalToWorld * oscIntersection.normal.xyz(), 0.f));

    // most of texture mapping is in this block
    if (settings.useTextureMapping && !shape.texture.isNull()) {
        glm::vec4 uvColor = TextureMappingUtils::computeUVColor(
                    oscIntersection, shape.inverseTransformation * wscIntersectionPoint);
        float blend = mat.blend;
        diffuseIntensity = blend * uvColor + (1 - blend) * diffuseIntensity;
    }

    for (CS123SceneLightData light : m_lights) {
        glm::vec4 L = glm::vec4(0);

        switch (light.type) {
            case LightType::LIGHT_POINT: {
                if (!settings.usePointLights) {
                    continue;
                }

                // from point TO light
                L = glm::normalize(light.pos - wscIntersectionPoint);

                break;
            }
            case LightType::LIGHT_DIRECTIONAL: {
                if (!settings.useDirectionalLights) {
                    continue;
                }

                L = glm::normalize(-light.dir);

                break;
            }
            default: {
                break;
            }
        }

        bool isOccluded = false;
        // check for occlusion
        if (settings.useShadows) {
            // need to offset to account for self-intersection
            glm::vec4 offsetShadowSource = wscIntersectionPoint + N * EPSILON;
            Ray rayToLight = { offsetShadowSource, L };
            IntersectionData shadowRayIntersection = computeIntersection(rayToLight);

            // only count intersections up to the light, and not past
            // (only applicable for lights with position)
            float tToLight = INFINITY;
            if (light.type != LightType::LIGHT_DIRECTIONAL) {
                // compute t for intersection with of ray from point to light
                // and a plane at the light source pointing towards the point
                tToLight = m_implicitUtils.implicitPlane(rayToLight, { light.pos, -L });
            }

            if (shadowRayIntersection.t != INFINITY && shadowRayIntersection.t < tToLight) {
                isOccluded = true;
            }
        }

        float attenuation = 1;
        glm::vec4 diffuseComponent, specularComponent = glm::vec4(0);
        if (!isOccluded) {
            if (useAttenuation) {
                attenuation = LightingUtils::computeAttenuation(light.pos, wscIntersectionPoint, light);
            }

            if (useDiffuse) {
                diffuseComponent = LightingUtils::computeDiffuse(diffuseIntensity, N, L);
            }

            if (useSpecular) {
                specularComponent = LightingUtils::computeSpecular(specularIntensity, N, L, V, shininess);
            }
        }

        lightSummation += attenuation * light.color * (diffuseComponent + specularComponent);
    }

    // most of reflection is in this block
    glm::vec4 recursiveComponent = glm::vec4(0);
    if (settings.useReflection && depth < MAX_DEPTH) {
        glm::vec4 R = glm::normalize(LightingUtils::reflectRay(-wscRayDir, N));
        glm::vec4 offsetReflectionSource = wscIntersectionPoint + R * EPSILON;
        Ray nextRay = { offsetReflectionSource, R };
        IntersectionData nextIntersection = computeIntersection(nextRay);

        if (nextIntersection.t != INFINITY) {
            glm::vec4 nextIntersectionPoint = nextRay.eye + nextRay.dir * nextIntersection.t;
            recursiveComponent = recursiveIntensity *
                    computeIntensity(depth + 1, nextRay.dir, nextIntersection, nextIntersectionPoint);
        }
    }

    glm::vec4 final = ambientIntensity + lightSummation + recursiveComponent;
    final = glm::clamp(final, 0.f, 1.f);

//    glm::vec2 uv = TextureMappingUtils::computeUV(oscIntersection, shape.inverseTransformation * wscIntersectionPoint);
//    int w = shape.texture.width();
//    int h = shape.texture.height();
//    float j = shape.primitive.material.textureMap.repeatU;
//    float k = shape.primitive.material.textureMap.repeatV;
//    // is this casting bad practice?
//    float s = ((int) (uv.x * w * j)) % w;
//    float t = ((int) (uv.y * h * k)) % h;
//    s /= 255.f;
//    t /= 255.f;
//    std::cout << glm::to_string(uv) << std::endl;
//    std::cout << s << std::endl;
//    std::cout << t << std::endl;

    return glm::clamp(final, 0.f, 1.f);
}
