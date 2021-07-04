import Env from "@ioc:Adonis/Core/Env";
import { config } from "exceljs";

const configMySql = {
  client: "mysql2",
  connection: {
    host: Env.get("MYSQL_HOST"),
    port: Env.get("MYSQL_PORT"),
    user: Env.get("MYSQL_USER"),
    password: Env.get("MYSQL_PASSWORD", ""),
  },
} as any;

const configPg = {
  client: "pg",
  connection: {
    host: Env.get("PG_HOST"),
    port: Env.get("PG_PORT"),
    user: Env.get("PG_USER"),
    password: Env.get("PG_PASSWORD", ""),
  },
} as any;

async function dbConnection(dbName: String, dbConfig: any) {
  if (dbConfig === "mysql2") {
    const config = {
      client: "mysql2",
      connection: {
        host: Env.get("MYSQL_HOST"),
        port: Env.get("MYSQL_PORT"),
        user: Env.get("MYSQL_USER"),
        password: Env.get("MYSQL_PASSWORD", ""),
        database: dbName,
      },
    };

    return config;
  } else if (dbConfig === "pg") {
    const config = {
      client: "pg",
      connection: {
        host: Env.get("PG_HOST"),
        port: Env.get("PG_PORT"),
        user: Env.get("PG_USER"),
        password: Env.get("PG_PASSWORD", ""),
        database: dbName,
      },
    } as any;
    return config;
  }
}

async function connectTo(
  client: String,
  host: String,
  port: String,
  user: String,
  password: String,
  database: String
) {
  const config = {
    client: client,
    connection: {
      host: host,
      port: port,
      user: user,
      password: password,
      database: database,
    },
  };
  return config;
}

export { configMySql, configPg, dbConnection, connectTo };
