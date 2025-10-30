import { BaseController, ParamDefinition } from '../../..';

export class Register extends BaseController {
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
            message: 'User registered',
        });
    }
}
