import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server";
import { buildSchema, ResolverData } from "type-graphql";
import Container from "typedi";
import { authChecker } from './AuthChecker';

const main = async () => {
  await createConnection();

  const schema = await buildSchema({
    resolvers: [__dirname + "/resolvers/**/*.ts"],
    container: (({ context }: ResolverData<any>) => Container.of(context.requestId)),
    authChecker
  });
  const server = new ApolloServer({ 
    schema,
    debug: false,
    context: ({ req }) => ({
      authorization: req.headers.authorization,
      requestId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
    }),
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
