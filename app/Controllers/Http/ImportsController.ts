import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Excel, { Workbook } from "exceljs";
import Kepsek from "App/Models/Kepsek";
import Sekolah from "App/Models/Sekolah";
import { Parser } from "node-sql-parser";
import fs from "fs";
import mysql from "mysql2";
import Env from "@ioc:Adonis/Core/Env";
import { exec } from "child_process";

import Database from "@ioc:Adonis/Lucid/Database";
import { configMySql, configPg, connectTo, dbConnection } from "./configDb";

import sleep from "sleep";
import { table } from "console";

export default class ImportsController {
  async import({ request, response }: HttpContextContract) {
    let upload = request.file("upload");
    let fname = `${new Date().getTime()}.${upload?.fileName}`;
    let dir = "upload/";
    //move uploaded file into custom folder
    await upload?.move("uploads", {
      overwrite: true,
    });

    let path = upload?.fileName!;

    if (!upload?.move) {
      return upload?.errors, "Error moving files", 500;
    }

    let res_sekolah;
    let res_kepsek;

    let workBook = new Excel.Workbook();
    workBook = await workBook.xlsx.readFile(path);
    let sheet = workBook.getWorksheet("Sheet 1");

    console.log(workBook.worksheets);

    let colComment = sheet.getColumn("C");

    colComment.eachCell(async (cell, rowNumber) => {
      if (rowNumber >= 11) {
        let sekolah = sheet.getCell("B" + rowNumber).value as any;
        let kode = sheet.getCell("C" + rowNumber).value as any;
        let nama = sheet.getCell("D" + rowNumber).value as String;
        let nip = sheet.getCell("E" + rowNumber).value as String;

        //custom field name in database to variable
        let inputSekolah = {
          nama_sekolah: sekolah,
          kode_sekolah: kode,
        };

        let inputNama = {
          nama_kepsek: nama,
          nip: nip,
          id_sekolah: kode,
        };

        //   let resNama = new Kepsek()
        //   inputNama.id_sekolah = resSekolah.id

        let resSekolah = new Sekolah();
        resSekolah.name = sekolah;
        resSekolah.code = kode;

        let resKepsek = new Kepsek();
        resKepsek.name = nama;
        resKepsek.ip = nip;
        resKepsek.id_sekolah = kode;
        await resSekolah.save();
        await resKepsek.save();

        //   inputNama.id_sekolah = resSekolah.id
        //   let resNama = new Kepsek()
        //   console.log('sekolah', resSekolah.toJSON())
      }
    });

    response.json({
      kepsek: res_kepsek,
      sekolah: res_sekolah,
    });
  }

  async parseSql({ request, response }: HttpContextContract) {
    const parser = new Parser();
    let file = request.file("file");

    let filename = file?.tmpPath as any;

    console.log(filename);

    // console.log(rl.line.length);

    const mysqslObj = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "aloneking",
      database: "rezaizadi",
    });

    let sql = fs.readFileSync(filename).toString().split(";");

    for (let i = 0; i < sql.length - 1; i++) {
      let r = mysqslObj.query(sql[i]);
    }
    // console.log("SQL: ", sql);
    response.json("done");
  }
  async data({ response }: HttpContextContract) {
    const mysqslObj = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "aloneking",
      database: "rezaizadi",
      rowsAsArray: true,
    });

    let sql = Database.manager.connect("mysql");

    console.log(sql);

    let conn = mysqslObj.connect((err) => {
      if (err) {
        throw `error: ${err}`;
      }
      console.log("Database connected successfully");
    });

    let rs;
    let array = [] as String[];

    let query = mysqslObj.query(
      "select * from mock_data",
      function (err, results: String[], fields) {
        console.log(results.length);

        for (let index = 0; index < 10; index++) {
          array.push(results[index]);
          console.log(results[index]);
        }
      }
    );

    console.log(array);

    response.json(query);
  }

  async connectToDatabase({ response }: HttpContextContract) {
    // let conn = Database.connection("mysql");
    // let query = await conn.rawQuery("select name from kepseks");

    const configObj = {
      client: "mysql2",
      connection: {
        host: Env.get("MYSQL_HOST"),
        port: Env.get("MYSQL_PORT"),
        user: Env.get("MYSQL_USER"),
        password: Env.get("MYSQL_PASSWORD", ""),
        database: "rezaizadi",
      },
    } as any;

    Database.manager.add("reza", configObj);

    let conn3 = Database.connection("reza");
    let query = await conn3.rawQuery("select first_name from mock_data");

    response.json(query);
  }

  async createDb({ response }: HttpContextContract) {
    const conn = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "aloneking",
    });

    conn.connect(function (err) {
      if (err) throw err;

      conn.query("CREATE DATABASE mydb", function (err, result) {
        if (err) throw err;
        console.log("Database created");
      });
    });
    response.json("created");
  }

  async createDbLucid({ response }: HttpContextContract) {
    Database.manager.add("izadi", configMySql);
    let conn = Database.connection("izadi");
    let query = await conn.rawQuery("create database mydb1");
    response.json(query);
  }

  async connectToPg({ response }: HttpContextContract) {
    let dbconn = dbConnection("students", "pg") as any;
    Database.manager.add("pg", dbconn);
    let conn = Database.connection("pg");
    let query = await conn.rawQuery("select * from answer");

    response.json(query.rows);
  }

  async createDatabaseUser({ request, response }: HttpContextContract) {
    // get values from user
    let file = request.file("file");
    let database = request.input("database");
    let dbName = request.input("name");

    // store tmp path for reading file
    let tmpPath = file?.tmpPath as any;

    let fileName = file?.fileName; // not use yet
    let sql = fs.readFileSync(tmpPath).toString().split(";");

    if (sql.length > 1) {
      if (database === "pg") {
        // register a connection base on user inputs adm then close a conn
        Database.manager.add(dbName, configPg);
        let dbConn = Database.connection(dbName);
        // create database base on sql file name if user doesnt give the name
        await dbConn.rawQuery(`create database ${dbName}`);
        await Database.manager.close(dbName, true);

        // here we create another conn for connecting to created db
        let dbConn1 = (await dbConnection(dbName, database)) as any;
        Database.manager.add(dbName, dbConn1);
        let conn1 = Database.connection(dbName);

        // base on user request loop throw the file and execute sql command
        // counting the tables
        let tableCount = 0;
        for (let i = 0; i < sql.length - 1; i++) {
          if (sql[i].includes("create table")) {
            tableCount += 1;
          }
          await conn1.rawQuery(sql[i]);
        }

        response.json({
          status: "success",
          data: {
            message: `Your ${dbName} has been created in ${database} successfully`,
          },
        });
      } else if (database === "mysql2") {
        // register a connection base on user inputs adm then close a conn
        Database.manager.add(dbName, configMySql);
        let dbConn = Database.connection(dbName);
        // create database base on sql file name if user doesnt give the name
        await dbConn.rawQuery(`create database ${dbName}`);
        await Database.manager.close(dbName, true);

        // check if connectio closed
        console.log(Database.manager.has(dbName)); // true

        // here we create another conn for connecting to created db
        let dbConn1 = (await dbConnection(dbName, database)) as any;
        Database.manager.add(dbName, dbConn1);
        let conn1 = Database.connection(dbName);

        // base on user request loop throw the file and execute sql command
        // Counting the tables
        let tableCount = 0;
        for (let i = 0; i < sql.length - 1; i++) {
          if (sql[i].includes("create table")) {
            tableCount += 1;
          }

          await conn1.rawQuery(sql[i]);
        }

        response.json({
          status: "success",
          data: {
            message: `Your ${dbName} has been created in ${database} successfully`,
          },
        });
      }
    } else {
      response.json({
        status: "Failed",
        message: "You file is empty",
      });
    }
  }

  async getTablesInfo({ request, response }: HttpContextContract) {
    const { dbName, dbConfig } = request.only(["dbName", "dbConfig"]) as any;

    let dbTable: String = request.input("dbTable")?.split(",");
    let command = request.input("cmd")?.split(" ");
    let field = request.input("field")?.split(",");
    let query;
    let join_fields = request.input("join_fields")?.split(",");

    // We choose db config between pg or mysql2
    // get the database and table and run some questy base on user request
    if (dbConfig === "pg") {
      // register a connection
      let dbConn = (await dbConnection(dbName, dbConfig)) as any;
      Database.manager.add(dbName, dbConn);
      let conn = Database.connection(dbName);

      /* 
        Check if given tables exist in our database or not
        if tables doesn't exist we give user an Error
      */
      let tables = await conn.getAllTables();
      let errorTables: String[] = [];
      let existTable;
      for (let i = 0; i < dbTable.length; i++) {
        existTable = tables.find((t) => t === dbTable[i].trim());

        if (!existTable) {
          errorTables.push(dbTable[i]);
        }
      }

      if (errorTables.length == 0) {
        if (dbTable) {
          /* field was empty query from all tables 
            otherwise return with given columns
          */
          if (command[0] === "select") {
            if (!command[1]) {
              if (!field) {
                query = await conn.from(dbTable[0]).select("*");
                response.json({
                  status: "Success",
                  data: query,
                });
              } else {
                query = await conn.from(dbTable[0]).select(field[0].trim());
                response.json({
                  status: "success",
                  data: query,
                });
              }
            } else if (tables.length > 1) {
              if (command[1] === "join") {
                console.log(field);

                if (command[1] === "join") {
                  if (!field) {
                    query = await conn
                      .from(dbTable[0])
                      .join(`${dbTable[1]}`, (query) => {
                        query.on((subQuery) => {
                          subQuery.on(
                            `${dbTable[0]}.${join_fields[0].trim()}`,
                            `${dbTable[1]}.${join_fields[1].trim()}`
                          );
                        });
                      })
                      .select("*");
                  } else if (field.length > 0) {
                    query = await conn.from(dbTable[0]).if(
                      field.length == 1,
                      (query) => {
                        query
                          .join(`${dbTable[1]}`, (query) => {
                            query.on((subQuery) => {
                              subQuery.on(
                                `${dbTable[0]}.${join_fields[0].trim()}`,
                                `${dbTable[1]}.${join_fields[1].trim()}`
                              );
                            });
                          })
                          .select(field[0].trim());
                      },
                      (query) => {
                        query
                          .join(`${dbTable[1]}`, (query) => {
                            query.on((subQuery) => {
                              subQuery.on(
                                `${dbTable[0]}.${join_fields[0].trim()}`,
                                `${dbTable[1]}.${join_fields[1].trim()}`
                              );
                            });
                          })
                          .select(field[0].trim())
                          .select(field[1]?.trim());
                      }
                    );
                  }

                  // query = await conn
                  // .from("user")
                  // .join(dbTable, `user.id`, "=", `${dbTable}.id`)
                  // .select("*");

                  response.json({
                    status: "success",
                    data: query,
                  });
                }
              }
            } else {
              response.json({
                status: "Failed",
                message: "You can't join any database you have only one table",
              });
            }
          }
        } else {
          response.json({
            status: "Failed",
            message: "No table given",
          });
        }
      } else {
        response.json({
          status: "Failed",
          message: `This tables doesn't exist: ${errorTables}Your tables are: ${tables}`,
        });
      }
    } else if (dbConfig === "mysql2") {
      // register a connection
      let dbConn = (await dbConnection(dbName, dbConfig)) as any;
      Database.manager.add(dbName, dbConn);
      let conn = Database.connection(dbName);

      /* 
        Check if given tables exist in our database or not
        if tables doesn't exist we give user an Error
      */
      let tables = await conn.getAllTables();
      let errorTables: String[] = [];
      let existTable;
      for (let i = 0; i < dbTable.length; i++) {
        existTable = tables.find((t) => t === dbTable[i].trim());
        if (!existTable) {
          errorTables.push(dbTable[i]);
        }
      }

      if (errorTables.length == 0) {
        if (dbTable) {
          /* field was empty query from all tables 
            otherwise return with given columns
          */
          if (command[0] === "select") {
            if (!command[1]) {
              if (!field) {
                query = await conn.from(dbTable[0]).select("*");
                response.json({
                  status: "Success",
                  data: query,
                });
              } else {
                query = await conn
                  .from(dbTable[0])
                  .select(field[0].trim(), field[1]);
                response.json({
                  status: "success",
                  data: query,
                });
              }
            } else if (tables.length > 1) {
              console.log(field);

              if (command[1] === "join") {
                if (!field) {
                  query = await conn
                    .from(dbTable[0])
                    .join(`${dbTable[1]}`, (query) => {
                      query.on((subQuery) => {
                        subQuery.on(
                          `${dbTable[0]}.${join_fields[0].trim()}`,
                          `${dbTable[1]}.${join_fields[1].trim()}`
                        );
                      });
                    })
                    .select("*");
                } else if (field.length > 1) {
                  query = await conn
                    .from(dbTable[0])
                    .join(`${dbTable[1]}`, (query) => {
                      query.on((subQuery) => {
                        subQuery.on(
                          `${dbTable[0]}.${join_fields[0].trim()}`,
                          `${dbTable[1]}.${join_fields[1].trim()}`
                        );
                      });
                    })
                    .select(field[0].trim(), field[1]?.trim());
                } else if (field.length == 1) {
                  query = await conn
                    .from(dbTable[0])
                    .join(
                      `${dbTable[1]}`,
                      `${dbTable[0]}.${join_fields[0].trim()}`,
                      `${dbTable[1]}.${join_fields[1].trim()}`
                    )
                    .select(field[0].trim());
                }

                // query = await conn
                // .from("user")
                // .join(dbTable, `user.id`, "=", `${dbTable}.id`)
                // .select("*");

                response.json({
                  status: "success",
                  data: query,
                });
              }
            } else {
              response.json({
                status: "Failed",
                message: "You can't join any database you have only one table",
              });
            }
          }
        } else {
          response.json({
            status: "Failed",
            message: "No table given",
          });
        }
      } else {
        response.json({
          status: "Failed",
          message: `This tables doesn't exist: ${errorTables}Your tables are: ${tables}`,
        });
      }
    }
  }

  async connectToCustomerDb({ request, response }: HttpContextContract) {
    const { client, host, port, user, password, database, dbname } =
      request.only([
        "client",
        "host",
        "port",
        "user",
        "password",
        "database",
        "dbname",
      ]);

    const dbType = request.input("dbType");

    if (client || host || port || user || password || database) {
      const dbConfig = (await connectTo(
        client,
        host,
        port,
        user,
        password,
        database
      )) as any;
      if (client === "mysql2") {
        if (dbType === "mysql2") {
          // Connect and Create database in our server
          Database.manager.add(database, configMySql);
          let dbConn = Database.connection(database);
          await dbConn.rawQuery(`create database ${dbname}`);
          // close create db connection
          await Database.manager.close(database, true);
          // end of connection

          // connect to user database and pull data
          Database.manager.add(client, dbConfig);
          let dbConnCustome = Database.connection(client);
          /* 
              Get signle column each time
              get data from  that column
              create connection to our database and create tables and transfer
              data in same time
            */
          let tables = await dbConnCustome.getAllTables();

          console.log("tables", tables);

          // export the database to raw sql file
          exec(
            `mysqldump -u${user} -p${password} -h${host}  ${database} > ${database}.sql`,
            (err, stdout, stderr) => {
              console.log(stdout);

              if (err) {
                console.log(`exect error ${err}`);
                return;
              }
            }
          );

          // wait for 3 sec if we don't the data do not import to our data base
          sleep.sleep(5);
          // connect to our configuration server
          let dbconn1 = await dbConnection(dbname, "mysql2");
          // Import the database.mysqldump.exe
          exec(
            `mysql -u${dbconn1.connection.user} -p${dbconn1.connection.password} -h${dbconn1.connection.host} ${dbname} < ${database}.sql`,
            (err, stdout, stderr) => {
              if (err) {
                console.error(`exec error: ${err}`);
                return;
              }

              console.log(`The import has finished.`);
            }
          );

          response.json({
            status: "Success",
            message: "Data transfered to our server",
          });
        } else if (dbType == "pg") {
          // Connect and Create database in our server
          // Database.manager.add(database, configPg);
          // let dbConn = Database.connection(database);
          // await dbConn.rawQuery(`create database ${dbname}`);

          // // close create db connection
          // await Database.manager.close(database, true);
          // // end of connection

          // // connect to user database and pull data
          // Database.manager.add(client, dbConfig);
          // Database.connection(client);

          // // export the database to raw sql file
          // exec(
          //   `mysqldump -u${user} -p${password} -h${host}  ${database} > ${database}.sql`,
          //   (err, stdout, stderr) => {
          //     console.log(stdout);

          //     if (err) {
          //       console.log(`exect error ${err}`);
          //       return;
          //     }
          //   }
          // );

          // connect to our configuration server
          let dbconn1 = await dbConnection(dbname, "pg");

          // wait for 3 sec if we don't the data do not import to our data base
          sleep.sleep(10);
          // Import the database.mysqldump.exe
          exec(
            `psql --username=${dbconn1.connection.user} --password --host=${dbconn1.connection.host} --port=${dbconn1.connection.port} --dbname=${dbname} < ${database}.sql  ${dbconn1.connection.password} \n`,
            (err, stdout, stdin) => {
              if (err) {
                console.error(`exec error: ${err}`);
                response.json({
                  status: "failed",
                  message: err,
                });
              }

              console.log(`The import has finished.`);
            }
          );

          response.json({
            status: "Success",
            message: "Data transfered to our server",
          });

          await Database.manager.close(client, true);
        }
      } else if (client === "pg") {
        if (dbType === "mysql2") {
          // Connect and Create database in our server
          Database.manager.add(database, configMySql);
          let dbConn = Database.connection(database);
          await dbConn.rawQuery(`create database ${dbname}`);
          // close create db connection
          await Database.manager.close(database, true);
          // end of connection

          // connect to user database and pull data
          Database.manager.add(client, dbConfig);
          Database.connection(client);
          /* 
             Get signle column each time
             get data from  that column
             create connection to our database and create tables and transfer
             data in same time
           */

          // export the database to raw sql file
          exec(
            `pg_dump --username=${user}  --password --host=${host} --port=${port} --dbname=${database} > ${database}.sql`,
            (err, stdout, stderr) => {
              if (err) {
                console.log(`exect error ${err}`);
                response.json({
                  status: "failed",
                  message: err,
                });
              }
            }
          );

          // wait for 3 sec if we don't the data do not import to our data base
          sleep.sleep(5);
          // connect to our configuration server
          let dbconn1 = await dbConnection(dbname, "mysql2");
          // Import the database.mysqldump.exe
          exec(
            `mysql -u${dbconn1.connection.user} -p${dbconn1.connection.password} -h${dbconn1.connection.host} ${dbname} < ${database}.sql`,
            (err, stdout, stderr) => {
              if (err) {
                console.error(`exec error: ${err}`);
                return;
              }

              console.log(`The import has finished.`);
            }
          );

          response.json({
            status: "Success",
            message: "Data transfered to our server",
          });
        } else if (dbType == "pg") {
          // Connect and Create database in our server
          Database.manager.add(database, configPg);
          let dbConn = Database.connection(database);
          await dbConn.rawQuery(`create database ${dbname}`);

          // close create db connection
          await Database.manager.close(database, true);
          // end of connection

          // connect to user database and pull data
          Database.manager.add(client, dbConfig);
          Database.connection(client);
          /* 
             Get signle column each time
             get data from  that column
             create connection to our database and create tables and transfer
             data in same time
           */

          // export the database to raw sql file
          exec(
            `pg_dump --username=${user}  --password --host=${host} --port=${port} --dbname=${database} > ${database}.sql`,
            (err, stdout, stderr) => {
              if (err) {
                console.log(`exect error ${err}`);
                response.json({
                  status: "failed",
                  message: err,
                });
              }
            }
          );

          // connect to our configuration server
          let dbconn1 = await dbConnection(dbname, "pg");

          // wait for 3 sec if we don't the data do not import to our data base
          sleep.sleep(10);
          // Import the database.mysqldump.exe
          exec(
            `psql --username=${dbconn1.connection.user} --password --host=${dbconn1.connection.host} --port=${dbconn1.connection.port} --dbname=${dbname} < ${database}.sql  ${dbconn1.connection.password} \n`,
            (err, stdout, stdin) => {
              if (err) {
                console.error(`exec error: ${err}`);
                response.json({
                  status: "failed",
                  message: err,
                });
              }

              console.log(`The import has finished.`);
            }
          );

          response.json({
            status: "Success",
            message: "Data transfered to our server",
          });
        }
      }
    } else {
      response.json({
        status: "Failed",
        message: "You given credintial is missing some values",
      });
    }
  }
}
