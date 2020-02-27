import { Service } from "typedi";
import BookRepository from "../repositories/BookRepository";

@Service()
export default class BookService {
    constructor(private readonly bookRepository: BookRepository) { }

    getBookById(id: string, fields: string[]) {
        const book = this.bookRepository.getBookById(id, fields);
        return book;
    }
}