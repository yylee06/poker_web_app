const path = require('path');
const Promise = require('bluebird');
const AppDAO = require('./dao');
const crypto = require("crypto")
const cors = require('cors');
const UserRepository = require('./user_repository');
const AchievementRepository = require('./achievement_repository');
const { resolve } = require('path');
const bodyParser = require('body-parser');
const Deck = require('./deck');
var http = require('http')
var https = require('https')
var fs = require('fs')

//allotted_time for timer, can be changed at will; set to +1 of the client-side timer for latency
const ALLOTTED_TIME = 26
const SMALL_BLIND = 10
const BIG_BLIND = 20

//sets up cors to accept requests from http://yunyeollee.com only
var corsOptions = {
    origin: 'https://yunyeollee.com',
    optionsSuccessStatus: 200
}

const express = require("express");
const PORT = 3080;
const app = express();

//body-parser middleware to read POST requests
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.text());

class Clients {
    constructor() {
        this.clientList = {};
        this.saveClient = this.saveClient.bind(this)
    }

    saveClient(loginToken, client) {
        this.clientList[loginToken] = client
    }
}

//certificate used for HTTPS communication (can be self-signed for testing)
var options = {
    key: 'INSERT PRIVATE KEY HERE',
    cert: 'INSERT SSL CERTIFICATE HERE',
    ca: 'INSERT CERTIFICATE CHAIN HERE'
}

const server_http = http.createServer(app);
const server_https = https.createServer(options, app);
const WebSocket = require('ws')
const WebSocketServer = WebSocket.Server
const clients = new Clients()
const wss = new WebSocketServer({ server_https });


wss.on('connection', function connection(client) {
    client.isAlive = true;  
    console.log("New Client has joined.")
    client.send(JSON.stringify({event:'Welcome new client!'}))

    client.on('message', (event) => {
        const received_message = JSON.parse(event)

        if (received_message.event === "ws_auth") {
            userRepo.getByLoginToken(received_message.token)
            .then((retrievedUser) => {
                clients.saveClient(retrievedUser.username, client)
                client.send(JSON.stringify({event:'Got your message!'}))
            })
            .catch((err) => {
                console.log(err)
            })
        }
        else if (received_message.event === "pong") {
            client.isAlive = true;
        }
    })
});

//----connects to database----//
const user_dao = new AppDAO('./server/users.sqlite3')
const userRepo = new UserRepository(user_dao)
const achievement_dao = new AppDAO('./server/achievements.sqlite3')
const achievementRepo = new AchievementRepository(achievement_dao)
//----------------------------//

//class used to pre-load all registered users and their achievements directly from db
class AchievementsMap {
    constructor() {
        this.usernames = {};
        this.saveUsername = this.saveUsername.bind(this)
    }

    saveUsername(username, achievements) {
        this.usernames[username] = achievements
    }
}

//array of usernames currently in the game
let playing_users = [];
//array of chips used by each player currently on the table
let table_chips = [];
//array of playing chips used by each user (should fit to size of current_players each round)
let playing_chips = [];
//copy of cards held by players to be changed to formatted_cards
let shown_cards = [];
//template of cards shown to clients (card values hidden except those held by given user)
let formatted_cards = [];
//array of users ready to start/end the game
let ready_users = [];
//object of class Deck, used for playing the game
const deck = new Deck();
//array of users currently in the round, users that fold are removed from this array; used for creating actions array
//array of objects (username, hand, hand_strength, hand_type)
let current_players = [];
//array of actions used for queue system to tell client what action to perform
let actions = [];
//base deck, each time a round is finished, this deck is used as the prototype for each rendition of the deck
const unshuffled_deck = deck.buildDeck();
//final board (always 0 or 5 cards)
let board = [];
//current board (max 5 cards)
let current_board = [];
//index of player with current turn (based on index of playing_users)
let current_turn = -1;
//number of chips currently on the table (not including open bets, value only changes when a user folds or a round is over)
let house_chips = 0;
//current highest bet on the table, default to big blind of 20
let highest_bet = 0;
//shuffled deck
let shuffled_deck = deck.shuffleDeck(unshuffled_deck)
//sorted array of best hands from best to worst
let sorted_winners = [];
//array of each player's hand power, indexed in the same way as current_players
let displayed_hand_strengths = [];
//array of players in game by index, 1 for in game, 0 for folded
let players_ingame = [];
//array of players that are currently all-in by index, 1 for in game, 0 for folded
let all_in_users = [];
//array of players that have called all-in (holds objects {bet_size, player_index})
let all_ins = [];
//array of side pots (holds objects {pot_size, participants})
let side_pots = [];
//index of the player holding the button, incremented by 1 each game, modulus playing_users
let button_index = -1;
//boolean value true when game is running, false otherwise
let game_running = false;
//array of users in queue to leave the game (flushed at the start of every new game)
let leaving_users = [];
//pre-loaded map of all users and their achievements (from db)
let achievements_map = new AchievementsMap()
//array of objects with keys username and achievements, used for indexing of curated_achievements_array
let achievements_array = [];
//curated array of achievements to be sent in json form to client to display achievements
let curated_achievements_array = [];
//working timer object, holds turn timer and current player (in case player exits browser)
//timer set to -1 initially to not trigger default action, used for server-side turn detection
let working_timer = {timer: -1, current_actor: ''}

//pings each websocket connection every 30 sec, updates Clients class respectively, used for garbage cleanup
setInterval(() => {
    for (let key in clients.clientList) {
        if (clients.clientList[key].isAlive === false) {
            let player_index = playing_users.indexOf(key)
            if (player_index > -1) {
                if (game_running) {
                    leaving_users.push(player_index)
                }
                else {
                    playing_users.splice(player_index, 1)
                    playing_chips.splice(player_index, 1)
                    removeFromReadyPlayers(key)
                    removeFromAchievementsArray(key)

                    wss.clients.forEach(function each(client) {
                        client.send(JSON.stringify({event: "player"}))
                    })    
                }
            }

            delete clients.clientList[key]
        }
        else {
            clients.clientList[key].isAlive = false;
            clients.clientList[key].send(JSON.stringify({event: "ping"}))
        }
    }
}, 30000);

//timer always running, reset to 30 decrementing every turn
setInterval(() => {
    working_timer.timer -= 1
    //console.log(working_timer.timer)

    if (working_timer.timer === 0 && game_running) {
        //do default action, because time ran out
        defaultAction(working_timer.current_actor)
    }
        
}, 1000);

function preloadAchievementsMap() {
    achievementRepo.getAll()
        .then((retrievedUsers) => {
            retrievedUsers.forEach((retrievedUser) => {
                achievements_map.saveUsername(retrievedUser.username, [retrievedUser.wealthy, retrievedUser.talented, retrievedUser.stacked_deck])
            })
        })
}

//function to be called when user leaves game, user is removed from achievements array
function removeFromAchievementsArray(username) {
    for (let i = 0; i < achievements_array.length; i++) {
        if (achievements_array[i].username === username) {
            achievements_array.splice(i, 1)
            curated_achievements_array.splice(i, 1)
        }
    }
}

//function to be called when user joins game, user is added to the achievements array
function addToAchievementsArray(username) {
    achievements_array.push({username: username, achievements: achievements_map.usernames[username]})
    curated_achievements_array.push(achievements_map.usernames[username])

}

//is_added is a boolean variable, true if achievement is given, false if achievement is taken away
function updateAchievement(achievement, username, is_added) {
    switch(achievement) {
        case "wealthy":
            achievementRepo.updateAchievementWealthy(is_added, username)
            achievements_map.usernames[username][0] = is_added
            break;
        case "talented":
            achievementRepo.updateAchievementTalented(is_added, username)
            achievements_map.usernames[username][1] = is_added
            break;
        case "stacked_deck":
            achievementRepo.updateAchievementStackedDeck(is_added, username)
            achievements_map.usernames[username][2] = is_added
            break;
        default:
    }

    let player_index = playing_users.indexOf(username)
    if (player_index > -1) {
        achievements_array[player_index] = {username: username, achievements: achievements_map.usernames[username]}
        curated_achievements_array[player_index] = achievements_map.usernames[username]

        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify({event: "achievement"}))
        })   
    }
}

//sets highest_bet to parameterized value
function setHighestBet(default_value) {
    highest_bet = default_value
}

//removes entries of displayed_hand_strengths if user has folded, called only before showdown event
function purgeDisplayedHandStrengths() {
    for (let i = 0; i < players_ingame.length; i++) {
        if (players_ingame[i] !== 1) {
            displayed_hand_strengths[i] = ''
        }
    }
}

//function called during showdown to see if any user achieves a strong hand (i.e. flush+ to get an achievement)
function checkIfGoodHand(hand_strengths) {
    for (let i = 0; i < playing_users.length; i++) {
        if (hand_strengths[i] === "Straight Flush" || hand_strengths[i] === "Four of a Kind" || hand_strengths[i] === "Full House" || hand_strengths[i] === "Flush") {
            updateAchievement('stacked_deck', playing_users[i], 1)
        }
    }
}

function removeFromReadyPlayers(username_to_remove) {
    let player_index = ready_users.indexOf(username_to_remove)
    if (player_index > -1) {
        ready_users.splice(player_index, 1)
    }

    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({event: "start/stop"}))
    })    
}

function reorganizePlayers() {
    //removes all players with less than 20 chips
    function removeInvalidPlayers() {
        let invalid_players_indices = []
        playing_chips.forEach((element, index) => {
            if (element < BIG_BLIND) {
                invalid_players_indices.push(index)
            }
        });

        //reverse to remove all players in 1 pass of playing_users and playing_chips
        invalid_players_indices.reverse()

        for (let invalid_player_index of invalid_players_indices) {
            removeFromAchievementsArray(playing_users[invalid_player_index])
            removeFromReadyPlayers(playing_users[invalid_player_index])
            playing_users.splice(invalid_player_index, 1)
            playing_chips.splice(invalid_player_index, 1)
        }
    }

    //removes all players that wish to leave
    function removeLeavingPlayers() {
        if (leaving_users.length > 0) {
            //sort for 1-pass popping from playing_users and playing_chips
            leaving_users.sort()

            while (leaving_users.length > 0) {
                let leaving_user_index = leaving_users.pop()
                removeFromReadyPlayers(playing_users[leaving_user_index])
                removeFromAchievementsArray(playing_users[leaving_user_index])
                playing_users.splice(leaving_user_index, 1)
                playing_chips.splice(leaving_user_index, 1)
            }
        }
    }

    //flush out leaving players first because leaving_users are globally indexed
    removeLeavingPlayers()
    removeInvalidPlayers()
}

//to be called when player rejoins an ongoing game (i.e. player should be removed from leaving_players)
function playerReturns(player_index) {
    let returning_user_index = leaving_users.indexOf(player_index)

    if (returning_user_index > -1) {
        leaving_users.splice(returning_user_index, 1)
    }
}

//function to send to client what cards are shown, if game comes to showdown, all cards are shown
function showFormattedCards(isShowdown) {
    formatted_cards.length = 0

    for (let i = 0; i < playing_users.length; i++) {
        if (players_ingame[i] === 1 && isShowdown) {
            formatted_cards.push(Array.from(shown_cards[i]))
        }
        else if (players_ingame[i] === 1) {
            formatted_cards.push(['Back', 'Back'])
        }
        else {
            formatted_cards.push(['EmptyPlayer', 'EmptyPlayer'])
        }
    }
}

//function to replace formatted cards at given index to show that user has folded to other clients
function foldFormattedCards(player_index) {
    formatted_cards[player_index] = (['EmptyPlayer', 'EmptyPlayer'])
}


//function called at end of round if any user calls all-in in given round
function calculateSidePots() {
    function sortByBetSize(a, b) {
        if (a.bet_size < b.bet_size) {
            return -1
        }
        if (a.bet_size > b.bet_size) {
            return 1
        }
        return 0
    }

    //sort and reverse to be used as a stack
    if (all_ins.length > 1) {
        all_ins.sort(sortByBetSize)
        all_ins.reverse()
    }

    //smallest all-in, also used to calculate side pot offsets
    let main_pot_bet = all_ins.pop().bet_size

    //calculate main pot, then side pots

    table_chips.forEach((element, index) => {
        if (element >= main_pot_bet) {
            if (side_pots.length > 0) {
                side_pots[side_pots.length - 1].pot_size += main_pot_bet
            }
            else {
                house_chips += main_pot_bet
            }
            table_chips[index] -= main_pot_bet
        }
        else if (element > 0) {
            if (side_pots.length > 0) {
                side_pots[side_pots.length - 1].pot_size += element
            }
            else {
                house_chips += element
            }
            table_chips[index] = 0
        }
    })

    //calculate all side pots
    while(all_ins.length > 0) {
        let side_pot_total = 0
        let side_pot_participants = []
        let side_pot_bet = all_ins.pop()
        let side_pot_offset = side_pot_bet.bet_size - main_pot_bet

        //calculate size of side pot
        table_chips.forEach((element, index) => {
            if (element >= side_pot_offset) {
                side_pot_total += side_pot_offset
                table_chips[index] -= side_pot_offset
                side_pot_participants.push(playing_users[index])
            }
            else if (element > 0) {
                side_pot_total += element
                table_chips[index] = 0
            }
        })

        side_pots.push({pot_size: side_pot_total, participants: side_pot_participants})

        //updates to calculate offset for next side pot (if any)
        main_pot_bet = side_pot_bet.bet_size
    }

    //final side pot is made (for any more subsequent bets, set default to 0)
    let side_pot_total = 0
    let side_pot_participants = []

    table_chips.forEach((element, index) => {
        if (element > 0) {
            side_pot_total += element
            table_chips[index] = 0
            side_pot_participants.push(playing_users[index])
        }
        else if (players_ingame[index] && !all_in_users[index]) {
            side_pot_participants.push(playing_users[index])
        }
    })

    side_pots.push({pot_size: side_pot_total, participants: side_pot_participants})
}

//called at end of each game to calculate and distribute main and side pots
function calculateWinnings() {
    function distributeWinnings(winner, earnings) {
        //index of winner in playing_users array
        let winner_index = playing_users.indexOf(winner)

        userRepo.getByUsername(winner)
            .then(() => {
                let new_useable = playing_chips[winner_index] + earnings
                playing_chips[winner_index] = new_useable
                userRepo.updateChipsUseable(new_useable, winner)
            })
            .catch((err) => {
                console.log("Error: User is not here to receive prize.")
            })
    }

    //calculate main pot winner
    const winner = sorted_winners[0]

    //if there is a tie
    if (Array.isArray(winner)) {
        house_chips = Math.floor(house_chips/winner.length)
        for (let curr_winner of winner) {
            distributeWinnings(curr_winner, house_chips)
        }
    }
    //if there is a single winner
    else {
        distributeWinnings(winner, house_chips)      
    }

    //sends winner(s) to client for glow visual effect
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({event: "winner", winner: winner}))
    })
    
    //increments number of wins for user
    userRepo.incrementWins(winner)
        .then(() => userRepo.getByUsername(winner))
        .then((retrievedUser) => {
            //checks if user needs achievement for 3+ wins
            if (retrievedUser.wins === 3) {
                updateAchievement('talented', winner, 1)
            }
        })

    //reverse side_pots to pop pots with largest number of participants first
    side_pots.reverse()

    //calculate side pots
    while (side_pots.length > 0) {
        //index used to iterate through sorted_winners array to find valid winner for side pot
        let side_pot = side_pots.pop()
        let side_pot_winners = []
        let winner_index = 0

        if (side_pot.pot_size === 0) {
            continue;
        }

        while (side_pot_winners.length === 0) {
            //testing for side pot tie
            if (Array.isArray(sorted_winners[winner_index])) {
                for (let possible_winner of sorted_winners[winner_index]) {
                    if (side_pot.participants.indexOf(possible_winner) > -1) {
                        side_pot_winners.push(possible_winner)
                    }
                }
            }
            //iterating through winners normally 
            else {
                if (side_pot.participants.indexOf(sorted_winners[winner_index]) > -1) {
                    side_pot_winners.push(sorted_winners[winner_index])
                }
            }
            winner_index += 1
        }

        let side_pot_earnings = Math.floor(side_pot.pot_size/side_pot_winners.length)
        for (let curr_winner of side_pot_winners) {
            distributeWinnings(curr_winner, side_pot_earnings)
        }
    }
}

//performs the default action (check or fold) due to time running out
function defaultAction(username) {
    let player_index = playing_users.indexOf(username)

    if (table_chips[current_turn] !== highest_bet || player_index === -1) {
        //user folds
        players_ingame[current_turn] = 0
        deck.userFolds(username, sorted_winners)
        foldFormattedCards(current_turn)

        //remove user that folded from all relevant side pots
        if (side_pots.length > 0) {
            side_pots.forEach((element, index) => {
                let side_pot_index = element.participants.indexOf(username)
                if (side_pot_index > -1) {
                    side_pots[index].participants.splice(side_pot_index, 1)
                }
            })
        }

        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify({event: "player_fold"}))
        })

        //winner is decided, only 1 player is left
        if (players_ingame.reduce((a, b) => a + b, 0) === 1) {
            submitChips()
            calculateWinnings()
            setTimeout(setupFirstRound, 1500)
        }
        else {
            sendNextTurn()
        }
    }
    else {
        //user checks
        sendNextTurn()
    }
}

function resetTimer(current_actor) {
    working_timer = {timer: ALLOTTED_TIME, current_actor: current_actor}
}

//sends the next turn to the client, in turn the client updates the players, chips, and sends a http post request with the answer
function sendNextTurn() {
    //if users_ingame - users_all_in <= 1, this means that no further actions can be taken yet the game progresses to the end
    let users_ingame = players_ingame.reduce((a, b) => a + b, 0)
    let users_all_in = all_in_users.reduce((a, b) => a + b, 0)

    if ((users_ingame - users_all_in) < 2 && actions.length === 0) {
        //current_turn set to -1, meaning no actions can be taken by anyone until the end of the game
        current_turn = -1
        showFormattedCards(true)
        //ws message sent to update table_chips, pot, timer, player_chips
        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify({event: "next_turn", highest_bet: highest_bet, turn: current_turn}))
        })
        setTimeout(setupNextRound, 2000)
    }
    else if (actions.length === 0) {
        setupNextRound()
    }
    else {
        current_turn = actions.pop()

        //username taken initially in case user exits browser before timer reaches 0
        let current_actor = playing_users[current_turn]

        //sends the first turn to each client (must be sent to every client for visual timer)
        setTimeout(() => {
            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "next_turn", highest_bet: highest_bet, turn: current_turn}))
            })
        
            resetTimer(current_actor)
        }, 500)
    }
}

//initializes the chip values of every player
function resetChips() {
    table_chips = Array(playing_users.length).fill(0)
}

function incrementButton() {
    button_index = (button_index + 1) % playing_users.length
}

//called when games are stopped, resets button index back to -1 (base state)
function resetButton() {
    button_index = -1
}

//sets small and big blinds respectively to the left of the dealer button
//if user does not have enough chips to cover, user is kicked out of table (might be subject to change for tournament mode (later addition))
function setBlinds() {
    let small_blind_index = (button_index + 1) % playing_users.length
    let big_blind_index = (button_index + 2) % playing_users.length

    //only in heads-up poker (i.e. 1v1)
    if (playing_users.length === 2) {
        small_blind_index = button_index
        big_blind_index = (button_index + 1) % playing_users.length
    }

    userRepo.getByUsername(playing_users[small_blind_index])
        .then((retrievedUser) => {
            let new_useable = retrievedUser.chips_useable - SMALL_BLIND
            playing_chips[small_blind_index] -= SMALL_BLIND
            userRepo.updateChipsUseable(new_useable, retrievedUser.username)
        })
        .catch((err) => {
            console.log(err)
            console.log("Error: User does not have enough chips for the blind.")
        })

    userRepo.getByUsername(playing_users[big_blind_index])
        .then((retrievedUser) => {
            let new_useable = retrievedUser.chips_useable - BIG_BLIND
            playing_chips[big_blind_index] -= BIG_BLIND
            userRepo.updateChipsUseable(new_useable, retrievedUser.username)
        })
        .catch((err) => {
            console.log(err)
            console.log("Error: User does not have enough chips for the blind.")
        })

    table_chips[small_blind_index] = SMALL_BLIND
    table_chips[big_blind_index] = BIG_BLIND
}

//submits all the chips to the main or side pot, and then resets chip values of each player for the next round
function submitChips() {
    let pot_offset = table_chips.reduce((a, b) => a + b, 0)

    if (side_pots.length > 0) {
        //adds chips to side pot
        side_pots[side_pots.length - 1].pot_size += pot_offset
    }
    else {
        house_chips += pot_offset
    }

    resetChips()
}

//initializes array of shown_cards from current_players.cards to be sent through JSON to client
function indexCards() {
    shown_cards.length = 0

    for (let current_player of current_players) {
        shown_cards.push([...current_player.hand])
    }
}

//called once game is no longer running, cleans up global variables and sends respective messages to clients
function endGameCleanup() {
    game_running = false
    players_ingame = Array(playing_users.length).fill(0)
    all_in_users = Array(playing_users.length).fill(0)
    resetButton()
    resetChips()
    showFormattedCards(false)
    current_board.length = 0
    house_chips = 0
    ready_users.length = 0

    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({event: "game_over"}))
    })
}


//builds the array of actions to be called, takes in current_action (action the last player has taken)
//is called at beginning of preflop, flop, turn, river, or when a raise is made
function buildActionsArray(last_action, is_raise) {
    let users_ingame = players_ingame.reduce((a, b) => a + b, 0)
    let users_all_in = all_in_users.reduce((a, b) => a + b, 0)
    
    //reset actions array to remake it
    actions.length = 0

    //if users_ingame - users_all_in <= 1, this means that no further actions can be taken yet the game progresses to the end
    //actions will stay as an empty array until the start of the next game
    //this code block does not run if the last action was a raise. In the case the last player goes all-in using a raise, the actions array will be 0 regardless.
    if ((users_ingame - users_all_in) <= 1 && !is_raise) {
        return;
    }

    let first_actor = (button_index + 1) % (playing_users.length)

    //pre-flop
    if (current_board.length === 0) {
        //allows player on button to act first ONLY during pre-flop, in the case it is a heads up game (i.e. 1v1)
        if (playing_users.length === 2) {
            first_actor = button_index
        }
        //first actor pre-flop with 3+ players is the 3rd player to the left of the dealer (i.e. left of the big blind)
        else {
            first_actor = (button_index + 3) % (playing_users.length)
        }
    }

    if (is_raise === 1) {
        first_actor = (last_action + 1) % (playing_users.length)
    }

    for (let i = first_actor; i < playing_users.length; i++) {
        if (players_ingame[i] && !all_in_users[i]) {
            actions.push(i)
        }
    }

    for (let j = 0; j < first_actor; j++) {
        if (players_ingame[j] && !all_in_users[j]) {
            actions.push(j)
        }
    }

    //the person that raised does not get to go again, unless another user raises
    //does not remove last action if user that raised went all-in
    if (is_raise && !all_in_users[last_action % playing_users.length]) {
        actions.pop()
    }

    actions = actions.reverse()
}

function setupFirstRound() {
    //kick out any players under 20 chips and those that have left the game
    reorganizePlayers()

    if (ready_users.length >= playing_users.length || playing_users.length === 1) {
        setTimeout(endGameCleanup, 1000)
        return;
    }

    //toggle game_running boolean value
    game_running = true

    //shuffles the deck and increments the button
    house_chips = 0
    shuffled_deck = deck.shuffleDeck(unshuffled_deck)
    setHighestBet(20)
    incrementButton()

    //clears the board
    current_board.length = 0

    //resets side pots
    side_pots.length = 0

    //initializes current_player objects
    deck.initializePlayers(playing_users, current_players)

    //initializes array of players_ingame to 1 (in game)
    players_ingame = Array(playing_users.length).fill(1)

    //initializes array of all_in_users to 0 (not currently all-in)
    all_in_users = Array(playing_users.length).fill(0)

    //resets the chip values for each player
    resetChips()

    //deals hands and initializes board
    deck.dealHands(shuffled_deck, current_players)
    deck.dealBoard(shuffled_deck, board)
    deck.multiHandChecker(board, current_players)
    sorted_winners = deck.multiHandSorter(current_players)
    displayed_hand_strengths = deck.displayHandStrength(current_players)

    //indexes shown_cards array to be formatted and then sent to client
    indexCards()

    //formats cards to be shown to clients (initially set to false == only user's cards are shown)
    showFormattedCards(false)

    //sets blinds 
    setBlinds()

    //send clients to update for first turn of game
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify({event: "first_turn"}))
    })

    //builds array of actions for next round
    buildActionsArray(-1, 0)

    sendNextTurn()
}

function setupNextRound() {
    if (all_ins.length > 0) {
        calculateSidePots()
    }
    else {
        submitChips()
    }

    switch(current_board.length) {
        case 0:
            for (let i = 0; i < 3; i++) {
                current_board.push(board[i])
            }
            setHighestBet(0)
            buildActionsArray(-1, 0)
            sendNextTurn()

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "update_board"}))
            })
            break;
        case 3:
            current_board.push(board[3])
            setHighestBet(0)
            buildActionsArray(-1, 0)
            sendNextTurn()

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "update_board"}))
            })
            break;
        case 4:
            current_board.push(board[4])
            setHighestBet(0)
            buildActionsArray(-1, 0)
            sendNextTurn()

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "update_board"}))
            })
            break;
        case 5:
            purgeDisplayedHandStrengths()
            //update formatted cards to show all valid cards for showdown
            showFormattedCards(true)

            setTimeout(() => {
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify({event: "showdown", hand_strengths: [...displayed_hand_strengths]}))
                })

                //checking all hands to see if user gets the stacked_deck achievement
                checkIfGoodHand(displayed_hand_strengths)
                setTimeout(calculateWinnings, 2000)
                setTimeout(setupFirstRound, 4000)
            }, 250)
    }
}

//----direct database calls, use async function to call these----//
//checks if the users table exists
function checkUsersTableExists() {
    return userRepo.tableExists('users')
}

//checks if the achievements table exists
function checkAchievementsTableExists() {
    return achievementRepo.tableExists('achievements')
}

//checks if a user with username exists
function checkUserExists(username) {
    return userRepo.usernameExists(username)
}

//calls the createUser sql query function, but also returns a hash for the login token
function addNewUser(username, password, is_admin) {
    const login_token = crypto.createHash('sha256').update(username).digest('hex')
    const game_token = crypto.createHash('sha256').update(login_token).digest('hex')
    const ingame_token = crypto.createHash('sha256').update(game_token).digest('hex')
    return userRepo.createUser(username, password, login_token, game_token, ingame_token, is_admin)
}

//deletes the users table (ONLY FOR TESTING)
function deleteUsersTable() {
    userRepo.dropUsersTable()
}

//deletes the achievements table (ONLY FOR TESTING)
function deleteAchievementsTable() {
    achievementRepo.dropAchievementsTable()
}

//deletes all users from the databases (ONLY FOR TESTING)
function deleteAllUsers() {
    userRepo.deleteAllUsers()
    userRepo.resetSequencing()
    achievementRepo.deleteAllUsers()
    achievementRepo.resetSequencing()
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

//----function to initialize new tables----//
function initTables() {
    userRepo.createTable()
        .then(() => {
            const users = [
                {
                    username: 'ylee',
                    password: 'dogwarrior',
                    is_admin: 1,
                },
                {
                    username: 'Basil',
                    password: 'catnip',
                    is_admin: 0
                }
            ]
            return Promise.all(users.map((user) => {
                const { username, password, is_admin } = user
                return addNewUser(username, password, is_admin)
            }))
            resolve('success')
        })
        .then(() => achievementRepo.createTable())
        .then(() => {
            achievementRepo.addUser('ylee')
            achievementRepo.addUser('Basil')
        })
        .catch((err) => {
            console.log('Error: ')
            console.log(JSON.stringify(err))
        })
}
//----------------------------------------------//

//----checks if users and achievements tables exist, else creates new users and achievements tables----//
async function checkTable() {
    const tableStatus = await checkUsersTableExists()
    if (tableStatus['COUNT(*)'] == 0) {
        initTables()
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
setTimeout(checkTable, 2000)
setTimeout(preloadAchievementsMap, 4000)








server_https.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});

app.post("/login", cors(), (req, res) => {
    const user = {username: req.body.username, password: req.body.password}
    userRepo.getByUsername(user.username)
        .then((retrievedUser) => {
            if (retrievedUser.password === user.password) {
                //user is already logged on on another browser
                if (clients.clientList.hasOwnProperty(retrievedUser.username)) {
                    res.status(200).json({message: `User is already currently logged in.`, auth: 0})
                }
                else {
                    res.status(201).json({message: `User "${user.username}" has logged in.`, auth: 1, token: retrievedUser.login_token, is_admin: retrievedUser.is_admin})
                }
            }
            else {
                res.status(200).json({message: `Password is incorrect.`, auth: 0})
            }
            resolve('success')
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: `User "${user.username}" is not in the database.`, auth: 0})
        })
});

app.post("/logout", cors(), (req, res) => {
    //login-token
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (clients.clientList.hasOwnProperty(retrievedUser.username)) {
                delete clients.clientList[retrievedUser.username]

                let player_index = playing_users.indexOf(retrievedUser.username)
                if (player_index > -1) {
                    if (game_running) {
                        leaving_users.push(player_index)
                    }
                    else {
                        playing_users.splice(player_index, 1)
                        playing_chips.splice(player_index, 1)
                        wss.clients.forEach(function each(client) {
                            client.send(JSON.stringify({event: "player"}))
                        })
                    }
                }

                removeFromReadyPlayers(retrievedUser.username)
                removeFromAchievementsArray(retrievedUser.username)
                res.status(201).json({message: `User has successfully logged out.`, auth: 1})
            }
            else {
                res.status(200).json({message: `User is already logged out.`, auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: `Error: User is not in the database.`, auth: 0})
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
            addNewUser(user.username, user.password, 0)
            achievementRepo.addUser(user.username)

            //adds to current achievements_map, only necessary for current server session
            achievements_map.saveUsername(user.username, [0, 0, 0])
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
            console.log(err)
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
            console.log(err)
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

                //if user has less than 10K chips in the bank, they are stripped of the wealthy achievement
                if (new_bank < 10001) {
                    updateAchievement('wealthy', retrievedUser.username, 0)
                }

                userRepo.updateChipsBank(new_bank, retrievedUser.username)
                    .then(() => {
                        userRepo.updateChipsUseable(new_useable, retrievedUser.username)

                        res.status(201).json({message: `Chips withdrawn.`, amount: new_bank, auth: 1})

                        resolve('success')
                    })
                    .catch((err) => {
                        console.log(err)
                        res.status(200).json({message: `Error: Chips bank could not be updated.`, auth: 1})
                    })
            }
            else {
                res.status(200).json({message: `Error: Insufficient chips for request.`, auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
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

                //if user has more than 10K chips in the bank, they are awarded the wealthy achievement
                if (new_bank > 10000) {
                    updateAchievement('wealthy', retrievedUser.username, 1)
                }

                userRepo.updateChipsBank(new_bank, retrievedUser.username)
                    .then(() => {
                        userRepo.updateChipsUseable(new_useable, retrievedUser.username)
                        res.status(201).json({message: `Chips deposited.`, amount: new_useable, auth: 1})
                    })
                    .catch((err) => {
                        console.log(err)
                        res.status(200).json({message: `Error: Chips bank could not be updated.`, auth: 1})
                    })
            }
            else {
                res.status(200).json({message: `Error: Insufficient chips for request.`, auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/join_game", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)

            if (playing_users.length === 10) {
                res.status(200).json({message: `Error: Game is currently full.`, auth: 0})
            }
            else if (retrievedUser.chips_useable <= 100) {
                res.status(200).json({message: `Error: User does not have enough chips on hand.`, auth: 2})
            }
            else if (player_index === -1) {
                if (game_running) {
                    //pushes values to flag-holding arrays such that for-of loops used for calculations function correctly
                    players_ingame.push(0)
                    all_in_users.push(0)
                    formatted_cards.push(['EmptyPlayer', 'EmptyPlayer'])
                }

                playing_users.push(retrievedUser.username)
                playing_chips.push(retrievedUser.chips_useable)
                addToAchievementsArray(retrievedUser.username)

                //200ms delay set to avoid any incorrect state changes in client, likely to run fine without delay if needed
                setTimeout(() => {
                    wss.clients.forEach(function each(client) {
                        client.send(JSON.stringify({event: "player"}))
                    })
                }, 200)

                res.status(201).json({message: `User has entered the game.`, token: retrievedUser.game_token, auth: 1})
            }
            else {
                //removes player from leaving_users array
                playerReturns(player_index)
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify({event: "player"}))
                })
                res.status(200).json({message: `User has rejoined the game.`, token: retrievedUser.game_token, ingame_token: retrievedUser.ingame_token, auth: 3, })
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: `Error: User does not exist.`, auth: 0})
        })
})

app.post("/exit_game", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByGameToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                if (game_running) {
                    leaving_users.push(player_index)
                    res.status(201).json({message: "User has left the game, but can rejoin if time permits.", auth: 1})
                }
                else {
                    playing_users.splice(player_index, 1)
                    playing_chips.splice(player_index, 1)
                    wss.clients.forEach(function each(client) {
                        client.send(JSON.stringify({event: "player"}))
                    })
                    removeFromReadyPlayers(retrievedUser.username)
                    removeFromAchievementsArray(retrievedUser.username)
                    res.status(201).json({message: "user has left the game.", auth: 1})
                }
            }
            else {
                res.status(200).json({message: "Fatal error: User is not currently in the game to leave.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Game token is invalid.", auth: 0})
        })
})

app.post("/ingame_token", cors(), (req, res) => {
    //login-token
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            res.status(201).json({auth: 1, token: retrievedUser.ingame_token})
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({auth: 0, message: "Error: User does not exist to retrieve ingame token."})
        })
})

app.post("/players", cors(), (req, res) => {
    //login-token
    const user_request = {token: req.body.token}
    let temp_formatted_cards = []
    
    if (game_running) {
        temp_formatted_cards = formatted_cards.map((arr) => {
            return arr.slice()
        })
    }
    else {
        for (let i = 0; i < playing_users.length; i++) {
            temp_formatted_cards.push(['EmptyPlayer', 'EmptyPlayer'])
        }
    }

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                //if player is in game, otherwise he is not shown cards. Might be subject to change.
                if (temp_formatted_cards[player_index][0] === 'Back') {
                    temp_formatted_cards[player_index] = Array.from(shown_cards[player_index])
                }
            }
            res.status(201).json({players: [...playing_users], cards: [...temp_formatted_cards], calling_user: retrievedUser.username})
        })
        .catch((err) => {
            res.status(201).json({players: [...playing_users], cards: [...temp_formatted_cards], calling_user: ''})
        })
})

app.post("/toggle_game", cors(), (req, res) => {
    //game-token, toggle request: 1 for add, 0 for subtract, begin_game: 1 if ready to begin game, 0 if ready to end game.
    const user_request = {token: req.body.token, toggle: req.body.toggle, begin_game: req.body.begin_game}

    userRepo.getByGameToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = ready_users.indexOf(retrievedUser.username)
            if (user_request.toggle === 1) {
                if (player_index <= -1) {
                    ready_users.push(retrievedUser.username)
                    res.status(201).json({message: "User has toggled on."})
                }
            }
            else {
                if (player_index > -1) {
                    ready_users.splice(player_index, 1)
                    res.status(200).json({message: "User has toggled off."})
                }
            }

            //all players are ready to start
            if (ready_users.length === playing_users.length && playing_users.length > 1 && !game_running) {
                ready_users.length = 0

                //start the game
                if (user_request.begin_game === 1) {
                    console.log("Game is starting!")
                    //build pre-flop actions array, parameters: no previous action, no is_raise
                    setTimeout(setupFirstRound, 250)
                } 
            }

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "start/stop"}))
            })
        })
})

app.post("/raise", cors(), (req, res) => {
    //ingame token, amount to raise
    const user_request = {token: req.body.token, amount: req.body.amount}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            //only accept request from player who's turn it is, else send a message saying it's not your turn
            if (retrievedUser.username === playing_users[current_turn]) {
                let new_useable = 0
                let old_highest_bet = highest_bet
                //all-in
                if (user_request.amount >= (retrievedUser.chips_useable + table_chips[current_turn])) {
                    //new_useable does not need to be changed, as all-in means new_useable === 0
                    highest_bet = Math.max(highest_bet, retrievedUser.chips_useable + table_chips[current_turn])
                    table_chips[current_turn] = retrievedUser.chips_useable + table_chips[current_turn]
                    all_ins.push({bet_size: table_chips[current_turn], player_index: current_turn})
                    all_in_users[current_turn] = 1
                }
                //normal raise
                else {
                    highest_bet = user_request.amount
                    new_useable = retrievedUser.chips_useable - (highest_bet - table_chips[current_turn])
                    table_chips[current_turn] = highest_bet
                }
                playing_chips[current_turn] = new_useable
                userRepo.updateChipsUseable(new_useable, retrievedUser.username)
                res.status(201).json({message: "You have raised.", auth: 1})

                //user raised, therefore actions array must be refashioned around the current user
                //only creates new action array if this is a valid raise; otherwise does the same thing as calling
                if (highest_bet > old_highest_bet) {
                    buildActionsArray(current_turn, 1)
                }

                sendNextTurn()
            }
            else {
                res.status(200).json({message: "It is currently not your turn.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "User is not in the database.", auth: 0})
        })

})

app.post("/call", cors(), (req, res) => {
    //ingame token
    const user_request = {token: req.body.token}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            //only accept request from player who's turn it is, else send a message saying it's not your turn
            if (retrievedUser.username === playing_users[current_turn]) {
                //regular call
                let new_useable = 0

                if (retrievedUser.chips_useable >= (highest_bet - table_chips[current_turn])) {
                    new_useable = retrievedUser.chips_useable - (highest_bet - table_chips[current_turn])
                    table_chips[current_turn] = highest_bet
                }
                //all-in call
                else {
                    table_chips[current_turn] += retrievedUser.chips_useable
                    all_ins.push({bet_size: table_chips[current_turn], player_index: current_turn})
                    all_in_users[current_turn] = 1
                }
                
                playing_chips[current_turn] = new_useable
                userRepo.updateChipsUseable(new_useable, retrievedUser.username)
                res.status(201).json({message: "You have called.", auth: 1})

                sendNextTurn()

            }
            else {
                res.status(200).json({message: "It is currently not your turn.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "User is not in the database.", auth: 0})
        })
})

app.post("/check", cors(), (req, res) => {
    //ingame token
    const user_request = {token: req.body.token}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.username === playing_users[current_turn]) {
                if (table_chips[current_turn] === highest_bet) {
                    res.status(201).json({message: "You have checked.", auth: 1})

                    sendNextTurn()
                }
                else {
                    res.status(200).json({message: "Checking is not a valid action.", auth: 0})
                }
            }
            else {
                res.status(200).json({message: "It is currently not your turn.", auth: 0})
            }

        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "User is not in the database.", auth: 0})
        })
})

app.post("/fold", cors(), (req, res) => {
    //ingame token
    const user_request = {token: req.body.token}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            //only accept request from player who's turn it is, else send a message saying it's not your turn
            if (retrievedUser.username === playing_users[current_turn]) {
                players_ingame[current_turn] = 0
                deck.userFolds(retrievedUser.username, sorted_winners)
                foldFormattedCards(current_turn)

                //remove user that folded from all relevant side pots
                if (side_pots.length > 0) {
                    side_pots.forEach((element, index) => {
                        let side_pot_index = element.participants.indexOf(retrievedUser.username)
                        if (side_pot_index > -1) {
                            side_pots[index].participants.splice(side_pot_index, 1)
                        }
                    })
                }

                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify({event: "player_fold"}))
                })
                res.status(201).json({message: "You have folded.", auth: 1})

                //winner is decided, only 1 player is left
                if (players_ingame.reduce((a, b) => a + b, 0) === 1) {
                    submitChips()
                    calculateWinnings()
                    setTimeout(setupFirstRound, 1500)
                }
                else {
                    sendNextTurn()
                }

            }
            else {
                res.status(200).json({message: "It is currently not your turn.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "User is not in the database.", auth: 0})
        })
})

app.post("/auth_login_token", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.login_token === user_request.token) {
                res.status(201).json({message: "Login token authenticated.", auth: 1})
            }
            else {
                res.status(200).json({message: "Invalid login token. (This path should not be reachable)", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Invalid login token.", auth: 0})
        })
})

app.post("/auth_game_token", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByGameToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.game_token === user_request.token) {
                res.status(201).json({message: "Game token authenticated.", auth: 1})
            }
            else {
                res.status(200).json({message: "Invalid game token. (This path should not be reachable)", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Invalid game token.", auth: 0})
        })
})

app.post("/auth_ingame_token", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.ingame_token === user_request.token) {
                res.status(201).json({message: "Ingame token authenticated.", auth: 1})
            }
            else {
                res.status(200).json({message: "Invalid ingame token. (This path should not be reachable)", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Invalid ingame token.", auth: 0})
        })
})

app.post("/auth_admin_token", cors(), (req, res) => {
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.login_token === user_request.token && retrievedUser.is_admin === 1) {
                res.status(201).json({message: "Admin token authenticated.", auth: 1})
            }
            else {
                res.status(200).json({message: "Invalid admin token.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Invalid admin token.", auth: 0})
        })
})

app.post("/current_chips", cors(), (req, res) => {
    //ingame token
    const user_request = {token: req.body.token}

    userRepo.getByIngameToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                if (players_ingame[player_index] === 1) {
                    res.status(201).json({message: "Sending chip differential.", auth: 1, tableChips: table_chips[player_index], playerChips: playing_chips[player_index]})
                }
                else {
                    res.status(200).json({message: "User not in game.", auth: 0})
                }
            }
            else {
                res.status(200).json({message: "Invalid user request.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: invalid user token.", auth: 0})
        })
})

app.post("/chat", cors(), (req, res) => {
    //login-token
    const user_request = {token: req.body.token, content: req.body.content}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            let message_broadcasted = retrievedUser.username + ": " + user_request.content
            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify({event: "chat_message", content: message_broadcasted}))
            })    
            res.status(201).json({message: "Message successfully sent."})
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Invalid login token."})
        })
})

app.post("/player_still_ingame", cors(), (req, res) => {
    //login-token
    const user_request = {token: req.body.token}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            let player_index = playing_users.indexOf(retrievedUser.username)
            if (player_index > -1) {
                res.status(201).json({message: "User still in game.", auth: 1})
            }
            else {
                res.status(201).json({message: "User not in game.", auth: 0})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Invalid login token.", auth: 0})
        })
})

app.post("/change_chips", cors(), (req, res) => {
    //login-token, admin-only
    const user_request = {token: req.body.token, username: req.body.username, amount: req.body.amount}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.is_admin === 1) {
                userRepo.updateChipsBank(user_request.amount, user_request.username)
                    .catch((err) => {
                        console.log(err)
                        res.status(200).json({message: "Error: Targetted user is not in database."})
                    })
                res.status(201).json({message: "Targetted user's chips successfully updated."})
            }
            else {
                res.status(200).json({message: "Error: User does not have access to this command."})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Invalid login token."})
        })
})

app.post("/change_password", cors(), (req, res) => {
    //login-token, admin-only
    const user_request = {token: req.body.token, username: req.body.username, password: req.body.password}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.is_admin === 1) {
                userRepo.updateUserPassword(user_request.username, user_request.password)
                    .catch((err) => {
                        console.log(err)
                        res.status(200).json({message: "Error: Targetted user is not in database."})
                    })
                res.status(201).json({message: "Targetted user's password successfully updated."})
            }
            else {
                res.status(200).json({message: "Error: User does not have access to this command."})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Invalid login token."})
        })
})

app.post("/force_logout", cors(), (req, res) => {
    //login-token, admin-only
    const user_request = {token: req.body.token, username: req.body.username}

    userRepo.getByLoginToken(user_request.token)
        .then((retrievedUser) => {
            if (retrievedUser.is_admin === 1) {
                if (clients.clientList.hasOwnProperty(user_request.username)) {
                    delete clients.clientList[user_request.username]

                    let player_index = playing_users.indexOf(user_request.username)
                    if (player_index > -1) {
                        if (game_running) {
                            leaving_users.push(player_index)
                        }
                        else {
                            playing_users.splice(player_index, 1)
                            playing_chips.splice(player_index, 1)
                            removeFromReadyPlayers(user_request.username)
                            removeFromAchievementsArray(user_request.username)

                            wss.clients.forEach(function each(client) {
                                client.send(JSON.stringify({event: "player"}))
                            })    
                        }
                    }

                    res.status(201).json({message: "Targetted user has been successfully logged out."})
                }
                else {
                    res.status(200).json({message: "Error: Targetted user is not currently logged in."})
                }
            }
            else {
                res.status(200).json({message: "Error: User does not have access to this command."})
            }
        })
        .catch((err) => {
            console.log(err)
            res.status(200).json({message: "Error: Invalid login token."})
        })
})

app.get("/achievements", (req, res) => {
    res.status(201).json({achievements: [...curated_achievements_array]})
})

app.get("/highest_bet", (req, res) => {
    res.status(201).json({highest_bet: highest_bet})
})

app.get("/dealer", (req, res) => {
    res.status(201).json({dealer: button_index})
})

app.get("/player_chips", (req, res) => {
    res.status(201).json({chips: [...playing_chips]})
})

app.get("/table_chips", (req, res) => {
    let num_players_ingame = players_ingame.reduce((a, b) => a + b, 0)
    res.status(201).json({chips: [...table_chips], num_players_ingame: num_players_ingame, current_turn: current_turn})
})

app.get("/ready_players", (req, res) => {
    //if no players are ready, returns empty string, else returns fraction of ready players to total players
    if (ready_users.length === 0) {
        res.status(201).json({ready_players: ''})
    }
    else {
        let ready_player_fraction = `${ready_users.length}/${playing_users.length}`
        res.status(201).json({ready_players: ready_player_fraction})
    }
})

app.get("/board_state", (req, res) => {
    const first = (current_board.length > 0) ? current_board[0] : "Empty"
    const second = (current_board.length > 1) ? current_board[1] : "Empty"
    const third = (current_board.length > 2) ? current_board[2] : "Empty"
    const fourth = (current_board.length > 3) ? current_board[3] : "Empty"
    const fifth = (current_board.length > 4) ? current_board[4] : "Empty"
    res.json({first: first, second: second, third: third, fourth: fourth, fifth: fifth});
});

app.get("/pot", (req, res) => {
    let total_pot = house_chips
    if (side_pots.length > 0) {
        for (let temp_pot of side_pots) {
            total_pot += temp_pot.pot_size;
        }
    }

    res.json({pot: total_pot});
})

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

app.use(express.static(path.resolve(__dirname, '../client/public')));
app.use(express.static('public'));
