
import Koa = require('koa');

import { AuthInfo } from './auth-info';

import { config } from './config';

const container = new Map<Function, AuthInfo>();

const getOrNewInfo = (ctrl: any) => {
    let info = container.get(ctrl);
    if (!info) {
        info = new AuthInfo();
        container.set(ctrl, info);
    }
    return info;
};

/**
 * 鉴权，不能匿名访问
 * @param roles 角色或者权限类别
 */
export function Authorized(...roles: string[]) {
    return function (target: any, key?: string, descriptor?: TypedPropertyDescriptor<Function>) {
        let ctrl: Function;
        let isClass = true;
        if (typeof target === 'function' && !key && !descriptor) {
            ctrl = target;
        } else if (typeof target === 'object' && key && descriptor) {
            ctrl = target.constructor;
            isClass = false;
        }
        if (ctrl === undefined) {
            return;
        }
        let info = getOrNewInfo(ctrl);
        if (isClass && info && info.css) {
            throw new Error(`the ${ctrl.name} is existed`);
        }
        if (isClass) {
            info.css = true;
            info.roles = roles;
        } else {
            if (info.actions) {
                if (info.actions.has(key)) {
                    throw new Error(`the ${ctrl.name} ${key} is existed`);
                }
            } else {
                info.actions = new Map();
            }
            info.actions.set(key, roles);
        }
    }
}

/**
 * 允许匿名访问
 */
export function Anonymous() {
    return function (target: Object, key: string, descriptor: TypedPropertyDescriptor<Function>) {
        let ctrl = target.constructor;
        let info = getOrNewInfo(ctrl);
        if (!info.anonymous) {
            info.anonymous = new Set();
        }
        info.anonymous.add(key);
    }
}

export async function run(context: Koa.Context, next: () => Promise<void>) {
    let route = context.route;
    if (!route || !route.ctrl || !route.action) {
        context.throw('context route loss');
    }
    let info = container.get(route.ctrl);
    let allowAnonymous = true;

    let roles: string[];

    if (info && info.anonymous.has(route.action) === false) {
        roles = [];
        if (info.css) {
            allowAnonymous = false;
            if (info.roles) {
                roles = roles.concat(info.roles);
            }
        }
        if (info.actions.has(route.action)) {
            allowAnonymous = false;
            let actionRoles = info.actions.get(route.action);
            if (actionRoles) {
                roles = roles.concat(actionRoles);
            }
        }
    }

    if (allowAnonymous === false) {
        if (!context.state.isAuthenticated) {
            context.throw(401);
        }
        if (roles && roles.length && config.roleValidator) {
            let success = await config.roleValidator.validate(context.state.user, roles);
            if (!success) {
                context.throw(403);
            }
        }
    }

    await next();

}