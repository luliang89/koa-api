'use strict';

import 'mocha';
import assert = require('assert');
import Koa = require('koa');

import { Authorized, Anonymous, RoleValidator, config, run } from '../src';

class DefRoleValidator implements RoleValidator {

    async validate(user: any, roles: string[]) {
        if (!user.roles) {
            return false;
        }
        for (let r of roles) {
            if (user.roles.indexOf(r) < 0) {
                return false;
            }
        }
        return true;
    }

}

config.roleValidator = new DefRoleValidator();

class Ctrl {
    @Authorized()
    add() {
        throw 'add';
    }
}

class Ctrl2 {
    @Authorized('r')
    add() {
        throw 'add';
    }
}

@Authorized()
class AuthClass {
    add() {
        throw 'add';
    }
}

@Authorized('r')
class AuthClass2 {
    add() {
        throw 'add';
    }
}

@Authorized()
class AuthCross {

    get() {
        throw 'add';
    }

    @Anonymous()
    add() {
        throw 'add';
    }

}

@Authorized('r')
class AuthCross2 {

    @Anonymous()
    get() {
        throw 'get';
    }

    @Authorized('o')
    add() {
        throw 'add';
    }

}

describe('Authorization', function () {

    var ctx: any;

    var next: any;

    beforeEach(function () {
        ctx = {
            redirect: function (url: string) {
                throw 'redirect';
            },
            throw: function (status: number) {
                throw status;
            }
        };

        next = () => {
            return new Promise<void>((resolve, reject) => {
                var ctrl = new Ctrl();
                try {
                    ctrl.add();
                } catch (e) {
                    reject(e);
                }
                resolve();
            });
        };

    });

    describe('authorize method', function () {

        it('not logged', function (done) {
            ctx.state = {};
            ctx.route = {
                ctrl: Ctrl,
                action: 'add'
            }

            run(ctx, next).catch(e => {
                console.log(e);
                assert.equal(e, '401');
                done();
            });
        });

        it('logged', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: Ctrl,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    var ctrl = new Ctrl();
                    try {
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

        it('unauthorized ', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: Ctrl2,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    var ctrl = new Ctrl2();
                    try {
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, '403');
                done();
            });
        });

        it('authorized ', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name',
                    roles: 'r'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: Ctrl2,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    var ctrl = new Ctrl2();
                    try {
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

    });

    describe('authorize class', function () {

        it('not logged', function (done) {
            ctx.state = {};
            ctx.route = {
                ctrl: AuthClass,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthClass();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, '401');
                done();
            });
        });

        it('logged', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthClass,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthClass();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

        it('unauthorized', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthClass2,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    var ctrl = new AuthClass2();
                    try {
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, '403');
                done();
            });
        });

        it('authorized', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name',
                    roles: 'r'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthClass,
                action: 'add'
            }
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    var ctrl = new AuthClass2();
                    try {
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

    });

    describe('authorize cross', function () {

        it('not logged allowAnonymous', function (done) {
            ctx.state = {};
            ctx.route = {
                ctrl: AuthCross,
                action: 'add'
            };
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthCross();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

        it('not logged', function (done) {
            ctx.state = {};
            ctx.route = {
                ctrl: AuthCross,
                action: 'get'
            };
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthCross();
                        ctrl.get();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, '401');
                done();
            });
        });

        it('logged allowAnonymous', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name'
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthCross,
                action: 'add'
            };
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthCross();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

        it('authorized', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name',
                    roles: ['r', 'o']
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthCross2,
                action: 'add'
            };
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthCross2();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, 'add');
                done();
            });
        });

        it('unauthorized', function (done) {
            ctx.state = {
                user: {
                    id: 'id',
                    name: 'name',
                    roles: ['r']
                }
            };
            ctx.state.isAuthenticated = true;
            ctx.route = {
                ctrl: AuthCross2,
                action: 'add'
            };
            var next = () => {
                return new Promise<void>((resolve, reject) => {
                    try {
                        var ctrl = new AuthCross2();
                        ctrl.add();
                    } catch (e) {
                        reject(e);
                    }
                    resolve();
                });
            };

            run(ctx, next).catch(e => {
                assert.equal(e, '403');
                done();
            });
        });

    });

}); 
