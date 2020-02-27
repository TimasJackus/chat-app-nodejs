import { Resolver, Query, Mutation, Arg, Info, Ctx } from "type-graphql";
import { Book } from "../entities/Book";
import { CreateBookInput } from "../inputs/CreateBookInput";
import { UpdateBookInput } from "../inputs/UpdateBookInput";
import { Service } from 'typedi';
import BookService from "../services/BookService";
import { Fields } from "../decorators/FieldsDecorator";

@Service()
@Resolver()
export class BookResolver {
  constructor(private readonly bookService: BookService) { }
  
  @Query(() => [Book])
  books() {
    return Book.find();
  }

  @Query(() => Book)
  book(@Arg("id") id: string, @Fields() fields: string[]) {
    return this.bookService.getBookById(id, fields);
  }

  @Mutation(() => Book)
  async createBook(@Arg("data") data: CreateBookInput) {
    const book = Book.create(data);
    await book.save();
    return book;
  }

  @Mutation(() => Book)
  async updateBook(@Arg("id") id: string, @Arg("data") data: UpdateBookInput) {
    const book = await Book.findOne({ where: { id } });
    if (!book) throw new Error("Book not found!");
    Object.assign(book, data);
    await book.save();
    return book;
  }

  @Mutation(() => Boolean)
  async deleteBook(@Arg("id") id: string) {
    const book = await Book.findOne({ where: { id } });
    if (!book) throw new Error("Book not found!");
    await book.remove();
    return true;
  }
}
