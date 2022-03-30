class UserRepository {
    constructor(dao) {
        this.dao = dao
    }

    createTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS users (id INTEGER 
            PRIMARY KEY AUTOINCREMENT, 
            username TEXT, password TEXT)`
        return this.dao.run(sql)
    }

    create(username, password) {
        return this.dao.run(`INSERT INTO users (username,
            password) VALUES (?, ?)`, [username,
            password])
    }

    turnForeignKeysOff() {
        return this.dao.run(`PRAGMA foreign_keys = OFF`)
    }

    turnForeignKeysOn() {
        return this.dao.run(`PRAGMA foreign_keys = ON`)
    }

    dropUsersTable() {
        return this.dao.run(`DROP TABLE users`)
    }

    tableExists(table_name) {
        return this.dao.get(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`, [table_name])
    }

    update(username, new_password) {
        return this.dao.run(`UPDATE users SET password = ? 
            WHERE username=?`, [password, username])
    }

    delete(id) {
        return this.dao.run(`DELETE FROM users
            WHERE id=?`, [id])
    }

    getById(id) {
        return this.dao.get(`SELECT * FROM users WHERE
            id = ?`, [id])
    }

    getByUsername(username) {
        return this.dao.get(`SELECT * FROM users WHERE
            username=?`, [username])
    }

    getAll() {
        return this.dao.all(`SELECT * FROM users`)
    }

}

module.exports = UserRepository