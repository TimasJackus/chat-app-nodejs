import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server";
import { buildSchema, ResolverData } from "type-graphql";
import { BookResolver } from "./resolvers/BookResolver";
import Container from "typedi";

const main = async () => {
  await createConnection();
  const schema = await buildSchema({
    resolvers: [BookResolver],
    container: (({ context }: ResolverData<any>) => Container.of(context.requestId)) 
  });
  const server = new ApolloServer({ 
    schema,
    context: () => ({
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
  await server.listen(4000);
  console.log("Server has started!");
}

main();
