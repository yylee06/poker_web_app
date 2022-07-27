class AchievementRepository {
    constructor(dao) {
        this.dao = dao
    }

    //creates achievements table
    createTable() {
        const sql = `
        CREATE TABLE IF NOT EXISTS achievements (id INTEGER 
            PRIMARY KEY AUTOINCREMENT, 
            username TEXT NOT NULL, 
            wealthy BIT DEFAULT 0 NOT NULL,
            talented BIT DEFAULT 0 NOT NULL,
            stacked_deck BIT DEFAULT 0 NOT NULL)`
        return this.dao.run(sql)
    }

    //adds data for one user into database
    addUser(username) {
        return this.dao.run(`INSERT INTO achievements (username) VALUES (?)`, [username])
    }

    turnForeignKeysOff() {
        return this.dao.run(`PRAGMA foreign_keys = OFF`)
    }

    turnForeignKeysOn() {
        return this.dao.run(`PRAGMA foreign_keys = ON`)
    }

    //delete users table
    dropAchievementsTable() {
        return this.dao.run(`DROP TABLE achievements`)
    }

    //returns 1 if user table exists, 0 otherwise
    tableExists(table_name) {
        return this.dao.get(`SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?`, [table_name])
    }

    //deletes one user by id
    deleteUserById(id) {
        return this.dao.run(`DELETE FROM achievements
            WHERE id=?`, [id])
    }

    //deletes one user by username
    deleteUserByName(username) {
        return this.dao.run(`DELETE FROM achievements WHERE username=?`, [username])
    }

    //-----Call both functions to delete all users and also reset sequencing for next set of users-----//
    //deletes all users
    deleteAllUsers() {
        return this.dao.run(`DELETE FROM achievements`)
    }

    //resets sqlite_sequence so that autoincrement starts with 0
    resetSequencing() {
        return this.dao.run(`UPDATE sqlite_sequence SET seq=0 WHERE name='achievements'`)
    }
    //-------------------------------------------------------------------------------------------------//

    //retrieves one user by id
    getById(id) {
        return this.dao.get(`SELECT * FROM achievements WHERE id = ?`, [id])
    }

    //returns 1 if user exists, 0 if not
    usernameExists(username) {
        return this.dao.get(`SELECT COUNT(*) FROM achievements WHERE username=?`, [username])
    }

    //retrieves one user by username
    getByUsername(username) {
        return this.dao.get(`SELECT * FROM achievements WHERE username=?`, [username])
    }

    //retrieves all users
    getAll() {
        return this.dao.all(`SELECT * FROM achievements`)
    }

    updateAchievementWealthy(is_added, username) {
        return this.dao.run(`UPDATE achievements SET wealthy=? WHERE username=?`, [is_added, username])
    }

    updateAchievementTalented(is_added, username) {
        return this.dao.run(`UPDATE achievements SET talented=? WHERE username=?`, [is_added, username])
    }

    updateAchievementStackedDeck(is_added, username) {
        return this.dao.run(`UPDATE achievements SET stacked_deck=? WHERE username=?`, [is_added, username])
    }
}

module.exports = AchievementRepository