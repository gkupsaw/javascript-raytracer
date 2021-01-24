#include "SceneviewScene.h"
#include "GL/glew.h"
#include <QGLWidget>
#include "Camera.h"

#include "Settings.h"
#include "SupportCanvas3D.h"
#include "ResourceLoader.h"
#include "gl/shaders/CS123Shader.h"

#include "shapes/Cube.h"
#include "shapes/Cylinder.h"
#include "shapes/Cone.h"
#include "shapes/Sphere.h"
#include "camera/CamtransCamera.h"
using namespace CS123::GL;
#include "glm/ext.hpp"


SceneviewScene::SceneviewScene()
{
    // TODO: [SCENEVIEW] Set up anything you need for your Sceneview scene here...
    loadPhongShader();
    loadWireframeShader();
    loadNormalsShader();
    loadNormalsArrowShader();
}

SceneviewScene::~SceneviewScene()
{
}

void SceneviewScene::loadPhongShader() {
    std::string vertexSource = ResourceLoader::loadResourceFileToString(":/shaders/default.vert");
    std::string fragmentSource = ResourceLoader::loadResourceFileToString(":/shaders/default.frag");
    m_phongShader = std::make_unique<CS123Shader>(vertexSource, fragmentSource);
}

void SceneviewScene::loadWireframeShader() {
    std::string vertexSource = ResourceLoader::loadResourceFileToString(":/shaders/wireframe.vert");
    std::string fragmentSource = ResourceLoader::loadResourceFileToString(":/shaders/wireframe.frag");
    m_wireframeShader = std::make_unique<Shader>(vertexSource, fragmentSource);
}

void SceneviewScene::loadNormalsShader() {
    std::string vertexSource = ResourceLoader::loadResourceFileToString(":/shaders/normals.vert");
    std::string geometrySource = ResourceLoader::loadResourceFileToString(":/shaders/normals.gsh");
    std::string fragmentSource = ResourceLoader::loadResourceFileToString(":/shaders/normals.frag");
    m_normalsShader = std::make_unique<Shader>(vertexSource, geometrySource, fragmentSource);
}

void SceneviewScene::loadNormalsArrowShader() {
    std::string vertexSource = ResourceLoader::loadResourceFileToString(":/shaders/normalsArrow.vert");
    std::string geometrySource = ResourceLoader::loadResourceFileToString(":/shaders/normalsArrow.gsh");
    std::string fragmentSource = ResourceLoader::loadResourceFileToString(":/shaders/normalsArrow.frag");
    m_normalsArrowShader = std::make_unique<Shader>(vertexSource, geometrySource, fragmentSource);
}

void SceneviewScene::render(SupportCanvas3D *context) {
    setClearColor();
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    m_cameraPos = context->getCamtransCamera()->getPosition();

    m_phongShader->bind();
    setSceneUniforms(context);
    setLights();
    glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
    renderGeometry();
    glBindTexture(GL_TEXTURE_2D, 0);
    m_phongShader->unbind();

    if (settings.drawWireframe) {
        renderWireframePass(context);
    }

    if (settings.drawNormals) {
        renderNormalsPass(context);
    }
}

void SceneviewScene::setSceneUniforms(SupportCanvas3D *context) {
    Camera *camera = context->getCamera();
    m_phongShader->setUniform("useLighting", settings.useLighting);
    m_phongShader->setUniform("useArrowOffsets", false);
    m_phongShader->setUniform("p", camera->getProjectionMatrix());
    m_phongShader->setUniform("v", camera->getViewMatrix());
}

void SceneviewScene::setMatrixUniforms(Shader *shader, SupportCanvas3D *context) {
    shader->setUniform("p", context->getCamera()->getProjectionMatrix());
    shader->setUniform("v", context->getCamera()->getViewMatrix());
}

void SceneviewScene::setLights()
{
    int numLights = m_lights.size();

    for (int lightCount = 0 ; lightCount < numLights ; lightCount++) {
        m_phongShader->setLight(m_lights[lightCount]);
    }
}

void SceneviewScene::renderGeometry() {
    int numShapes = m_shapes.size();

    int useDistanceBasedLOD = true;
    int MAX_LEVEL = 100;
    int p1, p2, level;
    if (!useDistanceBasedLOD) {
        // calc basic LOD (reduce tesselation for greater number of shapes in scene)
        int levelFactorDifference = 2; // factor by which tessellation gets reduced at each level (powers of 2 here)
        level = numShapes > 0 ? log10(numShapes) + 1 : 1; // level increases following powers of 10 (level 1 if <10 shapes, level 2 if <100 shapes, etc.)
        level = std::min(level, MAX_LEVEL);
        p1 = settings.shapeParameter1 / pow(levelFactorDifference, level);
        p2 = settings.shapeParameter2 / pow(levelFactorDifference, level);
    }

    // mapping from level of detail => mapping from Primitives => unique pointers to Shape instance
    std::map<int, std::map<PrimitiveType, std::unique_ptr<Shape>>> shapes = std::map<int, std::map<PrimitiveType, std::unique_ptr<Shape>>>();
    glm::vec4 origin = glm::vec4(0,0,0,1);
    for (int shapeCount = 0 ; shapeCount < numShapes ; shapeCount++) {
        CS123ShapeData shapeData = m_shapes[shapeCount];
        CS123SceneMaterial material = shapeData.primitive.material;
        glm::mat4x4 transformation = shapeData.transformation;
        PrimitiveType type = shapeData.primitive.type;

        if (useDistanceBasedLOD) {
            float distanceFromCamera = glm::length((transformation * origin) - m_cameraPos);
             // this equation and its parameters are rather arbitrary; I'd like to refine the derivation of levels in the future
            float a = 1.6, b = 15;
            int distanceLevel = distanceFromCamera >= 1 ? pow(a, distanceFromCamera / b) * (distanceFromCamera / (a * b)) : 1;
            // I didn't have enough time to implement this, but factoring in object size to determine level would have been interesting
            level = std::min(MAX_LEVEL, distanceLevel);

            float levelFactorDifference = 1.25; // factor by which tessellation gets reduced at each level (powers of 1.25 work nicer here)
            p1 = settings.shapeParameter1 / pow(levelFactorDifference, level);
            p2 = settings.shapeParameter2 / pow(levelFactorDifference, level);
        }

        material.cDiffuse *= m_global.kd;
        material.cAmbient *= m_global.ka;

        m_phongShader->applyMaterial(material);
        m_phongShader->setUniform("m", transformation);
        m_wireframeShader->setUniform("m", transformation);
        m_normalsShader->setUniform("m", transformation);
        m_normalsArrowShader->setUniform("m", transformation);

        // add shape at level if it doesn't exist
        if (!shapes[level][type]) {
            switch (type) {
                case PrimitiveType::PRIMITIVE_CUBE:
                    shapes[level][type] = std::make_unique<Cube>(p1, p2);
                    break;
                case PrimitiveType::PRIMITIVE_CYLINDER:
                    shapes[level][type] = std::make_unique<Cylinder>(p1, p2);
                    break;
                case PrimitiveType::PRIMITIVE_CONE:
                    shapes[level][type] = std::make_unique<Cone>(p1, p2);
                    break;
                case PrimitiveType::PRIMITIVE_SPHERE:
                    shapes[level][type] = std::make_unique<Sphere>(p1, p2);
                    break;
                default:
                    shapes[level][type] = std::make_unique<Sphere>(p1, p2);
                    break;
            }
        }
        shapes[level][type]->draw();
    }
}

void SceneviewScene::settingsChanged() {
    // TODO: [SCENEVIEW] Fill this in if applicable.

}

void SceneviewScene::renderGeometryAsFilledPolygons() {
    glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
    renderGeometry();
}

void SceneviewScene::renderWireframePass(SupportCanvas3D *context) {
    m_wireframeShader->bind();
    setMatrixUniforms(m_wireframeShader.get(), context);
    renderGeometryAsWireframe();
    m_wireframeShader->unbind();
}

void SceneviewScene::renderGeometryAsWireframe() {
    glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
    renderGeometry();
}

void SceneviewScene::renderNormalsPass (SupportCanvas3D *context) {
    // Render the lines.
    m_normalsShader->bind();
    setMatrixUniforms(m_normalsShader.get(), context);
    renderGeometryAsWireframe();
    m_normalsShader->unbind();

    // Render the arrows.
    m_normalsArrowShader->bind();
    setMatrixUniforms(m_normalsArrowShader.get(), context);
    renderGeometryAsFilledPolygons();
    m_normalsArrowShader->unbind();
}
