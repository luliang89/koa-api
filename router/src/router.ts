
import Koa = require('koa');
import compose = require('koa-compose');
import pathToRegexp = require('path-to-regexp');

import { Route, createRouteTable, isMulti } from './decorators';
import { ControllerInstance, ControllerConstructor } from './controller';

let middlewaresMap: Map<string, Koa.Middleware[]>;

let middlewareContainer: {
    middlewares: Koa.Middleware[],
    regexp: RegExp | null
}[];

let routeTable: [Map<string, Route>, Route[]];

const ctrlInstance = new Map<ControllerConstructor, ControllerInstance>();

const path_all = '*';

const isNullOrUndefined = (o: any) => o === null || o === undefined;

const getRouteParams = (route: Route, path: string) => {
    let result = route.pathRegExp.exec(path);
    // console.log(result, route.pathRegKeys);
    let params: any;
    if (result && result.length) {
        params = {};
        route.pathRegKeys.forEach((key, i) => {
            params[key.name] = result[i + 1];
        });
    }
    return params;
}

const match = (context: Koa.Context) => {

    let path = context.path + ' ' + context.method.toLowerCase();
    let route = routeTable[0].get(path);

    if (route) {
        return route;
    }

    // console.log(path, routeTable[1]);

    route = routeTable[1].find(r => r.pathRegExp.test(path));

    if (route) {
        let params = getRouteParams(route, path);
        if (params) {
            context.query = context.query ? Object.assign(context.query, params) : params;
        }
    }

    return route;

}

const reg = /^[\w-_]+&/;

export function use(path: Koa.Middleware | string, func?: Koa.Middleware) {
    if (typeof path === 'string') {
        if (!func) {
            throw new Error('func is required')
        }
        if (!path) {
            path = path_all;
        }
    } else {
        func = path;
        path = path_all;
    }

    if (!middlewaresMap) {
        middlewaresMap = new Map();
    }

    let arr = middlewaresMap.get(path);
    if (!arr) {
        arr = [func];
        middlewaresMap.set(path, arr);
    } else {
        arr.push(func);
    }
}

function filterMiddlewares(context: Koa.Context) {
    if (!middlewareContainer) {

        if (!middlewaresMap || !middlewaresMap.size) {
            return;
        }

        middlewareContainer = [];
        middlewaresMap.forEach((val, k) => {
            middlewareContainer.push({
                middlewares: val,
                regexp: k === path_all ? null : new RegExp(k)
            });
        });
        middlewaresMap.clear();
        middlewaresMap = null;
    }
    let queue: Koa.Middleware[] = [];
    middlewareContainer.filter(x => x.regexp ? x.regexp.test(context.path) : x)
        .map(x => queue = queue.concat(x.middlewares));

    console.log(middlewareContainer, queue);
    return queue;
}

export async function run(context: Koa.Context, next: () => Promise<any>) {

    if (!routeTable) {
        routeTable = createRouteTable();
    }

    let route = match(context);
    if (!route) {
        context.throw(404);
    }
    context.route = route;

    let middlewares = filterMiddlewares(context);
    if (middlewares && middlewares.length) {
        middlewares.push(exec);
        await compose(middlewares)(context);
    } else {
        await exec(context, next);
    }

}

async function exec(context: Koa.Context, next: () => Promise<any>) {
    let route = context.route;
    let multi = isMulti(route.ctrl);

    const newCtrlAndCallOnInit = async (context: Koa.Context) => {
        let c: any = new context.route.ctrl();
        c.context = context;
        if (c.onInit && typeof c.onInit === 'function') {
            await c.onInit();
        }
        return c;
    }

    let c: ControllerInstance;
    if (multi) {
        c = await newCtrlAndCallOnInit(context);
    } else {
        c = ctrlInstance.get(route.ctrl);
        if (!c) {
            c = await newCtrlAndCallOnInit(context);
            ctrlInstance.set(route.ctrl, c);
        }
    }
    c.context = context;

    let oc = c as any;

    try {
        let res = await oc[route.action]();
        if (!isNullOrUndefined(res)) {
            context.body = res;
        } else {
            if (isNullOrUndefined(context.body)) {
                context.status = 204;
            }
        }
    } finally {
        if (multi) {
            if (oc.onDestroy && typeof oc.onDestroy === 'function') {
                await oc.onDestroy();
            }
        }
    }

}

