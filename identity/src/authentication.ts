
import crypto = require('crypto');

import Koa = require('koa');

import { config } from './config'
import { LocalUserStore } from './local-user-store';


const cookieName = config.appName + '-identity';

const userStore = config.store ? config.store : new LocalUserStore();

const sign = (str: string, secret: string) => {
    return crypto.createHmac('sha1', secret)
        .update(str).digest().toString('base64');
}

const getStoreIdentity = (str: string) => {
    return cookieName + '-' + str;
}

function getOrSetIdentity(context: Koa.Context) {
    let identity = context.cookies.get(cookieName);
    if (!identity) {
        let req = context.request;
        let ip = req.header['x-real-ip'] || req.ip;
        let rand = Math.floor(Math.random() * 1000);
        identity = sign(`${req.ip}:${Date()}:${rand}`, config.secret);
        context.cookies.set(cookieName, identity);
    }
    return identity;
}

export async function signIn<T>(context: Koa.Context, user: T) {
    let identity = getOrSetIdentity(context);
    context.state.isAuthenticated = true;
    let expires = new Date().getTime() + config.expires * 3600000;
    await userStore.set(getStoreIdentity(identity), {
        user: user,
        expires: expires
    });
    context.state.user = user;
}

export async function signOut(context: Koa.Context) {
    let identity = getOrSetIdentity(context);
    context.state.isAuthenticated = false;
    let expires = new Date().getTime() - 1000;
    await userStore.set(getStoreIdentity(identity), {
        user: context.state.user,
        expires: expires
    });
}

export async function run(context: Koa.Context, next: () => Promise<void>) {
    let identity = context.cookies.get(cookieName);
    if (identity) {
        identity = decodeURIComponent(identity);
        let data = await userStore.get(getStoreIdentity(identity));
        if (data) {
            context.state.isAuthenticated = new Date().getTime() > data.expires;
            context.state.user = data.user;
        }
    } else {
        getOrSetIdentity(context);
    }

    await next();
}