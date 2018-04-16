
import Koa = require('koa');

import * as router from '../../router';
import * as identity from '../../identity';
import * as auth from '../../auth';

export const koa = new Koa();

router.use(auth.run);

koa.use(identity.run);
koa.use(router.run);