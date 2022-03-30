const path = require('path')
const express = require("express");
const Promise = require('bluebird')
const AppDAO = require('./dao')
const UserRepository = require('./user_repository');
const { resolve } = require('path');
const PORT = 3080;
const app = express();

//----connects to database----//
const dao = new AppDAO('./users.sqlite3')
const blogUserData = { username: 'ylee', password: 'dogwater' }
const userRepo = new UserRepository(dao)
//----------------------------//


//----function to initialize new users table----//
function initTable() {
    userRepo.createTable()
        .then(() => {
            const users = [
                {
                    username: 'ylee',
                    password: 'dogwater',
                },
                {
                    username: 'Basil',
                    password: 'catnip',
                }
            ]
            return Promise.all(users.map((user) => {
                const { username, password } = user
                return userRepo.create(username, password)
            }))
        })
        .then(() => userRepo.getById(2))
        .then((user) => {
            console.log(`\nRetrieved user from database`)
            console.log(`user ID = ${user.id}`)
            console.log(`username = ${user.username}`)
            return userRepo.getById(user.id)
        })
        .then((user) => {
            console.log(`\nRetrieved user from user haha`)
            console.log(`user password = ${user.password}`)
            resolve('success')
        })
        .catch((err) => {
            console.log('Error: ')
            console.log(JSON.stringify(err))
        })
}
//----------------------------------------------//

//----checks if users table exists, else creates new users table----//
function checkUsersExists() {
    return userRepo.tableExists('users')
}
async function checkTable() {
    tableStatus = await checkUsersExists()
    if (tableStatus['COUNT(*)'] == 0) {
        initTable()
        console.log('Users table does not exist, creating new table.')
    }
}
//------------------------------------------------------------------//

function deleteUsersTable() {
    userRepo.dropUsersTable()
}


//deleteUsersTable()
checkTable()

app.use(express.static(path.resolve(__dirname, '../client/public')));
app.use(express.static('public'));

app.get("/", )

app.get("/api", (req, res) => {
    res.json({message: "Hello from server!"});
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});