import { BaseController, ParamDefinition } from '../../..';

export class RefreshToken extends BaseController {
    protected override defineParams(): ParamDefinition[] {
        return [];
    }
    protected override async execute(): Promise<any> {
        return this.success({
            token: 'refresh token',
        });
    }
}
