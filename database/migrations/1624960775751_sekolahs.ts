import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Sekolahs extends BaseSchema {
  protected tableName = 'sekolahs'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 80).notNullable()
      table.string('code', 254).notNullable().unique()
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
