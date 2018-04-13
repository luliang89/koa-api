
import { HttpMethod } from './http-method';

export interface ActionOptions {

    /**
     * 别名
     */
    alias?: string

    method?: HttpMethod

    /**
     * 模式
     */
    pattern?: string

}
