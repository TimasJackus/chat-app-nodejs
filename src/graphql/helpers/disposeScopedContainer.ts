import Container from 'typedi';
import { ApolloServerPlugin } from 'apollo-server-plugin-base';
import { Context } from '../types';

export const disposeScopedContainer: ApolloServerPlugin<Context> = {
    requestDidStart: () => ({
        willSendResponse(requestContext) {
            Container.reset(requestContext.context.requestId);
        },
    }),
};
