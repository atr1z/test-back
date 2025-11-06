import { BaseController, ParamDefinition } from '@atriz/core';

export class RefreshToken extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [{ name: 'refreshToken', type: 'string', required: true }];
    }
    protected override async execute(): Promise<any> {
        const { refreshToken } = this.params;

        return this.success({
            token: 'mamadas ' + refreshToken,
        });
    }
}
