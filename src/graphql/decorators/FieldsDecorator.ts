import { createParamDecorator } from 'type-graphql';
import graphqlFields from 'graphql-fields';

export function Fields(): ParameterDecorator {
    return createParamDecorator(({ info }) => {
        const fieldsArray: string[] = Object.keys(graphqlFields(info));
        return fieldsArray;
    });
}
