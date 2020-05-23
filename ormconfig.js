module.exports = {
  name: "default",
  type: "postgres",
  host: process.env.PG_HOST,
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "chat",
  synchronize: true,
  logging: true,
  entities: ["src/entities/*.ts"],
  subscribers: ["src/repositories/subscribers/*.ts"],
  migrations: ["src/migrations/*.ts"],
  cli: {
    entitiesDir: "src/entities",
    migrationsDir: "src/migrations",
    subscribersDir: "src/subscribers/repositories",
  },
};
