import { BaseController, ParamDefinition } from '@atriz/core';

export class PasswordRecovery extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [{ name: 'email', type: 'email', required: true }];
    }
    protected override async execute(): Promise<any> {
        const { email } = this.params;

        return this.success({
            email,
        });
    }
}
