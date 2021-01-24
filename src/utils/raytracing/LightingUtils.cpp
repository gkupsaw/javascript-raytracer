#include "LightingUtils.h"

namespace LightingUtils {

glm::vec4 reflectRay(const glm::vec4 &v, const glm::vec4 &n) {
    float dotted = glm::clamp(glm::dot(n, v), 0.f, 1.f);
    return (2.f * n * dotted) - v;
}

float computeAttenuation(const glm::vec4 &p_f, const glm::vec4 &p_i, const CS123SceneLightData &light) {
    if (light.type == LightType::LIGHT_DIRECTIONAL) {
        return 1;
    }

    float sqrD = pow(p_f.x + p_i.x, 2) + pow(p_f.y + p_i.y, 2) + pow(p_f.z + p_i.z, 2);
    float c_const = light.function.x;
    float c_lin = light.function.y;
    float c_quad = light.function.z;
    return glm::clamp(1.f / (c_const + c_lin * sqrt(sqrD) + c_quad * sqrD), 0.f, 1.f);
}

glm::vec4 computeDiffuse(const glm::vec4 &intensity, const glm::vec4 &N, const glm::vec4 &L) {
    float dotted = glm::clamp(glm::dot(N, L), 0.f, 1.f);
    return intensity * dotted;
}

glm::vec4 computeSpecular(const glm::vec4 &intensity, const glm::vec4 &N,
                                    const glm::vec4 &L, const glm::vec4 &V, float shininess) {
    // does the dot product need to be clamped?
    glm::vec4 R = glm::normalize(reflectRay(L, N));
    float dotted = glm::clamp(glm::dot(R, V), 0.f, 1.f);
    return intensity * pow(dotted, shininess);
}

}
