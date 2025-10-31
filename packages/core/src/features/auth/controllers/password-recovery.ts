import { BaseController, ParamDefinition } from '../../../index.js';

export class PasswordRecovery extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [
            {
                name: 'email',
                type: 'email',
                required: true,
            },
        ];
    }
    protected override async execute(): Promise<any> {
        return this.success({
            message: 'Password recovery email sent',
        });
    }
}
