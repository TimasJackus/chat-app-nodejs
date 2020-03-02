import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { ApolloServer } from 'apollo-server';
import { createSchema, onConnect, contextMiddleware } from './helpers';
import { disposeScopedContainer } from './helpers/disposeScopedContainer';

(async () => {
    await createConnection();

    const schema = await createSchema();
    const server = new ApolloServer({
        schema,
        subscriptions: { onConnect },
        debug: false,
        context: contextMiddleware,
        plugins: [disposeScopedContainer],
    });

    server.listen({ port: 4000 }, () =>
        console.log(
            `Server ready at http://localhost:4000${server.graphqlPath}`
        )
    );
})();
