const path = require('path');
const express = require("express");
const Promise = require('bluebird');
const AppDAO = require('./dao');
const crypto = require("crypto")
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
const dao = new AppDAO('./server/users.sqlite3')
const blogUserData = { username: 'ylee', password: 'dogwater' }
const userRepo = new UserRepository(dao)
//----------------------------//

//array of usernames currently in the game
const playing_users = [];
//array of playing cards used by each user (2 cards in subarray per user by index)
const playing_cards = [];
//array of playing chips used by each user
const playing_chips = [];


//----direct database calls, use async function to call these----//
//checks if the users table exists
function checkUsersTableExists() {
    return userRepo.tableExists('users')
}

//checks if a user with username exists
function checkUserExists(username) {
    return userRepo.usernameExists(username)
}

//calls the createUser sql query function, but also returns a hash for the login token
function addNewUser(username, password) {
    const login_token = crypto.createHash('sha256').update(username).digest('hex')
    const game_token = crypto.createHash('sha256').update(login_token).digest('hex')
    return userRepo.createUser(username, password, login_token, game_token)
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
                return addNewUser(username, password)
            }))
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

//deleteUsersTable()
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
                res.status(201).json({message: `User "${user.username}" has logged in.`, auth: 1, token: retrievedUser.login_token})
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

    userRepo.getByUsername(user.username)
        .then((retrievedUser) => {
            res.status(200).json({message: `User with username "${retrievedUser.username}" already exists.`, auth: 0})
            resolve('success')
        })
        .catch((err) => {
            res.status(201).json({message: `User "${user.username}" has been created.`, auth: 1})
            addNewUser(user.username, user.password)
        })
});

app.post("/show_chips_bank", cors(), (req, res) => {
    const login_token = {token: req.body.token}

    userRepo.getByLoginToken(login_token.token)
        .then((retrievedUser) => {
            res.status(201).json({message: `Chips retrieved.`, amount: retrievedUser.chips_bank, auth: 1})
            resolve('success')
        })
        .catch((err) => {
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/show_chips_useable", cors(), (req, res) => {
    const login_token = {token: req.body.token}

    userRepo.getByLoginToken(login_token.token)
        .then((retrievedUser) => {
            res.status(201).json({message: `Chips retrieved.`, amount: retrievedUser.chips_useable, auth: 1})
            resolve('success')
        })
        .catch((err) => {
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/withdraw", cors(), (req, res) => {
    const user_request = {token: req.body.token, amount: req.body.amount}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (user_request.amount <= retrievedUser.chips_bank) {
                const new_bank = retrievedUser.chips_bank - user_request.amount
                const new_useable = retrievedUser.chips_useable + user_request.amount
                userRepo.updateChipsBank(new_bank, retrievedUser.username)
                    .then(() => {
                        userRepo.updateChipsUseable(new_useable, retrievedUser.username)
                        res.status(201).json({message: `Chips withdrawn.`, amount: new_bank, auth: 1})
                        resolve('success')
                    })
                    .catch((err) => {
                        res.status(200).json({message: `Error: Chips bank could not be updated.`, auth: 1})
                    })
            }
            else {
                res.status(200).json({message: `Error: Insufficient chips for request.`, auth: 0})
            }
        })
        .catch((err) => {
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/deposit", cors(), (req, res) => {
    const user_request = {token: req.body.token, amount: req.body.amount}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (user_request.amount <= retrievedUser.chips_useable) {
                const new_bank = retrievedUser.chips_bank + user_request.amount
                const new_useable = retrievedUser.chips_useable - user_request.amount
                userRepo.updateChipsBank(new_bank, retrievedUser.username)
                    .then(() => {
                        userRepo.updateChipsUseable(new_useable, retrievedUser.username)
                        res.status(201).json({message: `Chips deposited.`, amount: new_useable, auth: 1})
                        resolve('success')
                    })
                    .catch((err) => {
                        res.status(200).json({message: `Error: Chips bank could not be updated.`, auth: 1})
                    })
            }
            else {
                res.status(200).json({message: `Error: Insufficient chips for request.`, auth: 0})
            }
        })
        .catch((err) => {
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/join_game", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (playing_users.length === 10) {
                res.status(200).json({message: `Error: Game is currently full.`, auth: 0})
            }
            else if (retrievedUser.chips_useable === 0) {
                res.status(200).json({message: `Error: User does not have enough chips on hand.`, auth: 2})
            }
            else {
                playing_users.push(retrievedUser.username)
                playing_cards.push(['H1', 'C9'])
                playing_chips.push(retrievedUser.chips_useable)
                res.status(201).json({message: `User has entered the game.`, token: retrievedUser.game_token, auth: 1})
            }
        })
        .catch((err) => {
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/exit_game", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByGameToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                playing_users.splice(player_index, 1)
                playing_chips.splice(player_index, 1)
                playing_cards.splice(player_index, 1)
                res.status(201).json({message: "user has left the game.", auth: 1})
            }
            else {
                res.status(200).json({message: "Fatal error: User is not currently in the game to leave.", auth: 0})
            }
        })
        .catch((err) => {
            res.status(200).json({message: "Error: Game token is invalid.", auth: 0})
        })
})

app.post("/players", cors(), (req, res) => {
    //game-token
    const user_request = {token: req.body.token}
    let shown_playing_cards = []
    for (let i = 0; i < playing_users.length; i++) {
        shown_playing_cards.push(['Back', 'Back'])
    }

    userRepo.getByGameToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                shown_playing_cards[player_index] = Array.from(playing_cards[player_index])
                res.status(201).json({players: [...playing_users], chips: [...playing_chips], cards: [...shown_playing_cards], auth: 1})
            }
            else {
                res.status(200).json({message: `Fatal Error: Player with game token not found in game.`, auth: 0})
            }
        })
        .catch((err) => {
            res.status(201).json({players: [...playing_users], chips: [...playing_chips], cards: [...shown_playing_cards], auth: 1})
        })
})

app.get("/users", (req, res) => {
    res.json({message: "Hey there!"})
    getAllUsers();
});

app.get("/board_state", (req, res) => {
    res.json({first: "C1", second: "H1", third: "S8", fourth: "CB", fifth: "D2"});
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

app.use(express.static(path.resolve(__dirname, '../client/public')));
app.use(express.static('public'));