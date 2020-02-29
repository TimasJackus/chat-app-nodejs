import { Connection } from "typeorm";
import { testConn } from "./testConn";
import { callToGraphQL } from "./test-utils";
import { User } from "../src/entities";
import faker from "faker";

let conn: Connection;
beforeAll(async () => {
  conn = await testConn();
});
afterAll(async () => {
  await conn.close();
});

const registerMutation = `
mutation Register($data: RegisterInput!) {
    register(
        data: $data
    ) {
        id
        email
        displayName
        phoneNumber
        description
        imageUrl
    }
}
`;

describe("Register", () => {
  it("create user", async () => {
    const user = {
      displayName: faker.name.firstName() + faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password()
    };

    const response: any = await callToGraphQL({
      source: registerMutation,
      variableValues: {
        data: user
      }
    });

    expect(response).toMatchObject({
        data: {
            register: {
                id: response?.data?.register?.id,
                email: user.email,
                displayName: user.displayName,
                phoneNumber: null,
                description: null,
                imageUrl: null,
            }
        }
    });

    const dbUser = await User.findOne({ where: { email: user.email } });
    expect(dbUser).toBeDefined();
    expect(dbUser!.displayName).toBe(user.displayName);
  });
});