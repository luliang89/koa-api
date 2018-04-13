
import { Route } from './decorators';

declare module 'koa' {

    class Context {

        route: Route

    }

}