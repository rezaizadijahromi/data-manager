import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Kepseks extends BaseSchema {
  protected tableName = 'kepseks'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.string('ip')
      table.string('id_sekolah')
      table.timestamps(true)
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
