import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server";
import { buildSchema, ResolverData } from "type-graphql";
import Container from "typedi";
import { getUserFromToken } from './getUserFromToken';
import { createSchema } from "./createSchema";

const main = async () => {
  await createConnection();

  const schema = await createSchema();
  const server = new ApolloServer({ 
    schema,
    subscriptions: { onConnect: (connectionParams: any, webSocket) => {
      const user = getUserFromToken(connectionParams.authorization);
      if (user) {
        return {
          user
        };
      }

      throw new Error('Missing auth token!');
    }},
    debug: false,
    context: ({ req, connection }) => {
      if (connection) {
        return connection.context;
      }
      return {
        authorization: req?.headers?.authorization,
        requestId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
      };
    },
    plugins: [
      {
        requestDidStart: () => ({
          willSendResponse(requestContext) {
            Container.reset(requestContext.context.requestId); // <-- disposes scoped container to prevent memory leaks
          },
        }),
      },
    ],
  });


  server.listen({ port: 4000 }, () =>
    console.log(`Server ready at http://localhost:4000${server.graphqlPath}`),
  );
}

main();
