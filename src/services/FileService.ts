import { Service } from "typedi";
import { FileUpload } from "graphql-upload";
import path from "path";
import { settings } from "../../settings";
import { createWriteStream } from "fs";
import { v4 as uuidv4 } from "uuid";
import { GraphQLError } from "graphql";

@Service()
export class FileService {
  async uploadImage(image: FileUpload): Promise<string> {
    const { createReadStream, filename } = await image;
    console.log(image);
    const extension = filename.split(".").pop() || "";
    const allowedExtensions = ["png", "jpeg", "jpg", "gif", "tiff"];
    if (!allowedExtensions.includes(extension.toLowerCase())) {
      throw new GraphQLError(
        "Could not upload image! Provided file must be an image!"
      );
    }
    const filenameUuid = `${uuidv4()}.${extension}`;
    const imageDestination = path.join(
      settings.rootDir,
      "/storage/images/",
      filenameUuid
    );
    return new Promise((resolve, reject) => {
      const stream = createReadStream();
      stream.on("error", () =>
        reject("Could not upload image! File exceeds 2 MB limit.")
      );
      stream.pipe(
        createWriteStream(imageDestination)
          .on("error", () => {
            reject("Could not upload image! File exceeds 2 MB limit.");
          })
          .on("finish", () => {
            resolve(`/images/${filenameUuid}`);
          })
      );
    });
  }
}
