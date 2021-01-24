import { transpose } from 'mathjs';
import {
    vec4,
    mat4x4,
    normalize,
    cross,
    dot,
    xyz,
    degrees,
    radians,
    atan,
    tan,
    sin,
    cos,
    negate,
    mat_mul,
    mat_add,
} from '../lib';

class Camera {
    constructor() {
        this.eye = vec4(2, 2, 2, 1);
        this.up = vec4(0, 1, 0, 0);
        this.w = normalize(vec4(2, 2, 2, 0));
        this.v = normalize(
            mat_add(this.up, negate(mat_mul(this.w, dot(this.up, this.w))))
        );
        this.u = vec4(cross(xyz(this.v), xyz(this.w)), 0);
        this.aspectRatio = 1;
        this.thetaH = radians(60);
        this.thetaW = 2 * atan(tan(this.thetaH / 2) * this.aspectRatio);
        this.near = 1;
        this.far = 30;

        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    setAspectRatio(a) {
        this.aspectRatio = a;
        this.setHeightAngle(degrees(this.thetaH));
        this.updateProjectionMatrix();
    }

    getProjectionMatrix() {
        return mat_mul(this.perspectiveTransformation, this.scaleMatrix);
    }

    getViewMatrix() {
        return mat_mul(this.rotationMatrix, this.translationMatrix);
    }

    getScaleMatrix() {
        return this.scaleMatrix;
    }

    getPerspectiveMatrix() {
        return this.perspectiveTransformation;
    }

    getPosition() {
        return this.eye;
    }

    getLook() {
        return negate(this.w);
    }

    getU() {
        return this.u;
    }

    getV() {
        return this.v;
    }

    getW() {
        return this.w;
    }

    getUp() {
        return this.up;
    }

    getAspectRatio() {
        return this.aspectRatio;
    }

    getHeightAngle() {
        return this.thetaH;
    }

    orientLook(
        eye = vec4(2, 2, 2, 1),
        look = negate(normalize(vec4(2, 2, 2, 0))),
        up = vec4(0, 1, 0, 0)
    ) {
        this.eye = eye;
        this.up = normalize(up);
        this.w = normalize(negate(look));
        this.v = normalize(
            mat_add(this.up, negate(mat_mul(this.w, dot(this.up, this.w))))
        );
        this.u = normalize(vec4(cross(xyz(this.v), xyz(this.w)), 0));
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    setHeightAngle(h) {
        this.thetaH = radians(h);
        this.thetaW = 2 * atan(tan(this.thetaH / 2) * this.aspectRatio);
        this.updateProjectionMatrix();
    }

    translate(v) {
        this.eye = mat_add(this.eye, v);
        this.updateViewMatrix();
    }

    rotateU(deg) {
        const theta = radians(deg);
        const v = mat_mul(this.w, sin(theta)) + mat_mul(this.v, cos(theta));
        const w = mat_mul(this.w, cos(theta)) - mat_mul(this.v, sin(theta));
        this.v = v;
        this.w = w;
        this.updateViewMatrix();
    }

    rotateV(deg) {
        const theta = radians(deg);
        const u = mat_mul(this.u, cos(theta)) - mat_mul(this.w, sin(theta));
        const w = mat_mul(this.u, sin(theta)) + mat_mul(this.w, cos(theta));
        this.u = u;
        this.w = w;
        this.updateViewMatrix();
    }

    rotateW(deg) {
        const theta = -radians(deg);
        const u = mat_mul(this.u, cos(theta)) - mat_mul(this.v, sin(theta));
        const v = mat_mul(this.u, sin(theta)) + mat_mul(this.v, cos(theta));
        this.u = u;
        this.v = v;
        this.updateViewMatrix();
    }

    setClip(nearPlane, farPlane) {
        this.near = nearPlane;
        this.far = farPlane;
        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        this.updateScaleMatrix();
        this.updatePerspectiveMatrix();
    }

    updatePerspectiveMatrix() {
        const c = -this.near / this.far;
        const mat = mat4x4(
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, -1 / (c + 1), c / (c + 1)],
            [0, 0, -1, 0]
        );
        this.perspectiveTransformation = transpose(mat); // transpose to row-major order
    }

    updateScaleMatrix() {
        const mat = mat4x4(
            [1 / (tan(this.thetaW / 2) * this.far), 0, 0, 0],
            [0, 1 / (tan(this.thetaH / 2) * this.far), 0, 0],
            [0, 0, 1 / this.far, 0],
            [0, 0, 0, 1]
        );
        this.scaleMatrix = transpose(mat); // transpose to row-major order
    }

    updateViewMatrix() {
        this.updateRotationMatrix();
        this.updateTranslationMatrix();
    }

    updateRotationMatrix() {
        const mat = mat4x4(
            [this.u.x(), this.u.y(), this.u.z(), 0],
            [this.v.x(), this.v.y(), this.v.z(), 0],
            [this.w.x(), this.w.y(), this.w.z(), 0],
            [0, 0, 0, 1]
        );
        this.rotationMatrix = transpose(mat); // transpose to row-major order
    }

    updateTranslationMatrix() {
        const mat = mat4x4(
            [1, 0, 0, -this.eye.x()],
            [0, 1, 0, -this.eye.y()],
            [0, 0, 1, -this.eye.z()],
            [0, 0, 0, 1]
        );
        this.translationMatrix = transpose(mat); // transpose to row-major order
    }
}

export default Camera;
