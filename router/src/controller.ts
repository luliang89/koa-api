
import Koa = require('koa');

export interface ControllerOptions {

    /**
     * 多例，默认false
     */
    multi: boolean

    /**
     * 前缀
     */
    prefix: string

}

export interface OnInit {

    onInit(): Promise<void>

}

export interface OnDestroy {

    onDestroy(): Promise<void>

}

export interface OnActionCallBefore {

    onActionCallBefore(context: Koa.Context): Promise<void>

}

export interface OnActionCallAfter {

    onActionCallAfter(context: Koa.Context): Promise<void>

}

export interface ControllerInstance {

    context: Koa.Context

}

export interface ControllerConstructor {

    new(): ControllerInstance

}
