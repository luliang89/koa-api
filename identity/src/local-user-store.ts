
import { UserStore, IdentityData } from './user-store';

export class LocalUserStore<T> implements UserStore<T> {

    private store: Map<string, IdentityData<T>>;

    constructor() {
        this.store = new Map();
    }

    async set(identity: string, data: IdentityData<T>) {
        this.store.set(identity, data);
    }

    async get(identity: string) {
        return this.store.get(identity);
    }

    async remove(identity: string) {
        this.store.delete(identity);
    }

}