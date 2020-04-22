import { createParamDecorator } from 'type-graphql';
import { fieldsProjection } from 'graphql-fields-list';

export function Fields(): ParameterDecorator {
    return createParamDecorator(({ info }) => {
        return Object.keys(
            fieldsProjection(info)
        ).filter(field => !field.includes('__typename'));
    });
}
