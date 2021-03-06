/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from "@ioc:Adonis/Core/Route";

Route.get("/", async () => {
  return { hello: "world" };
});

Route.post("import/", "ImportsController.import");
Route.post("parse/", "ImportsController.parseSql");
Route.get("data/", "ImportsController.data");
Route.get("conn/", "ImportsController.connectToDatabase");
Route.get("create/", "ImportsController.createDb");
Route.get("create1/", "ImportsController.createDbLucid");
Route.get("connect-pg/", "ImportsController.connectToPg");
Route.post("create-database/", "ImportsController.createDatabaseUser");
Route.post("get-table/", "ImportsController.getTablesInfo");
Route.post("connect-to/", "ImportsController.connectToCustomerDb");
Route.post("scheduler/", "ImportsController.TestScheduler");
