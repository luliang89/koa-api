
import { Controller, HttpGet } from '../../router';
import { Authorized } from '../../auth';
import { ControllerBase } from './controler-base';

@Controller()
export class UserController extends ControllerBase {

    @Authorized()
    async get() {
        return 'user get';
    }

    @HttpGet()
    async signUp() {
        return 'user sign up';
    }


}