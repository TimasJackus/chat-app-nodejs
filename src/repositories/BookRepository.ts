import { Book } from "../entities/Book";
import { Service } from "typedi";
import FieldsDataLoader from "../FieldsDataLoader";
import { getBooksByIds } from "./loaders";

@Service()
export default class BookRepository {
    private readonly loader: FieldsDataLoader<string, Book>;

    constructor() {
      this.loader = new FieldsDataLoader(getBooksByIds, 'book');
    }

    getBookById(id: string, fields: string[]) {
      return this.loader.loadSelect(id, fields);
    }
}