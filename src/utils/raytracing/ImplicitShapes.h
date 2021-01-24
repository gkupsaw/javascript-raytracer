#ifndef IMPLICITSHAPES_H
#define IMPLICITSHAPES_H

#include "MySceneData.h"

class ImplicitShapes
{
public:
    ImplicitShapes();
    virtual ~ImplicitShapes();

    float implicitTrunk(const Ray &ray, float a, float b, float c, float top = 0.5f, float bottom = -0.5f);
    float implicitPlane(const Ray &ray, const Ray &planeNormal);

    IntersectionData implicitCone(const Ray &ray);
    IntersectionData implicitCylinder(const Ray &ray);
    IntersectionData implicitCube(const Ray &ray);
    IntersectionData implicitSphere(const Ray &ray);
};

#endif // IMPLICITSHAPES_H
