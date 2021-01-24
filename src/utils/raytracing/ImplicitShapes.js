#include "ImplicitShapes.h"

float EPSILON_RAY = 1e-5;

ImplicitShapes::ImplicitShapes()
{
}

ImplicitShapes::~ImplicitShapes()
{
}


float ImplicitShapes::implicitTrunk(const Ray &ray, float a, float b, float c, float top, float bottom) {
    float minT = INFINITY;
    float discriminant = pow(b, 2) - 4.f * a * c;
    glm::vec4 p = ray.eye;
    glm::vec4 d = ray.dir;

    if (discriminant >= 0 && a != 0) {
        float denom = 2.f * a;
        float sqrtDiscr = sqrt(discriminant);

        float t1 = (-b + sqrtDiscr) / denom;
        if (t1 >= 0) {
            glm::vec4 intersectPoint1 = p + d * t1;
            if (intersectPoint1.y >= bottom - EPSILON_RAY && intersectPoint1.y <= top + EPSILON_RAY) {
                minT = t1;
            }
        }

        float t2 = (-b - sqrtDiscr) / denom;
        if (t2 >= 0 && t2 < minT) {
            glm::vec4 intersectPoint2 = p + d * t2;
            if (intersectPoint2.y >= bottom && intersectPoint2.y <= top) {
                minT = t2;
            }
        }
    }

    return minT;
}

float ImplicitShapes::implicitPlane(const Ray &ray, const Ray &planeNormal) {
    float denom = glm::dot(planeNormal.dir, ray.dir);
    if (fabs(denom) <= EPSILON_RAY) {
        return INFINITY;
    }
    float t = glm::dot(planeNormal.dir, planeNormal.eye - ray.eye) / denom;
    return t >= EPSILON_RAY ? t : INFINITY;
}

IntersectionData ImplicitShapes::implicitCone(const Ray &ray) {
    IntersectionData intersection;
    glm::vec4 p = ray.eye;
    glm::vec4 d = ray.dir;

    float top = 0.5f;
    float bottom = -0.5f;
    float m = 2;
    float bottomR = (top - bottom) / m;

    float a = pow(d.x, 2) + pow(d.z, 2) - (pow(d.y, 2) / 4.f);
    float b = (2.f * p.x * d.x) + (2.f * p.z * d.z) - (p.y * d.y / 2.f) + (d.y / 4.f);
    float c = pow(p.x, 2) + pow(p.z, 2) - (pow(p.y, 2) / 4.f) + (p.y / 4.f) - pow(top / m, 2);

    float trunkT = implicitTrunk(ray, a, b, c);
    glm::vec4 intersectionPoint1 = p + d * trunkT;
    glm::vec4 normalAtIntersection = glm::normalize(glm::vec4(2.f * intersectionPoint1.x, (0.5f - intersectionPoint1.y) / 2.f, 2.f * intersectionPoint1.z, 0));
    intersection = { normalAtIntersection, trunkT };

    Ray bottomCapNormal = { glm::vec4(0, bottom, 0, 1.f), glm::vec4(0, -1.f, 0, 0) };
    float t3 = implicitPlane(ray, bottomCapNormal);
    if (t3 < intersection.t) {
        glm::vec4 intersectionPoint2 = p + d * t3;
        if (pow(intersectionPoint2.x, 2) + pow(intersectionPoint2.z, 2) <= pow(bottomR, 2)) {
            intersection = { bottomCapNormal.dir, t3 };
        }
    }

    return intersection;
}

IntersectionData ImplicitShapes::implicitCylinder(const Ray &ray) {
    IntersectionData intersection;
    glm::vec4 p = ray.eye;
    glm::vec4 d = ray.dir;

    float top = 0.5f;
    float bottom = -0.5f;
    float r = 0.5f;

    float a = pow(d.x, 2) + pow(d.z, 2);
    float b = (2 * p.x * d.x) + (2 * p.z * d.z);
    float c = pow(p.x, 2) + pow(p.z, 2) - pow(r, 2);

    float trunkT = implicitTrunk(ray, a, b, c);
    glm::vec4 intersectionPoint1 = p + d * trunkT;
    glm::vec4 intersectionNormal = glm::normalize(glm::vec4(intersectionPoint1.x * 2.f, 0, intersectionPoint1.z * 2.f, 0));

    intersection = { intersectionNormal, trunkT };

    Ray bottomCapNormal = { glm::vec4(0, bottom, 0, 1.f), glm::vec4(0, -1.f, 0, 0) };
    float t3 = implicitPlane(ray, bottomCapNormal);
    if (t3 < intersection.t) {
        glm::vec4 intersectionPoint2 = p + d * t3;
        if (pow(intersectionPoint2.x, 2) + pow(intersectionPoint2.z, 2) <= pow(r, 2)) {
            intersection = { bottomCapNormal.dir, t3 };
        }
    }

    Ray topCapNormal = { glm::vec4(0, top, 0, 1.f), glm::vec4(0, 1.f, 0, 0) };
    float t4 = implicitPlane(ray, topCapNormal);
    if (t4 < intersection.t) {
        glm::vec4 intersectionPoint3 = p + d * t4;
        if (pow(intersectionPoint3.x, 2) + pow(intersectionPoint3.z, 2) <= pow(r, 2)) {
            intersection = { topCapNormal.dir, t4 };
        }
    }

    return intersection;
}

IntersectionData ImplicitShapes::implicitCube(const Ray &ray) {
    IntersectionData intersection;
    float r = 0.5f;
    glm::vec4 p = ray.eye;
    glm::vec4 d = ray.dir;

    std::vector<glm::vec4> normals = {
        {  1,  0,  0, 0 },
        { -1,  0,  0, 0 },
        {  0,  1,  0, 0 },
        {  0, -1,  0, 0 },
        {  0,  0,  1, 0 },
        {  0,  0, -1, 0 },
    };

    float t;
    float limit = r + EPSILON_RAY;
    for (glm::vec4 normal : normals) {
        Ray faceRay = { glm::vec4(normal.xyz() * r, 1.f), normal };
        t = implicitPlane(ray, faceRay);
        if (t < intersection.t) {
            glm::vec4 pointOnShape = p + d * t;
            if (pointOnShape.x >= -limit && pointOnShape.x <= limit
                    && pointOnShape.y >= -limit && pointOnShape.y <= limit
                    && pointOnShape.z >= -limit && pointOnShape.z <= limit) {
                intersection = { normal, t };
            }
        }
    }

    return intersection;
}

IntersectionData ImplicitShapes::implicitSphere(const Ray &ray) {
    IntersectionData intersection;
    float r = 0.5f;
    glm::vec4 p = ray.eye;
    glm::vec4 d = ray.dir;


    float a = pow(d.x, 2) + pow(d.z, 2) + pow(d.y, 2);
    float b = (2.f * p.x * d.x) + (2.f * p.z * d.z) + (2.f * p.y * d.y);
    float c = pow(p.x, 2) + pow(p.z, 2) + pow(p.y, 2) - pow(r, 2);

    float minT = implicitTrunk(ray, a, b, c);

    glm::vec4 IntersectionData = p + d * minT;
    glm::vec4 intersectionNormal = glm::vec4(2.f * IntersectionData.xyz(), 0.f);
    intersection = { intersectionNormal, minT };

    return intersection;
}
