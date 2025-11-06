import { BaseController, ParamDefinition } from '@atriz/core';

export class NewContact extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [
            { name: 'email', type: 'email', required: true },
            { name: 'message', type: 'string', required: true },
        ];
    }
    protected override async execute(): Promise<any> {
        const { email, message } = this.params;

        return this.success({
            email,
            message,
        });
    }
}
