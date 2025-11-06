import { BaseController, ParamDefinition } from "@atriz/core";

export class SignUp extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [
            { name: 'email', type: 'email', required: true },
            { name: 'password', type: 'password', required: true }
        ];
    }
    protected override async execute(): Promise<any> {
        const { email } = this.params;

        return this.success({
            token: 'mamadas ' + email,
        });
    }
}