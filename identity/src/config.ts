

import { UserStore, IdentityData } from './user-store';

export interface IdentityConfig {

    appName?: string,

    secret: string,

    store: UserStore<any>,

    /**
     * 单位分
     */
    expires: number

}

export const config: IdentityConfig = {

    appName : '',

    secret: 'secret',

    expires: 20

} as any;