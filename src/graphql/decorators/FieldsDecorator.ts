import { createParamDecorator } from 'type-graphql';
import graphqlFields from 'graphql-fields';
import { fieldsList, fieldsMap, fieldsProjection } from 'graphql-fields-list';

export function Fields(): ParameterDecorator {
    return createParamDecorator(({ info }) => {
        const fieldsArray: string[] = Object.keys(
            fieldsProjection(info)
        ).filter(field => field !== '__typename');
        return fieldsArray;
    });
}
