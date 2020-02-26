import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server";
import { buildSchema } from "type-graphql";
import { BookResolver } from "./resolvers/BookResolver";
import FieldsDataLoader from "./FieldsDataLoader";
import BookRepository from "./repositories/BookRepository";

const main = async () => {
  await createConnection();
  const schema = await buildSchema({ resolvers: [BookResolver] });
  const bookRepository = new BookRepository();
  const server = new ApolloServer({ 
    schema,
    context: () => ({
        bookLoader: new FieldsDataLoader(bookRepository.getBooksByIds, 'book')
    })
  });
  await server.listen(4000);
  console.log("Server has started!");
}

main();
