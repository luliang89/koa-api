
import pathToRegexp = require('path-to-regexp');

import { config } from './config';

import { ControllerInstance, ControllerConstructor, ControllerOptions } from './controller';
import { ActionOptions } from './action';


import { HttpMethod, http_method_names } from './http-method';

const ctrlOptions = new Map<ControllerConstructor, ControllerOptions>();

const actionOptions = new Map<ControllerConstructor, Map<string, ActionOptions>>();

export function Controller(opts?: ControllerOptions) {
    return function (ctrl: ControllerConstructor) {
        if (ctrlOptions.has(ctrl)) {
            throw new Error(`the ${ctrl.name} is existed`);
        }
        ctrlOptions.set(ctrl, opts as ControllerOptions);
    }
}

export function Http(opts: ActionOptions) {
    return function (target: any, key: string, descriptor: TypedPropertyDescriptor<Function>) {
        //不支持静态方法
        if (typeof target === 'function') {
            throw new Error('not support static method');
        }
        // if (typeof opts === 'number') {
        //     opts = {
        //         method: opts
        //     }
        // }
        let ctrl = target.constructor;
        let map = actionOptions.get(ctrl);
        if (!map) {
            map = new Map();
            map.set(key, opts);
            actionOptions.set(ctrl, map);
        } else {
            if (map.has(key)) {
                throw new Error(`the ${ctrl.name} ${key} is existed`);
            }
            map.set(key, opts);
        }
    }
}

export function HttpGet(opts?: ActionOptions) {
    opts = opts || {};
    opts.method = HttpMethod.GET;
    return Http(opts);
}

export function HttpPost(opts?: ActionOptions) {
    opts = opts || {};
    opts.method = HttpMethod.POST;
    return Http(opts);
}

export function HttpPut(opts?: ActionOptions) {
    opts = opts || {};
    opts.method = HttpMethod.PUT;
    return Http(opts);
}

export function HttpDelete(opts?: ActionOptions) {
    opts = opts || {};
    opts.method = HttpMethod.DELETE;
    return Http(opts);
}


export interface Route {

    ctrl: ControllerConstructor

    action: string

    path: string

    pathRegExp?: RegExp

    pathRegKeys?: pathToRegexp.Key[]

}

const createCtrlPath = (ctrl: ControllerConstructor) => {
    let path;
    let opts = ctrlOptions.get(ctrl);
    let name = '/' + ctrl.name.replace(/(Handler|Controller)$/, '')
        .match(/[A-Z]+[a-z0-9]+/g).join(config.delimiter).toLowerCase();;
    if (opts && opts.prefix) {
        if (opts.prefix[0] !== '/') {
            opts.prefix = '/' + opts.prefix;
        }
        path = opts.prefix + name;
    } else {
        path = name;
    }
    return path;
}

const createActionPath = (ctrlPath: string, key: string, opts: ActionOptions) => {
    if (opts && opts.alias) {
        key = opts.alias;
    }
    // console.log('createActionPath', key);
    let lower = key.toLowerCase();
    let method = opts && opts.method ? opts.method : HttpMethod.GET;
    let path;
    if (isHttpMethod(lower)) {
        path = ctrlPath + ' ' + lower;
    } else {
        path = ctrlPath + '/' + key.match(/[a-z0-9]+|[A-Z]+[a-z0-9]*/g).join(config.delimiter).toLowerCase();
        if (opts && opts.pattern) {
            path += opts.pattern;
        }
        path += ' ' + http_method_names[method];
    }
    return path;
}

const isHttpMethod = (key: string) => {
    return http_method_names.indexOf(key) > -1;
}

/**
 * 创建路由表
 */
export function createRouteTable(): [Map<string, Route>, Route[]] {

    let generals = new Map<string, Route>();
    let patterns = new Array<Route>();
    var ctrlPaths = new Map<ControllerConstructor, string>();

    let actionOpts;
    let actionMap;

    let ctrls = ctrlOptions.keys();
    for (let ctrl of ctrls) {
        for (let i = 0; i < http_method_names.length; i++) {
            let method = http_method_names[i];
            let func = ctrl.prototype[method];
            if (!func || typeof func !== 'function') {
                continue;
            }
            actionMap = actionOptions.get(ctrl);
            if (!actionMap) {
                actionMap = new Map();
                actionOptions.set(ctrl, actionMap);
            }
            if (!actionMap.has(method)) {
                actionMap.set(method, null);
            }
        }
    }


    let keys;
    let path: string;
    let ctrlPath: string;
    let route: Route;

    ctrls = actionOptions.keys();
    for (let ctrl of ctrls) {
        actionMap = actionOptions.get(ctrl);

        keys = actionMap.keys();

        let path = ctrlPaths.get(ctrl);
        if (!path) {
            ctrlPath = createCtrlPath(ctrl);
            ctrlPaths.set(ctrl, path);
        }

        for (let key of keys) {
            actionOpts = actionMap.get(key);
            path = createActionPath(ctrlPath, key, actionOpts);
            route = {
                ctrl: ctrl,
                action: key,
                path: path
            };
            if (actionOpts && actionOpts.pattern) {
                let keys: any[] = [];
                route.pathRegExp = pathToRegexp(route.path, keys, {
                    strict: true,
                    end: true
                });
                route.pathRegKeys = keys;
                patterns.push(route);
            } else {
                generals.set(path, route);
            }
        }
    }

    return [generals, patterns];
}


export function isMulti(ctrl: ControllerConstructor) {
    let c = ctrlOptions.get(ctrl);
    return c ? c.multi : false;
}