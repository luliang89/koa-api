
import util = require('util');

import redis = require('redis');

import { UserStore, IdentityData } from './user-store';

export class RedisUserStore<T> implements UserStore<T> {

    private store: Map<string, IdentityData<T>>;

    private hmset: any;
    private hgetall: any;
    private del: any;

    constructor(
        private redisClient: redis.RedisClient
    ) {
        this.hmset = util.promisify(redisClient.hmset).bind(redisClient);
        this.hgetall = util.promisify(redisClient.hgetall).bind(redisClient);
        this.del = util.promisify(redisClient.del).bind(redisClient);
    }

    async set(identity: string, data: IdentityData<T>) {
        for (let k in data.user) {
            if (data.user[k] === undefined || data.user[k] === null) {
                delete data.user[k];
            }
        }
        await this.hmset(identity, data);
    }

    async get(identity: string) {
        return await this.hgetall(identity);
    }

    async remove(identity: string) {
        await this.del(identity);
    }

}