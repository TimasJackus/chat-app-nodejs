import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import { createSchema, onConnect, contextMiddleware } from "./helpers";
import { disposeScopedContainer } from "./helpers/disposeScopedContainer";
import express from "express";
import { graphqlUploadExpress } from "graphql-upload";
import { settings } from "../../settings";
import path from "path";
import http from "http";

(async () => {
  await createConnection();

  const schema = await createSchema();
  const apolloServer = new ApolloServer({
    schema,
    subscriptions: { onConnect },
    debug: false,
    context: contextMiddleware,
    plugins: [disposeScopedContainer],
    uploads: false,
  });

  const app = express();
  app.use(
    "/images",
    express.static(path.join(settings.rootDir, "storage/images"))
  );
  app.use(graphqlUploadExpress({ maxFileSize: 2 * 1024 * 1024, maxFiles: 1 }));
  apolloServer.applyMiddleware({ app });

  const httpServer = http.createServer(app);
  apolloServer.installSubscriptionHandlers(httpServer);
  httpServer.listen({ port: 4000 }, () => {
    console.log(
      `Server ready at http://localhost:4000${apolloServer.graphqlPath}`
    );
    console.log(
      `Subscriptions ready at ws://localhost:4000${apolloServer.subscriptionsPath}`
    );
  });
})();
