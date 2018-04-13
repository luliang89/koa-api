/**
 * 角色验证器
 */
export interface RoleValidator {

    validate<T>(user: T, roles: string[]): Promise<boolean>;

}