
exports.up = function(knex, Promise) {
    return knex.schema.createTable('Users', function(table) {
        table.increments('id').primary();
        table.string('FirstName', 100).notNullable();
        table.string('LastName', 100).notNullable();
        table.string('RoomNumber', 100).notNullable();
        table.string('CellPhone', 100);
        table.string('EmergencyContactName', 100).notNullable();
        table.string('EmergencyContactNumber', 100).notNullable();
    });
};

exports.down = function(knex, Promise) {
  
};
