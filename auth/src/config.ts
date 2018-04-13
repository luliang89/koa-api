
import { RoleValidator } from './role-validator';

export interface AuthConfig {

    roleValidator?: RoleValidator
    
}

export const config: AuthConfig = {} as any;