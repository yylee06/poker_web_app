const path = require('path');
const express = require("express");
const Promise = require('bluebird');
const AppDAO = require('./dao');
const cors = require('cors');
const UserRepository = require('./user_repository');
const { resolve } = require('path');
const PORT = 3080;
const bodyParser = require('body-parser');
const app = express();

//sets up cors to accept requests from http://localhost:3000 only
var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
}

//body-parser middleware to read POST requests
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());


//----connects to database----//
const dao = new AppDAO('./users.sqlite3')
const blogUserData = { username: 'ylee', password: 'dogwater' }
const userRepo = new UserRepository(dao)
//----------------------------//

//----direct database calls, use async function to call these----//
//checks if the users table exists
function checkUsersTableExists() {
    return userRepo.tableExists('users')
}

//checks if a user with username exists
function checkUserExists(username) {
    return userRepo.usernameExists(username)
}

//adds new user to database
function addNewUser(username, password) {
    userRepo.createUser(username, password);
}

//returns user with given username
function getUserByUsername(username) {
    return userRepo.getByUsername(username)
}

//deletes the users table (ONLY FOR TESTING)
function deleteUsersTable() {
    userRepo.dropUsersTable()
}

//deletes all users from the database (ONLY FOR TESTING)
function deleteAllUsers() {
    userRepo.deleteAllUsers()
    userRepo.resetSequencing()
}

//gets all users
function getAllUsers() {
    userRepo.getAll()
        .then((users) => {
            return new Promise((resolve, reject) => {
                users.forEach((user) => {
                    console.log(`user ${user.id}: ${user.username}`)
                })
            })
            resolve('success')
        })
        .catch((err) => {
            console.log('Error: ')
            console.log(JSON.stringify(err))
        })
}
//---------------------------------------------------------------//

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
                return userRepo.createUser(username, password)
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
async function checkTable() {
    const tableStatus = await checkUsersTableExists()
    if (tableStatus['COUNT(*)'] == 0) {
        initTable()
        console.log('Users table does not exist, creating new table.')
    }
}
//------------------------------------------------------------------//

//----checks if user exists----//
async function checkIfUserExists(username) {
    const userStatus = await checkUserExists(username)
    if (userStatus['COUNT(*)'] > 0) {
        return true
    }
    else{
        return false
    }
}//----------------------------//

//deleteAllUsers()
checkTable()

app.get("/", )

app.get("/api", (req, res) => {
    res.json({message: "Hello from server!"});
});

app.post("/login", cors(), (req, res) => {
    const user = {username: req.body.username, password: req.body.password}
    userRepo.getByUsername(user.username)
        .then((retrievedUser) => {
            if (retrievedUser.password === user.password) {
                res.status(201).json({message: `User "${user.username}" has logged in.`, auth: 1, token: "test123"})
            }
            else {
                res.status(200).json({message: `Password is incorrect.`, auth: 0})
            }
            resolve('success')
        })
        .catch((err) => {
            res.status(200).json({message: `User "${user.username}" is not in the database.`, auth: 0})
        })
});

app.post("/register", cors(), (req, res) => {
    const user = {username: req.body.username, password: req.body.password}
    addNewUser(user.username, user.password)
    res.status(201).json({message: `User "${user.username}" has been created.`})
});

app.get("/users", (req, res) => {
    res.json({message: "Hey there!"})
    getAllUsers();
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

app.use(express.static(path.resolve(__dirname, '../client/public')));
app.use(express.static('public'));