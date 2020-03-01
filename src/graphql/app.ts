import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { ApolloServer } from 'apollo-server';
import Container from 'typedi';
import { createSchema, onConnect, contextMiddleware } from './helpers';

(async () => {
    await createConnection();

    const schema = await createSchema();
    const server = new ApolloServer({
        schema,
        subscriptions: { onConnect },
        debug: false,
        context: contextMiddleware,
        plugins: [
            {
                requestDidStart: () => ({
                    willSendResponse(requestContext) {
                        // disposes scoped container to prevent memory leaks
                        Container.reset(requestContext.context.requestId);
                    },
                }),
            },
        ],
    });

    server.listen({ port: 4000 }, () =>
        console.log(
            `Server ready at http://localhost:4000${server.graphqlPath}`
        )
    );
})();
