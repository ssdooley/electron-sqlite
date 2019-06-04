module.exports = {
    development: {
        client: "sqlite3",
        connection: {
            filename: "../devcandidates.sqlite"
        },
        migrations: {
            directory: __dirname + '/db/migrations',
        },
        seeds: {
            directory: __dirname + 'db/seeds/dev'
        }

    },
    production: {
        client: 'sqlite3',
        connection: {
            filename: "../candidates.sqlite"
        },
        migrations: {
            directory: __dirname + 'db/migrations'
        },
        seeds: {
            directory: __dirname + 'db/seeds/prod'
        }
    }
}