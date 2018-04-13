
import 'mocha';
import assert = require('assert');
import Koa = require('koa');

import * as router from '../src';

const next = async () => { };

const catchFunc = (done: any) => {
    return (err: any) => {
        console.log(err);
        assert.ifError(err);
        done();
    }
};


@router.Controller()
class UserController {

    context: Koa.Context

    get() {
        return 'get';
    }

    post() {
        return 'post';
    }

    put() {
        return 'put';
    }

    delete() {
        return 'delete';
    }

    @router.HttpGet()
    address() {
        return 'address';
    }

    @router.HttpGet({
        alias: 'aa'
    })
    alias() {
        return 'aa';
    }

    @router.HttpGet({
        pattern: '/:id'
    })
    getById() {
        return this.context.query.id;
    }

    @router.HttpGet({
        pattern: '/:year-:month-:day'
    })
    moreThan() {
        let q = this.context.query;
        return new Date(q.year, q.month, q.day);
    }

}

@router.Controller()
class AdminController {

    context: Koa.Context

    get() {
        return this.context.state.m2;
    }

}

router.use(async (context: Koa.Context, next: () => Promise<any>) => {
    if (!context.state) {
        context.state = {};
    }
    context.state.m1 = 'm1';
    await next();
});

router.use('/admin', async (context: Koa.Context, next: () => Promise<any>) => {
    if (!context.state) {
        context.state = {};
    }
    context.state.m2 = 'm2';
    await next();
});

describe('router', function () {

    describe('route', function () {

        it('get', function (done) {

            var ctx: any = {
                path: '/user',
                method: 'GET',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, 'get');
                done();
            }).catch(catchFunc(done));

        });

        it('post', function (done) {

            var ctx: any = {
                path: '/user',
                method: 'post',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, 'post');
                done();
            }).catch(catchFunc(done));

        });

        it('put', function (done) {

            var ctx: any = {
                path: '/user',
                method: 'put',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, 'put');
                done();
            }).catch(catchFunc(done));

        });

        it('delete', function (done) {

            var ctx: any = {
                path: '/user',
                method: 'delete',
            };

            // let time = new Date().getTime();
            router.run(ctx as any, next).then(() => {
                // console.log((new Date().getTime() - time) + 'ms');
                assert.equal(ctx.body, 'delete');
                done();
            }).catch(catchFunc(done));

        });

    })

    describe('http', function () {

        it('get address', function (done) {

            var ctx: any = {
                path: '/user/address',
                method: 'GET',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, 'address');
                done();
            }).catch(catchFunc(done));

        });

        it('get alias', function (done) {

            var ctx: any = {
                path: '/user/aa',
                method: 'GET',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, 'aa');
                done();
            }).catch(catchFunc(done));

        });

        it('pattern /:id', function (done) {
            var ctx: any = {
                path: '/user/get-by-id/1',
                method: 'GET',
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.body, '1');
                done();
            }).catch(catchFunc(done));
        });

        it('pattern /:year-:month-:day', function (done) {
            var ctx: any = {
                path: '/user/more-than/2018-4-13',
                method: 'GET',
            };

            router.run(ctx as any, next).then(() => {
                let d: Date = ctx.body;
                let ok = d.getFullYear() === 2018 && d.getMonth() === 4 && d.getDate() === 13;
                assert.ok(ok);
                done();
            }).catch(catchFunc(done));
        });

    })

    describe('use', function () {

        it('* m1', function (done) {

            var ctx: any = {
                path: '/user',
                method: 'GET'
            };

            router.run(ctx as any, next).then(() => {
                assert.equal(ctx.state.m1, 'm1');
                done();
            }).catch(catchFunc(done));
        })

        it('/admin m2', function (done) {

            var ctx: any = {
                path: '/admin',
                method: 'GET'
            };

            router.run(ctx as any, next).then(() => {
                console.log(ctx.state);
                let ok = ctx.state.m1 === 'm1' && ctx.body === 'm2';
                assert.ok(ok);
                done();
            }).catch(catchFunc(done));
        })

    })

})