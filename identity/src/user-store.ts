
export interface IdentityData<T> {

    user: T

    /**
     * Date毫秒数
     */
    expires: number

}

export interface UserStore<T> {

    set(identity: string, data: IdentityData<T>): Promise<void>;

    get(identity: string): Promise<IdentityData<T>>;

    remove(identity: string): Promise<void>;

}

