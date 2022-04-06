class UserRepository {
    constructor(dao) {
        this.dao = dao
    }

    //creates users table
    createTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS users (id INTEGER 
            PRIMARY KEY AUTOINCREMENT, 
            username TEXT, password TEXT)`
        return this.dao.run(sql)
    }

    //creates one user
    createUser(username, password) {
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

    //delete users table
    dropUsersTable() {
        return this.dao.run(`DROP TABLE users`)
    }

    //returns 1 if user table exists, 0 otherwise
    tableExists(table_name) {
        return this.dao.get(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`, [table_name])
    }

    //changes user's password
    updateUserPassword(username, new_password) {
        return this.dao.run(`UPDATE users SET password = ? 
            WHERE username=?`, [new_password, username])
    }

    //deletes one user by id
    deleteUserById(id) {
        return this.dao.run(`DELETE FROM users
            WHERE id=?`, [id])
    }

    //deletes one user by username
    deleteUserByName(username) {
        return this.dao.run(`DELETE FROM users WHERE username=?`, [username])
    }

    //-----Call both functions to delete all users and also reset sequencing for next set of users-----//
    //deletes all users
    deleteAllUsers() {
        return this.dao.run(`DELETE FROM users`)
    }

    //resets sqlite_sequence so that autoincrement starts with 0
    resetSequencing() {
        return this.dao.run(`UPDATE sqlite_sequence SET seq=0 WHERE name='users'`)
    }
    //-------------------------------------------------------------------------------------------------//

    //retrieves one user by id
    getById(id) {
        return this.dao.get(`SELECT * FROM users WHERE
            id = ?`, [id])
    }

    //returns 1 if user exists, 0 if not
    usernameExists(username) {
        return this.dao.get(`SELECT COUNT(*) FROM users WHERE username=?`, [username])
    }

    //retrieves one user by username
    getByUsername(username) {
        return this.dao.get(`SELECT * FROM users WHERE
            username=?`, [username])
    }

    //retrieves all users
    getAll() {
        return this.dao.all(`SELECT * FROM users`)
    }

}

module.exports = UserRepository