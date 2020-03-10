import { createParamDecorator } from 'type-graphql';
import { fieldsProjection } from 'graphql-fields-list';

export function Fields(): ParameterDecorator {
    return createParamDecorator(({ info }) => {
        const fieldsArray: string[] = Object.keys(
            fieldsProjection(info)
        ).filter(field => field !== '__typename');
        return fieldsArray;
    });
}
