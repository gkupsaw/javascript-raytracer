import { index, subset, Matrix } from 'mathjs';
import { mat_mul } from './mathjsUtils';
import { vec3 } from './glm';

Matrix.prototype.x = function () {
    return subset(this, index(0));
};
Matrix.prototype.y = function () {
    return subset(this, index(1));
};
Matrix.prototype.z = function () {
    return subset(this, index(2));
};
Matrix.prototype.w = function () {
    return subset(this, index(3));
};

Matrix.prototype.r = function () {
    return subset(this, index(0));
};
Matrix.prototype.g = function () {
    return subset(this, index(1));
};
Matrix.prototype.b = function () {
    return subset(this, index(2));
};
Matrix.prototype.a = function () {
    return subset(this, index(3));
};

Matrix.prototype.xyz = function () {
    return vec3(this.x, this.y, this.z);
};

Matrix.prototype.negate = function () {
    return mat_mul(this, -1);
};

export * from './glm';
export * from './datatypes';
export * from './mathjsUtils';
