# Poker Full-Stack Web App
This repository includes a web application client written in React JS and a web server written in Node JS for the purpose of
allowing users to play texas hold'em poker with other users across the web through the back-end server and respective databases.

The client employs https server calls for all pertinent game-play information, and all requests from the client are authenticated server-side
before relevant information is taken by the server or sent back to the client. Similarly, all client-side tokens are authenticated regularly
for a more secure user experience.

The server uses the ws (websockets) package to send relevant game-play information to the client to update or render certain components
given a server event and https APIs to handle the more traditional request-response-type server calls. The web server uses the SQLite3 package
to read and edit relational SQL databases to hold respective data.

A running version of this repository is currently hosted on [my website](https://www.yunyeollee.com) if you would like to play with friends.
The domain name and client are hosted on AWS Route 53 and Cloudfront respectively, and the server is hosted on an AWS E2 Linux VM. 

**Note:** The client is set up for https and secure web socket connections with the server, which requires both the client and server to have
valid SSL certificates to communicate, but will work fine for testing purposes using http and non-secure web sockets.
If you want to test and update this code on your own network, replace the client server calls in each client 
component and auth file from "https://{ServerIP}:3080/{API}" and port with http://localhost:3080/{API}, and the websocket connection call in 
the Components.js file from "wss://{ServerIP}:3080" to "ws://localhost:3080". Furthermore, update the client/package.json file
by changing the homepage from my website to http://localhost:3000, and update the cors variable origin in server/index.js to http://localhost:3000
to accept POST API calls from your local network. Also, if testing on a local network without wanting to get a SSL certificate for https communication, remove the declaration of the server_https variable in the server code, and replace it with server_http.

# Table of Contents
[Installing](#installing)

[React JS Client](#react-js-client)

[Node JS Server](#node-js-server)

[Deck of Cards Algorithms](#deck-of-cards-and-player-sorting)

[SQLite3 Databases and Data Access Object](#sqlite3-databases-and-data-access-object-dao)

# Installing
First, install Node and NPM (node packet manager) on your computer or virtual machine through their website.
To verify they are installed, you can use the terminal commands "node -v" or "npm -v" and it should show the version you have.

Once Node and NPM are installed, cd to the poker_fullstack_web_app directory and use "npm install" to download and install all
dependencies listed in package.json required for the server code. This should include the concurrently package, meaning you can
use the command "npm run dev" to install the react client dependencies and start up both the server and client concurrently from the same window.

Alternatively, you can open another terminal window and cd to the client folder and use "npm install" to download and install all
dependencies for the client. You can now run the client and server in separate terminal windows from the main directory using
"npm run client" and "npm run server" respectively. However, you can use "npm run dev" to run both from the same terminal window concurrently.

Remember, if you are testing this code on your own network, you need to follow the steps listed in **Note** at the [top](#poker-full-stack-web-app).
Following these steps will allow you to send server calls to your own network and accept POST API calls from your local network. Alternatively, you
can check out a working version on [my website](https://www.yunyeollee.com). 

# React JS Client
The client is hosted on a single-page web page URL, and employs tokens through browser session storage (stored in browser until session end)
and server-side token authentication to render certain components respective to player-state and game-state. Sub-components are layered and
compartmentalized within parent components as to reduce redundancies in the rendering of components (ex. player timers that render every second).

Websocket connection is established upon loading the client (i.e. accessing the client web page) and is disconnected upon session termination.
As a result, certain elements will render dynamically (ex. chat messages, new players, etc.) from events sent by the server to the client using
websocket broadcasted events. All https server POST API calls will be authenticated server-side, but most GET API calls (unless required) will
not be authenticated for ease of efficiency. 

All clients upon logging in will be pinged by the server every 30 seconds, and if the websocket connection is still unresponsive in the next 30 
second ping window without responding, the user will automatically be logged out and removed from the game if the user is in one. 

### Components

#### Achievements({ serial, inUse })
<ul>
    <li>serial - number (0-2) assigned to the mounted component denoting what achievement the component is correlated to</li>
    <li>inUse - boolean value (0/1) denoting whether or not the achievement should be rendered (0 for no, 1 for render)</li>
</ul>

The achievements component is used within the PlayerSlot parent component to display all achievements awarded to a given player. Each (Arguments) component is rendered on each PlayerSlot parent, but is set to null if the player has the given achievement. 

As of the creation of this document, there are only 3 achievements, as a result the displayed achievements do not need to dynamically spread apart or resize, but this can be accomplished if necessary in the PlayerSlot css file. 

The achievements of each player are requested from the server and update when a user achieves the required threshold to receive an achievement.

Currently there exist achievements for users that hold over 10000 chips in the bank, users that win 3 or more games and users that reach showdown with a hand strength of flush or higher.

#### Actions({ socket })
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

The actions component is in charge of handling all the https server API calls related to in-game actions (i.e. calling, folding, raising, checking), and updates component states accordingly to show relevant dynamic values (ex. how many chips would be required to call a bet). 

This component uses the websocket connection to listen for an event to update the highest_bet and current_chips states which is required for re-rendering and showing previously mentioned accurate dynamic values. 

Unless it is currently the user's turn (shown by the timer component and an accompanying bell noise), all user actions will not be correctly authenticated by the server, and will be nulled. Similarly, when it is the user's turn and the given user submits a valid action, all actions will go on a cooldown of 500ms before being usable again. This is a safeguard to prevent showing undefined results client-side, but regardless has no effect server-side.  

#### App({ socket, ingameToken, setIngameToken })
<ul>
    <li>socket - websocket connection set in parent component</li>
    <li>ingameToken - token state that determines whether or not user is in currently ongoing game, used in this component to conditionally render certain component sets</li>
    <li>setIngameToken - token method used to change ingameToken state, used in this component to be sent to a child component such that the child component can conditionally change the ingameToken state asynchronously and propagate the state change through its parent components</li>
</ul>

This component is used to contain all sub-components for gameplay and player elements. This includes the poker table, dealer chip, total chip pot, communal board cards, player slots and identifying elements, chips on the table and the possible actions UI. The socket prop given to this component is sent down to any relevant sub-components that require websocket listening capabilities. 

#### Board({ socket })
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

This component is used to display the communal board for the game, displaying either 0, 3, 4, or 5 cards depending on the game state. The board is updated once on initial mount, and is called again every time the relevant websocket event is broadcasted to the client by requesting the board state from the server. 

The board component also holds access to certain audio assets that are played whenever cards are dealt to the players or the board. 

#### Chatbox({ socket })
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

This component is in charge of displaying the chat box and any messages sent by the client or other clients. The message form sends the form data to the server, and in turn the server employs websockets to broadcast the message to all clients that are logged in, and the chat box is updated accordingly. 

If the chat box fills up to a set capacity, a rudimentary algorithm is used to remove the earliest message from the message dump to make room for the new message. Currently, a character limit is set to limit all messages to one line, but this can be altered in the future by implementing an algorithm to split long messages into multiple lines, but this capability seems unnecessary at this time.

The chat box component also plays a "new message" audio asset when the relevant websocket event is received by the client. 

#### Components()

This is the main component that is mounted on initial load, and controls all other
sub-components in the next-tier of hierarchy. 

This component is also in charge of establishing a secure websocket connection and responding to pings from the server, as well as maintaining the default state of all tokens given to the client for sub-component mounting. 
As a result, this component contains token-based conditional rendering of certain component sets as well as a few useful hooks and functions to authenticate and/or remove invalid tokens.

The websocket connection is memoized through the useMemo react hook to be able
to send the socket to different sub-components and interpret certain player or
game events.

#### Dealer({ socket })
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

This component handles the location and rendering of the dealer chip. This information is requested from the server by the client when the relevant websocket event is received. As a result, this component is purely visual. 

#### Deposit()

This component is responsible for both displaying how many chips the given user has on hand and allowing the user to deposit chips on hand into the chip bank. The chips displayed on hand updates dynamically according to how many chips are on hand through dynamic state changes. The deposition of chips into the bank is authenticated through the client's hashed login-token by the server before any change is made server-side. 

Note the difference between chips on hand and banked chips - chips on hand can be used in-game, but banked chips must first be withdrawn to be used in-game. 

#### JoinGame({ setGameToken, setIngameToken })
<ul>
    <li>setGameToken - token method used to change gameToken state - gameToken token is used to show whether or not a user is in a game or not</li>
    <li>setIngameToken - token method used to change ingameToken state - ingameToken token is used to show whether or not a user is in an ongoing game or not</li>
</ul>

**Note:** The difference between gameToken and ingameToken - gameToken denotes if a player is in the game before the game begins, but ingameToken denotes if a player is in an ongoing game

This component is responsible for allowing clients to join a game if they meet the requirements to join (i.e. having the required chip minimum), and also allows clients to rejoin the game and resume their turn (if their timer has not run out yet) if they close the browser or log out during a game they are currently in. For the latter reason, this component has access to methods to quickly grant gameplay-related tokens to the client. 

The client is authenticated by the server by the client's hashed login-token to verify that the client is a real registered user. This is somewhat redundant as the token authentication functions will remove any false tokens from the client but is used to keep any caught "not-found" SQL errors server-side to a minimum. 

#### Login({ setLoginToken, setAdminToken })
<ul>
    <li>setLoginToken - token method used to change loginToken state - loginToken token is used to determine if a user is logged in or not</li>
    <li>setAdminToken - token method used to change adminToken state - adminToken token is a token given to users with admin privileges (must be set manually by calling the respective function server-side or editing the database directly) and displays admin-only commands found in [Restricted Actions](#restricted-components-ie-admin-commands)</li>
</ul>

This component is responsible for accepting login information from users allowing users to log in after authenticating with the server. Furthermore, if a user is already logged in on another session, the latter client will not be able to log in until the former client has closed the browser or logged off. 

The server continually pings the client every 30 seconds through websockets, and if the client is unresponsive for 2 consecutive ping cycles, the user will be logged off, allowing them to log in on another session. 

#### PlayerChip({ chips })
<ul>
    <li>chips - integer value that denotes the number of chips to display on a player slot element</li>
</ul>

This component displays the number of chips on hand for a given player on their respective player slot element. This component is a sub-component of the PlayerSlot component. 

#### PlayerSlot({ socket, currPlayer, winner, handStrength, achievements })
<ul>
    <li>socket - websocket connection set in parent component</li>
    <li>currPlayer - object prop that includes many properties of a given player (i.e. username, held cards, chips on hand and whether or not the given player slot element is in use) to be sent to various child sub-components</li>
    <li>winner - a boolean value that denotes whether or not a given player is the winner of a particular game - used to display a glowing effect around the winner to all players in the game</li>
    <li>handStrength - a string value sent at the end of a game at showdown to show the strength of each player's hand (granted they have not yet folded), set to an empty string by default until the end of a game</li>
    <li>achievements - an array of boolean integer values that denote whether or not the given user has earned a specific achievement</li>
</ul>

This component is responsible for displaying each player's statistics and in-game properties to all other players. All information that should stay hidden to other players (i.e. what cards each player has and the strength of their hand) are only given by the server to the parent component and propagated to this component when no actions can be taken by players (i.e. the end of a game).

The cards shown that "belong" to other players are shown as a card back, and cannot be seen by other clients. The client does not receive any information that may unfairly change the outcome of the game, as the server obfuscates the respective properties until the correct game-state has been reached, rather than the client. 

The PlayerSlot component also contains the timer for each player when it is a given player's turn. Because it is necessary for the timer to quickly update to the game-state to serve as an accurate timer, the Timer sub-component is passed the websocket from its parent component.

The inUse property of the _currPlayer_ object argument doubles as a playerIndex (i.e. 0 for not in use or 1-9 for which slot is in use) for use in the Timer component such that the timer can update and correctly determine when a certain player slot's timer should be running. Also, when the inUse property is set at 0, the component does not render, as there is no player using the given slot.

Possible optimizations to more efficient and less redundant rendering include further compartmentalizing the _winner_ and _handStrength_ properties into their own components, but currently has negligible changes on client load. 

#### PlayerSlots({ socket, setIngameToken })
<ul>
    <li>socket - websocket connection set in parent component</li>
    <li>setIngameToken - token method used to change ingameToken state - ingameToken token is used to show whether or not a user is in an ongoing game or not</li>
</ul>

This component is responsible for displaying all the player slots of players currently in the game (i.e. hold the gameToken). Similarly, this component requests several state variables from the server, including the winners of a given round, the hand strengths of each player, each player's username, each player's cards, each player's chips on hand, and each player's achievements. Each of these variables are kept as states, and are updated when the respective websocket event is received from the server.

Certain properties (i.e. cards held by other players, the winner of a game and the strength of each player's hand) are withheld from the client by the server until the correct gamestate has been reached, and instead hold default values until the relevant websocket event is received. 

This component is in charge of rendering all PlayerSlot child sub-components and sending the relevant props, and also setting the ingameToken token if a player has joined a game in progress or if a player has started the game. 

#### Pot({ socket })
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

This component is responsible for the in-game chip pot. This displays the total number of chips in the pot (including the main pot and any side pots). The pot value is updated through a server request every turn and at the end of a game, which is timed through received websocket events. 

#### ReadyPlayers({ socket, setGameToken, ingameToken })
<ul>
    <li>socket - websocket connection set in parent component</li>
    <li>setGameToken - token method used to change gameToken state - gameToken token is used to show whether or not a user is in a game or not</li>
    <li>ingameToken - a token used to determine whether or not the given user is in an ongoing game or not (as opposed to being in a game that has not yet started)</li>
</ul>

This component renders a button to stop or start the game, depending on whether or not the game is currently in progress or not respectively. Furthermore this component also renders a fraction element that denotes how many currently playing users wish to stop/start the game. This is updated through a websocket event that is broadcasted when a user has toggled the stop or start button sub-components. 

This component's purpose is mostly visual and exists to conditionally render sub-components that allow users to alter the game-state. 

#### Register()

This component is responsible for allowing users to register an account. If the requested username is not already registered, a new account with the given username and password will be created in the server database, and will start with 10000 chips. 

On account creation server-side, the account is created with hashed tokens that will be used in the future for token authentication and will have default flags set. 

#### RestrictedActions()

This component is a container for all the restricted actions (i.e. admin commands) that are only usable by users that are flagged as admins. 

A user with a spoofed admin token will not be able to access any of the commands, as all commands are directly authenticated through the server, and will regardless be removed client-side due to not passing the default token authentication. 

#### StartGame()

This component renders the "start game" button, which allows a user to toggle whether or not they would like to start the game. A glow will appear around the button denoting whether or not their button is currently toggled, and each toggle of the button will be authenticated with the server and be shown in a dynamically updating fraction shown in the ReadyPlayers component.

Currently server-side, out of all players currently in the game, the decision must be unanimous to start a game, and the game will start if at least 2/2 players unanimously decide to start the game. The same rules apply for stopping a game. However, if a game is ongoing and there exists only one player that can continue playing at the end of a game (i.e. player logs out, leaves the game, closes browser, does not have enough chips to continue), the game will automatically stop.

#### StopGame()

This component renders the "stop game" button, which allows a user to toggle whether or not they would like to stop the game. A glow will appear around the button denoting whether or not their button is currently toggled, and each toggle of the button will be authenticated with the server and be shown in a dynamically updating fraction shown in the ReadyPlayers component.

Currently server-side, out of all players currently in the game, the decision must be unanimous to start a game, and the game will start if at least 2/2 players unanimously decide to start the game. The same rules apply for stopping a game. However, if a game is ongoing and there exists only one player that can continue playing at the end of a game (i.e. player logs out, leaves the game, closes browser, does not have enough chips to continue), the game will automatically stop.

#### TableChip({ chips })
<ul>
    <li>chips - integer value that denotes the number of chips to display on the table for a given player (i.e. chips bet in a given round by a player)</li>
</ul>

This component renders the number of chips bet by a player in a given round. In the case that no chips are bet, the container will be hidden, and nothing will be rendered until the player makes a bet. 

#### TableChips({ socket }) 
<ul>
    <li>socket - websocket connection set in parent component</li>
</ul>

This component is responsible for rendering all TableChip sub-components for each player in the game when a valid action is taken by a player ingame that involves betting any number of chips. The number of chips on the table held by each player is requested from the server when certain events are broadcasted through the websocket client, and is propagated to all individual TableChip child sub-components. 

Each time this component sends a server request for a tableChips state update, a rudimentary calculation is made to determine whether or not the last player has "checked" or "bet" any number of chips, and a sound is played when the condition is met. 

#### Timer({ socket, playerIndex }) 
<ul>
    <li>socket - websocket connection set in parent component</li>
    <li>playerIndex - (1-9) integer index of which PlayerSlot parent component the given Timer component is rendered within</li>
</ul>

This component handles the dynamic timer representing the length of a user's turn ingame. As this component is embedded within each PlayerSlot parent component, the Timer component is made to render the given player's timer that is received from the respective websocket event. To achieve the correct response when a new event is received, a stateful value turn is updated when it is a new user's in-game turn. 

Furthermore, a referenced boolean value player_turn is toggled when the received websocket event matches the playerIndex, allowing only one of the several embedded Timer components to render at a given time.

The timer is set to a static allotted time of 25 seconds per turn, and is set to 26 seconds in the server to compensate for the time in between the server sending the websocket message to the client and the client rendering the timer. To achieve a dynamically rendering timer, a referential value proxy_timer along with a stateful timer value is set to countdown when the player_turn value is set to true. This allows the timer to reset and countdown for one and only one Timer component out of the several other instances embedded within each PlayerSlot component. 

**Note:** A proxy_timer referenced value is used in tandem with the stateful timer value, because clearing the interval loop based on a constantly updating stateful value can cause undefined results for re-renders. A referenced value that is referenced between renders works as a more reliable source of information for a precise conditional. 

#### Withdraw()

This component is responsible for rendering the number of chips in the user's bank, as well as serving as a user interface that allows users to withdraw chips from the user's bank into the user's chips on hand. 

### Restricted Components (i.e. Admin Commands)

These components include a series of rudimentary user interfaces and respective API functions to allow users with an admin token (must be created manually server-side) to call certain admin-only commands. These commands include changing the chips in any registered user's bank, changing the password of any registered user and logging out any user forcefully. 

The purpose of these commands is mostly for debugging and testing, but the force logout command can be useful in case a client is logged in and able to send websocket responses to the server on every ping request cycle, but wishes to be logged out for any reason. 

#### ChangeChips()

This component serves as a rudimentary user interface and respective API function to allow admins to change the chips in any user's bank. 

The admin token required for rendering this component is authenticated server-side, and will only allow authenticated admin users to complete a server request. 

#### ChangePassword()

This component serves as a rudimentary user interface and respective API function to allow admins to change any user's password. This will not force log out the given user, but can be used in tandem with the ForceLogout component to achieve this if necessary.

The admin token required for rendering this component is authenticated server-side, and will only allow authenticated admin users to complete a server request. 

#### ForceLogout()

This component serves as a rudimentary user interface and respective API function to allow admins to forcefully log out a registered user. This will also remove the user from the game if they are in one.     

The admin token required for rendering this component is authenticated server-side, and will only allow authenticated admin users to complete a server request. 

### Authorization Related Functions and Tokens

The tokenAuth function is called on any time the client is given a token (login, admin, game, ingame tokens) and manually authenticates each token with the server that the client currently has. If any tokens do not match the hashed tokens in the server user database, the respective token is removed from the client. 

The useToken functions are each used as function definitions to efficiently receive, authenticate and update respective tokens. Defining these stateful functions in the broadest level component (Components.js) allow the tokens and token-updating methods to be sent down to sub-components and propagate back such that conditionals for component rendering can be properly updated. 

# Node JS Server

The server is in charge of maintaining all metadata on clients that have logged in through the client, player and game-related values of all clients, SQL database interpretation and modification through the data access object (DAO), all REST APIs that are called by various client components and secure websocket communications with the client. 

Furthermore, the server performs all the necessary calculations on game-state, player-state, and game-related variables. As a result, no calculations are done by the client, preserving game-state security and allowing the client to only use processing power in efficiently rendering components and receiving requested server API responses. Essentially, the game is run entirely server-side, and the client interacts with the server like a black box, receiving only the necessary information to render the active state of the game to the user. 

All APIs that can be called by the client that actively alter the game state or reveal time-sensitive information are authenticated sometimes by the client and always by the server, the former used sparingly to reduce server load from possible redundant client requests (i.e. button spamming). The secure websocket connections between the server and clients are held in a hash map, and are updated whenever new connections are made or old connections are severed. The server also pings clients every 30 seconds, and if a client is unresponsive for 2 or more 30 second cycles, the connection is severed automatically and the client is logged out.  

To interact with the relevant constructed databases, either through loading or editing data in said databases, a data access object (DAO) was built (see dao.js file) that allows the server to directly interact with SQL database data through built methods in JavaScript (see achievement_repository.js or user_repository.js). This allows the server to efficiently interact with database data in a readable and succinct manner, and is free from SQL injection vulnerabilities by using prepared statements in each DAO method repository.

### Game-Related Server Methods

#### addToAchievementArray(username)
<ul>
    <li>username - username of client to be added</li>
</ul>

The addToAchievementArray method is used when a user joins the game, and adds the user's username and achievement data held in the achievement hash map into a working array of users and their respective achievements. This working array is sent to the client such that all clients can render each user's achievements accurately.

#### buildActionsArray(last_action, is_raise)
<ul>
    <li>last_action - the player index corresponding to the action performed by the most recent player (i.e. 0-9, -1 if start of new round)</li>
    <li>is_raise - a boolean integer value that denotes whether or not the last action was a raise (1 if raise, 0 if not)</li>
</ul>

The buildActionsArray method is used for building an array of player turns by their player index for a given round (i.e. pre-flop, flop, river, etc.), and is used by the sendNextTurn method to determine the next player's turn and broadcast the message via websocket. The sendNextTurn method removes one turn from the array stack at a time, and when the action array is empty, this begins the next round of play, or finishes the game if it is the last round. 

If a user performs a raise, the buildActionsArray method is called and constructs the turn order around the last acting player's index, and the round continues. Furthermore, if no more actions should be taken in further rounds (i.e. all but 1 or all players are all-in) and instead progresses the game in the standard intervals. 

**Note:** The turn order formula differs for when there are only 2 players playing as opposed to 3+ players playing at a time. This is not undefined behavior, as it acts accordingly with standard texas hold'em rules for heads-up play. 

#### calculateSidePots()

The calculateSidePots method is responsible for building any side pot objects in the case a player in the main pot has pushed all-in. All side pot objects are built with properties including the side pot size (chip value) and an array holding the player indices of the participants of the given side pot. 

This method is called at the end of each round that a player has pushed all-in, and adds to the side pot array, which will be used in end-game chip calculations. Furthermore, the last element of the side pot array is used in other methods as the pseudo pot, as if a user has pushed all-in prior to future betting, any future betting will belong to the corresponding side pot. As a result, calling this method can oftentimes result in a side pot of 0, which is used as a medium for future betting.

The calculations of the side pot are not seen by the client, and the total number of chips in the main pot and the side pot are shown in the pot client component through the corresponding server API.

#### calculateWinnings()

The calculateWinnings method is called at the end of each game, and is responsible for analyzing the chip values and winner(s) of each pot (main and side pots) and distributing said chips to the winner(s). 

This method first distributes the main pot, and then examines each side pot (if there are any) and rewards the respective chips. The side pots array is reversed before examination for constant-time array popping such that the side pots with the most participants are handled first. 

This method is also responsible for tallying wins in the user database so that users may be rewarded the "Talented" achievement when they accumulate enough wins to meet the threshold. 

#### checkIfGoodHand(hand_strengths)
<ul>
    <li>hand_strengths - an array of the category of each player's hand and board combination, sorted by player index</li>
</ul>

This method is purely used at showdown to determine whether or not the users playing have the required hand strength threshold to be rewarded the "Stacked Deck" achievement. Currently this achievement is awarded to users that reach showdown with a flush or better, but can be easily changed if wanted. 

#### defaultAction(username)
<ul>
    <li>username - username of the player that must act in the given in-game turn</li>
</ul>

The defaultAction method is called if a user's in-game timer reaches 0, and is used to progress the game in the case that a user cannot respond in time. Essentially, if this method is called for a user, they will check if the option is open to them (i.e. their current bet is equal to the highest bet on the table), else they will fold. 

#### endGameCleanup()

The endGameCleanup method is called if all users have decided to stop the game (will be called at the end of the current game), and is called to clean up and reset all in-game variables to a base state. This method is not called if the games progress, as the server in-game variables recursively update every new game cycle. 

#### foldFormattedCards(player_index)
<ul>
    <li>player_index - the player index (0-9) of the given in-game user, corresponding to their position on the game table</li>
</ul>

The foldFormattedCards method is called whenever a user folds, and is used to alter the formatted_cards in-game variable to show that the given user is no longer participating in the given game. This is done to show an accurate representation of the game client-side, but has no bearing on the actual game server-side. 

#### incrementButton()

The incrementButton method is used to increment the button_index variable to move the dealer chip. The button_index variable is used in building the actions array that determines in what order players should act in-game, and is incremented once at the beginning of every game. 

#### indexCards()

The indexCards method is called at the beginning of every game, and creates a sorted array containing the hands of each player. This new array serves as a base for the formatted_cards array, which is edited on a client-by-client basis such that it can be shown to the client without divulging the cards of other users and be updated when users fold or showdown occurs. 

#### playerReturns(player_index)
<ul>
    <li>player_index - the player index (0-9) of the given in-game user, corresponding to their position on the game table</li>
</ul>

The playerReturns method is only called when a user is in-game, but has left the game (closing the browser or logging out) and rejoins the game before the timer runs out or the defaultAction method causes them to fold. The purpose of this method is to remove the given player from the leaving_users array, which is used at the end of each game to remove invalid players (i.e. players with too few chips or players that have left the game)

#### preloadAchievementsMap()

The preloadAchievementsMap is called once at the beginning of the server load, and loads all data from the achievements SQL database into the achievements_map hash map. This method is used to memoize all current users and their respective achievements such that the server does not have to read from the database for every achievement-related server API request. 

#### purgeDisplayedHandStrength()

The purgeDisplayedHandStrength method is called each game before showdown (if it occurs), and removes the respective indices from the hand_strength array for users that have folded. This is done to prevent users from seeing what hands other users had in the case they had folded prior.

#### removeFromAchievementsArray(username)
<ul>
    <li>username - username of given player</li>
</ul>

The removeFromAchievementsArray is called when a user leaves the game, and removes said user from the sorted achievement arrays, which are sent to the client so that users can see the achievements held by all in-game users. These achievement arrays are different from the preloaded achievements hash map, and are curated to only show the achievements of players currently in-game. 

#### removeFromReadyPlayers()

The removeFromReadyPlayers method is called when a user leaves the game for any reason, and removes said user from the list of players that have toggled on to either start/stop the game (depending on the current game-state). This method is called regardless of if the given user has toggled on or not, but checks for this inside the method itself. 

#### reorganizePlayers()

The reorganizePlayers method is called before the start of a new game, and removes all users that do not have the minimum required number of chips to play and all users that are leaving the game (closing the client, leaving the game, logging out) using its two sub-methods. 

#### resetButton()

This method is called in the endGameCleanup method, and resets the button_index (i.e. the dealer chip) such that the dealer chip starts in the same place every new game session (at player index 0, or the first player to be seated).

#### resetChips()

The resetChips method is used to reset the chips bet by all users in a given round. This method is called at the end of every round and every game.

#### resetTimer()

The resetTimer method is called at the beginning of every player turn, and resets the player turn timer to the respective allotted time (26 seconds) to begin counting down the time of each player's turn. The allotted time is 26 seconds compared to the 25 seconds shown client-side to account for any time required for the given message via websocket to be received and registered by the client. 

This method also sends the current actor (i.e. player whose turn it is) to the player turn timer such that the correct default action can be taken for the correct player. This is done to prevent any possibility of incorrect timing due to the asynchronous nature of the database requests done in the defaultAction method. 

#### sendNextTurn()

The sendNextTurn method is responsible for determining the next game-state, and calls respective functions to progress the game into the next round or broadcast the next player turn via websocket. 

In the case that no actions can be taken (i.e. all but one or all users have pushed all-in), this method accelerates the game-state to showdown, and broadcasts the websocket messages to the client required to synchronously update and render in-game components. 

#### setBlinds()

The setBlinds method is called at the beginning of every game, and is responsible for setting up the small and big blinds (10 and 20 chips respectively) from the first two players to the left of the dealer chip. This behavior is changed somewhat for heads-up games (i.e. only 2 users playing) to follow heads-up play rules. 

#### setHighestBet(default_value)
<ul>
    <li>default_value - number of chips that denote the highest bet currently</li>
</ul>

The setHighestBet method is called at the start of every new round with a default value (20 at the beginning of the game, 0 otherwise) to denote the highest number of chips currently bet on the table by a single player. This value is updated every time a player raises, and will be increased to match the new highest bet. The highest_bet in-game variable is used in server-side calculations, and is also sent client-side regularly to dynamically render certain elements, most notably the dynamic "call x" action element.

#### setupFirstRound()

The setupFirstRound method is called at the beginning of every game, and primes all relevant player and game variables for a new game. Most notably, this method creates a new permutation of the deck of cards, resets most game variables, and re-populates all player elements, including their hands and highest hand-board combinations. Lastly, this method sets the blinds for the given game, builds the new array of player turns to be taken, and then sends the next turn to the client.

#### setupNextRound()

The setupNextRound method is called at the end of every betting round, and performs several actions to allow the next round to progress. Most notably, depending on the game-state, this method can add another card to the viewable board, build a new array of player turns, and send the next player turn to the client. If it is the end of a game and showdown is reached (betting has ended, and all 5 cards are on the board), this method broadcasts the respective events to the client via websocket, and calls methods to distribute chips to the winners and then set up the start of the next game.

#### showFormattedCards(isShowdown)
<ul>
    <li>isShowdown - a boolean value denoting whether or not the game-state is at showdown, meaning all 5 cards are on the board and the betting has ended without all but 1 player folding</li>
</ul>

The showFormattedCards method is used to build an array of card values based on the shown_cards game variable such that the resulting array can be sent to the client to be rendered accordingly. If this method is called with isShowdown being false, clients will only be able to see their own cards and the cards on the board, and the cards of other clients will have placeholders so as to not give any unfair in-game knowledge. 

If isShowdown is set to true, meaning the showdown game-state has been reached, all users will be able to see the cards of any players still in the game (i.e. not folded) as is customary in the rules of poker. 

#### submitChips()

The submitChips method is called at the end of each betting round, and is responsible for resetting the chips bet by each player in that given round (i.e. the table chips), and moving said chips to the house (i.e. the house chips, also known as the main pot).

In the case that side pots need to be created (if a user pushes all-in), the calculateSidePots method is called instead of this method, and the bet chips are split in a different manner between the main and side pots. 

#### updateAchievement(achievement, username, is_added)
<ul>
    <li>achievement - the achievement in question, in string format</li>
    <li>username - username of player to be rewarded an achievement or have an achievement taken from them</li>
    <li>is_added - a boolean integer value denoting whether the user is given an achievement or an achievement is taken from them (1 for rewarded achievement, 0 for achievement removed)</li>
</ul>

This method is called whenever a user reaches the threshold to be rewarded an achievement or have an achievement taken from them. For example, this method is called to award the "Wealthy" achievement when the user has reached more than 10000 chips in their bank, but is also called to remove said achievement from the user once less than 10000 chips exist in their bank.

This method first edits the achievement database, and then the loaded achievements hash map (because the achievements hash map is not dynamically loaded from the database, and must manually be changed for the hash map to see the new results). Then if the player is currently in the game, the sorted arrays holding the curated achievements of players are edited to be sent to the client to show the new achievements of a user in real time.

### Miscellaneous Server Methods

#### addNewUser(username, password, is_admin)
<ul>
    <li>username - requested username for the new user</li>
    <li>password - requested password for the new user</li>
    <li>is_admin - a boolean integer value denoting whether or not the user to be created is an admin or not (1 for admin, 0 for normal)</li>
</ul>

The addNewUser method is used to add a new registered user to the user database. Several values are hashed using the SHA-256 hashing algorithm to create the login, game and ingame tokens for the new user. To create the login token the username is hashed, to create the game token the login token is hashed and to create the ingame token the game token is hashed. As a result, all token authentication is cryptographically sound, meaning any attacker cannot feasibly access a user account that is not theirs from the client, or spoof tokens to access content that they should not be able to access. 

#### checkAchievementsTableExists()

The checkAchievementsTableExists method checks whether or not the achievements table in the achievements SQL database currently exists. This method is usually only used for testing, as the database tables are never deleted outside of testing, as tables can be reset more elegantly through the use of the deleteAllUsers method. 

#### checkIfUserExists(username)
<ul>
    <li>username - username of user in question</li>
</ul>

The checkIfUserExists method is to quickly check if the given username is in the users SQL database. As it is also possible to query the given username and use error catching to check whether a user exists whilst also performing actions on the given users SQL database entry, this method is not used in any server APIs, and only exists for manual testing if necessary. 

#### checkTable()

The checkTable method is called once at the start of the server load, and calls the checkUsersTableExists method to check if the users table in the users SQL database exists. If the user database has been wiped by another function manually, this method will call the initTables function to create a new table in the database and populate it with default values (i.e. 2 default users, 1 admin, 1 normal)

#### checkUsersTableExists()

The checkUsersTableExists method checks whether or not the achievements table in the achievements SQL database currently exists. This method is used in the checkTable method to make sure all tables in the SQL databases are accounted for, but is rarely necessary outside of testing, as tables can be elegantly reset using the deleteAllUsers method. 

#### deleteAchievementsTable()

The deleteAchievementsTable method does exactly as the name implies, and deletes the achievements table from the achievements SQL database. This method exists only for testing, as methods directly using the data access object (DAO) can reset the data in the achievements database without directly removing the table outright. 

#### deleteAllUsers()

The deleteAllUsers method deletes all users in both the users and achievements SQL databases, and resets SQL sequencing to base (sequencing is used to allocate a unique user ID to each entry in each database). This method is used to quickly and efficiently reset all entries in the databases to default, but is usually only used for testing.

#### deleteUsersTable()

The deleteUsersTable method is used to delete the entire users table from the users SQL database. This method exists only for testing, as the deleteAllUsers in combination with the checkTable method will accomplish the same task without deleting the table outright. 

#### initTables()

The initTables method is called to create new users and achievements tables in the respective SQL databases, and populates said tables with default data, corresponding to 2 default users. This method is only called if the users table has been deleted, which can only occur during testing, but exists nonetheless to signal that the databases are clean. 

#### getAllUsers()

The getAllUsers method is called to display all users in the users SQL database in order corresponding to their time of registration. This method is only used for testing, and is not used in any other key gameplay methods. 

### Server Global Timers

In the server code, there are two globally running timers that run constantly to flush severed connections in the client hash map and enable a precise in-game timer for player turns. 

#### Pinging Clients for Removing Severed Connections

This timer cycles every 30 seconds from the server launch, and within every cycle pings all currently logged on users via websocket. If any user is unresponsive for 2 or more cycles concurrently, they will be logged off, and removed from the game if they are in one. 

#### Accurate Player-Turn Timer

This timer cycles every second from the server launch, and is reset to a set value (26 seconds) when the game is in progress and a player's turn has begun. When the timer cycles to a value of 0, given the game is currently in progress, the default action (check or fold) will be done by the player associated with the current turn, and the game will continue. 

### GET Server APIs

#### /*

This API is never called by the client, but exists in the case a user accesses the domain hosting the server, as this wild-card will bring any invalid domain extensions to the server homepage. 

#### /achievements

This API sends the sorted array of achievements held by the players currently in the game. This information is held as a 2-D boolean integer array, and is sent to the client in JSON format.

#### /board_state

This API sends an object holding properties corresponding to the 5 card slots available to the in-game board in JSON format, and is sent to the client through the Board component on load and when the respective websocket event is broadcasted from the server to the client. 

#### /dealer

This API sends the button_index value to the client (location of dealer chip) such that the client can render the dealer chip in the correct location on the board.

#### /highest_bet

This API sends the highest bet in chips made in the current betting round in JSON format. This information is necessary for calculating client-side what player action was taken last in the TableChips component using the displacement of bet chips and the highest bet variable. The highest bet is also used in the Actions component to dynamically change the rendered "Call x" action client-side.

#### /player_chips

This API sends the number of chips held by every player currently in the game as an array in JSON format. This is equivalent to the chips on hand as opposed to chips bet on the table or chips in the bank. 

#### /pot

This API sends the total number of chips currently in all pots in JSON format, including the main pot and any side pots if they exist. This API is called at the start of every round, and at the end of the game. 

#### /ready_players

This API sends the number of players that have toggled on to start/stop the game, depending on the current game-state in JSON format as text showing a fraction of players toggled out of all players eligible. 

#### /table_chips

This API sends an array of the number of chips currently bet by each player on the table in a given betting round in JSON format. Furthermore, it also sends the number of players currently not folded as well as the current turn, as these values are used alongside the chips array itself to perform rudimentary calculations in the TableChips component to conditionally load certain audio assets or re-render certain elements. 

### POST Server APIs

#### /auth_admin_token

This API receives the login token of the given client, and checks whether or not the corresponding user is an admin in the database. If correctly authorized, the client can continue to hold the admin token, but any usage of admin-only commands will require authorization server-side from the respective API itself. If the token is invalid, the token is taken away client-side.

#### /auth_game_token

This API receives the game token of the given client, and checks whether or not the corresponding user holds a valid game token, allowing them into the game. If correctly authorized, the client can continue to use the game token, but any server API requests involving a game token will authenticate the token again within the respective API itself. If this game token is invalid, it is taken away from the client. 

#### /auth_ingame_token

This API receives the ingame token of the given client, and checks whether or not the corresponding user holds a valid ingame token, meaning they are currently playing the game in progress. If correctly authorized, the client can continue to use the ingame token, but any server API requests involving a ingame token will authenticate the token again within the respective API itself. If this ingame token is invalid, it is taken away from the client. 

#### /auth_login_token

This API receives the login token of the given client, and checks whether or not the corresponding user holds a valid login token, meaning they are currently logged in through the client. If correctly authorized, the client can continue to use the login token and perform actions eligible with the token, but any server API requests involving the login token will authenticate the token again within the respective API itself. If this login token is invalid, it is taken away from the client, and the client is logged out. 

#### /call

This API receives the ingame token of the given client, and is responsible for authorizing and performing the action related to "calling x" in a poker game (i.e. matching the highest bet, or going all in if lacking the chips to do so). The ingame token is first authorized, and if it is currently said user's turn in the game, the player's chips will be changed accordingly and the respective number of chips will be bet, and changes will immediately be evident both locally and in the respective databases. Furthermore, this will progress the game state accordingly. 

#### /change_chips

This API is only accessible to users with a valid admin token, and allows admin users to change the chips held in the bank of any currently registered user (including themselves). It receives the login token along with the targeted username and requested chips, and authenticates whether or not the requesting user holds an admin position in the users database. If correctly authenticated, this API directly changes the number of chips held in the bank of the targeted user.

#### /change_password

This API is only accessible to users with a valid admin token, and allows admin users to change the password of any currently registered user. It receives the login token along with the targeted username and requested password, and authenticates whether or not the requesting user holds an admin position in the users database. If correctly authenticated, this API directly changes the password of the targeted user.

#### /chat

This API is responsible for retrieving any messages posted in the chat box client-side and immediately formatting and broadcasting the message to all currently connected clients. This API receives the login token and chat content of the given user, and broadcasts the message if the login token is valid.

#### /check

This API is responsible for performing the "check" action in a running game, and receives the requesting user's ingame token. The "check" action in poker means the user performing the action has a bet currently equal to the highest bet on the table, and wishes to skip their turn without betting more chips. If the ingame token is properly authenticated and it is currently the requesting user's turn, the check API will skip the turn and broadcast the next turn via websocket.

#### /current_chips

This API receives the requesting user's ingame token, and responds with said user's current bet chips for the current round. This is used in the Actions.js client component to dynamically render the number of chips required for a user to "call". The "call" action in poker means the user performing the action wishes to match the highest bet currently on the table, or as much as they can if they require the chips to do so. 

#### /deposit

This API is responsible for allowing users to deposit their chips on hand (useable chips) into their chip bank, and receives the requesting user's login token and the number of chips they wish to deposit. If the token is correctly authenticated, the transaction is completed (unless the requested deposit is invalid). Furthermore, if a certain threshold of chips is reached in the chip bank, the respective "Wealthy" achievement is awarded to the user. 

#### /exit_game

This API is responsible for allowing a user currently in the game to exit the game. This API receives the user's game token, and if the token is correctly authenticated, the requesting user leaves the game. However, if a game is currently running and the user in question is in the game (i.e. has not yet folded), the user will instead be added to a stack of players to be removed from the game at the end of the game cycle, but will be allowed to continue their turn and keep their place in future games if they rejoin the game. If the user in question rejoins the game before their player character performing default actions (check or fold) folds the game, they will be able to control their character for the rest of the game. 

#### /fold

This API is responsible for allowing users to perform the "fold" action in the game, and receives the requesting user's ingame token. If the token is correctly authenticated and it is the requesting user's turn in-game, the user will fold, meaning they have forfeited for the given game cycle. This will remove the user from any side pots they were a part of, and deny them from winning any chips in the given game. If after folding only one non-folded user is left in the game, the game will conclude and start a new game. 

#### /force_logout

This API is only accessible to users with a valid admin token, and allows admin users to forcefully log out a user by username from the server. It receives the login token along with the targeted username, and authenticates whether or not the requesting user holds an admin position in the users database. If correctly authenticated, this API forcefully logs out the targeted user and removes them from the game if they are in one. 

#### /ingame_token

This API receives the requesting user's login token, and is used to distribute said user's ingame token from the database. The ingame token is used client-side to determine whether or not a user is in an ongoing game, and the specific API request is made only when the corresponding websocket event is received by the client. 

#### /join_game

This API is responsible for allowing a user to join or rejoin the game. In the case either the game is full or the requesting user does not have enough chips to play, the user is not barred from joining the game until both of these situations are resolved. The API receives the requesting user's login token, and if correctly authenticated, is given their game token. In the case a user wishes to rejoin the game (if the game is already running and the user has left the game while their playerslot still exists in the current game cycle) the ingame token is also distributed. 

#### /login

This API is responsible for authenticating any login requests made by users. As a result, the API receives the requesting user's submitted username and password, and responds with their login token if correctly authenticated. In the case the user in question is already logged in, this will deny the new login request until the user has been logged out either manually or automatically. 

#### /logout

This API is responsible for allowing users to log out of their account, and receives the requesting user's login token. If correctly authenticated (i.e. the login token is valid) the user will be removed from the hash map containing username-websocket connection entries, and will be removed from the game if they were in one. Furthermore, this API will manually remove the respective values from the corresponding game variables and data structures. 

#### /player_still_ingame

This API receives the requesting user's login token, and responds with a boolean integer value denoting whether or not the given user is in a game. This is used in the ReadyPlayers.js component to remove a user's game token in the case the user has been ejected from the game so that the correct elements can render for the client. 

#### /players

This API is responsible for individually formatting the cards held by all players in a game and sending a curated array of players and their respective cards. The API receives the requesting user's login token, and if correctly authenticated, responds with an array of all currently playing users and cards formatted to only show the requesting user's cards, leaving the rest blank or empty depending on the context. The cards are formatted on an individual basis server-side and not left to be obfuscated by the client, so that card info cannot be recovered through viewing network data.

#### /raise

This API is responsible for allowing users to perform the "raise" action in a game. The "raise" action involves the requesting user increasing their bet chips to be the new highest bet on the table, thereby artificially creating a new round of betting centered around the user that has raised. In the case that the requesting user does not have enough chips to raise, they will be allowed to push all-in through the raise action, although they could also do so by "calling". This API receives the requesting user's ingame token, and if correctly authenticated, will alter the corresponding server-side game variables respectively, and afterwards broadcast the next turn to the clients via websocket. 

#### /register

This API allows users to register a new account on the server. As a result, the API receives the submitted username and password. If the username does not already exist in the database, the new user is created. Currently, there is no lower limit for password length, but this can be easily changed server-side. If the new account is created, their data is added to the corresponding databases and the retroactively loaded achievements hash map. 

#### /show_chips_bank

This API is responsible for showing the number of chips currently held by the requesting user in their chip bank. As a result, this API receives the requesting user's login token and if correctly authenticated responds with their respective banked chips. 

#### /show_chips_useable

This API is responsible for showing the number of chips currently held by the requesting user on hand (i.e. useable chips). As a result, this API receives the requesting user's login token and if correctly authenticated responds with their respective useable chips. 

#### /toggle_game

This API is responsible for controlling the switch that determines when the game starts or stops. This is done by receiving the requesting user's game token, along with a boolean integer value denoting whether they are toggling on or off and another boolean integer value denoting whether they wish to start or stop the game. Essentially, if all currently seated players (minimum of 2) in the game have toggled on to start the game, the game will begin. Alternatively, if all players in the game have toggled on to stop the game, the game will stop on the next game cycle. 

#### /withdraw

This API allows a user to withdraw a number of chips from their chip bank into their useable chips. As a result, this API receives the requesting user's login token and the number of chips they wish to withdraw. As users cannot go into debt, they can only withdraw up to the number of chips they currently own in the bank, assuming their login token has been correctly authenticated. By default, all new users start with 10000 chips in the bank. In the case the user has more than 10000 chips in the bank and withdraws chips that lowers the number of banked chips below this threshold, the user will be stripped of their "Wealthy" achievement. 

# Deck of Cards and Player Sorting

The Deck class was created to hold a series of class member functions that deal with permuting the deck of cards, dealing out cards, initializing, building and sorting player card data and comparing different sets of card combinations. As a result, the server initializes an object of class Deck, and at the beginning of every game uses said object to rebuild and repopulate both player card data and in-game variables.

Essentially, all calculations that can be done ahead of time are done in a first round setup, including building a sorted array of which players will win solely based on hand-board combination strength. Any calculations that are done on the condition of a specific event are performed dynamically when the event arises (ex. when a user folds, said user is removed from the sorted array of potential winners).

### Deck Class Member Methods

#### buildDeck()

The buildDeck method is responsible for creating the unmodified array of 52 cards that compose a deck of cards. This is done simply by using an O(n^2) time complexity loop to loop through all possible number and suit combinations. Finally, the populated array is returned and is used as the base for all future deck permutations. It is important to note that all future deck permutations perform 1-level deep copies (essentially a deep copy for the 1-dimensional deck array) using the spread operator, and the initial deck is never affected. 

**Note:** The numbers are displayed in hexadecimal, where 1 is used to denote an "ace", A is used to denote a "10", and onwards. In later calculations, particularly those used to calculate valid straights and card-board combination ranking, an ace can be shown as either 1 or E (consider D denotes a "King"), depending on the circumstance. 

#### dealBoard(shuffledDeck, board)
<ul>
    <li>shuffledDeck - permuted (randomized) deck of cards returned by the shuffleDeck method</li>
    <li>board - initialized board array (begins as empty array)</li>
</ul>

The dealBoard method is responsible for dealing 5 cards from the shuffled deck onto the board array, thereby populating the board array with 5 pseudo-random cards. This method is called once per game, and primes the board array for calculations used to rank all player hand-board combinations and sort them in order of combination tier. 

It is important to note that this means that the cards placed on the board are pre-determined at the start of each game based on the results of this method. However, the results of said calculations are only known to the server, and are revealed to the client only when the game state to do so has been reached, meaning competitive integrity is maintained between players.

#### displayHandStrength(players)
<ul>
    <li>players - array of player objects - each player object contains an individual player's username, hand, hand strength and hand rank </li>
</ul>

The displayHandStrength method is used to return a sorted array of each player's hand strength (i.e. tier of hand-board combination) as displayable strings. The results of this array are curated by the server to cull the hand strength data of any users that have previously folded in the given game, and are then sent to the client at the end of a game to allow users to more easily understand the results of the game, if the showdown game state has been reached. 

#### handChecker(hand, board)
<ul>
    <li>hand - the two cards held in the hand array of a given user</li>
    <li>board - the five cards placed on the board array</li>
</ul>

The handChecker method is responsible for calculating the best possible hand-board combination held by a given user, and returning said data as easily sortable object parameters (tier of combination and the best 5 cards used to make said combination, set as hand_strength and high_rank respectively), which are then added to the respective player objects.

This method generates hash maps to sort the hand and board card data either based on a number to suit or frequency of number to number key-value paradigm (cardMap and numberMap respectively). The manipulated data stored in each hash map is then sent to a respective sub-function to efficiently determine which tier of combination best fits the given hand-board combination. In particular, the straight, flush and straight flush algorithms use the cardMap while the pair algorithms (handles all other tiers of combinations) use the numberMap. Essentially, calling this method will return an easily sortable set of object parameters to be used in later methods. 

#### initializePlayers(usernames, players)
<ul>
    <li>usernames - sorted array of usernames denoting each in-game player (sorted by player seat order)</li>
    <li>players - an empty array used to hold player objects</li>
</ul>

The initializePlayers method is responsible for initializing player objects for each username in the usernames array passed to the method. The players array is populated in a sorted order corresponding to the order of usernames in the passed array. Other methods will populate the currently empty parameters of each player object (i.e. the hand, hand_strength, and high_rank parameters).

#### multiHandChecker(board, players)
<ul>
    <li>board - the five cards placed on the board array</li>
    <li>players - array of player objects (hand and username parameters are populated, but hand_strength and high_rank at this point are empty strings)</li>
</ul>

The multiHandChecker is responsible for calling the handChecker method on all players in the given game, and thereby populating each player object's hand_strength and high rank parameters, corresponding to the tier of hand-board combination possessed and the best 5 cards used to make said combination.

#### multiHandSorter(players)
<ul>
    <li>players - array of player objects, containing all populated parameters from previously called methods</li>
</ul> 

The multiHandSorter method is responsible for building a sorted array of usernames based on the hand_strength and high_rank data of each player object. The array is first sorted on the tier of card combination (hand_strength) and then on an individual card basis if there exists a tie (high_rank). The resulting sorted array is returned to the server where it can be used to determine winners and distribute chips, and edited in the case any users fold mid-game. 

#### playCard(shuffledDeck)
<ul>
    <li>shuffledDeck - permuted (randomized) deck of cards returned by the shuffleDeck method</li>
</ul>

The playCard method is responsible for popping the last element of the permuted deck and returning the resulting card. This method results in a pseudo-random card from the deck, and is used to deal cards to player hands and to the board. 

#### shuffleDeck(deck)
<ul>
    <li>deck - unmodified deck of cards</li>
</ul>

The shuffleDeck method is responsible for first creating a 1-level deep copy of the unmodified deck of cards, and shuffling the new deck of cards in a pseudo-random manner. The deck is shuffled by looping through each index of the deck and using an indexed multiple of the random method from the Math library to swap two cards within the deck every loop, thereby creating a pseudo-random permutation of the deck of cards.

#### userFolds(folded_user, sorted_names)
<ul>
    <li>folded_user - user that has folded in the game</li>
    <li>sorted_names - sorted array of names in order of ability to win solely based on hand-board combination strength </li>
</ul>

The userFolds method is responsible for removing the user that has folded from the list of sorted usernames. This method also accounts for the case that the user in question is involved in a tie (meaning their entry in the sorted usernames array will be an array of usernames rather than a single username).

# SQLite3 Databases and Data Access Object (DAO)

The server initializes an object corresponding to the app data access object (DAO) class, which allows for interfacing with a SQL database in JavaScript through class member functions. These class member functions - run, get and all are responsible for editing or creating tables and table data, retrieving singular table entries and retrieving many table entries respectively. Another object is initialized corresponding to the repository class, and using the DAO object as a parameter, allows the server to create and call class member functions to directly interface with the respective SQL database using prepared statements. 

Two repository objects are initialized in the server, corresponding to the repository containing user data and the repository containing user achievement data. For a small scale database, it would be possible to hold both user and achievement data in the same repository but in separate tables, but they are kept separate for clarity. Most of the methods held in the repository class are self explained by name, and several are only used in testing scenarios, but some commonly used methods will be outlined below.  

### Commonly Used Repository Class Methods

#### addUser(username) - Achievements

The addUser method is used in the achievements repository to add a user into the achievements database. By default, all achievements are set to 0 (boolean false), and can be changed either automatically by passing the respective ingame threshold or manually through the particular server-side method.

#### getAll() - Users and Achievements

The getAll method is used both in the users and achievements repositories, and returns all entries of currently registered users. From the users database, this returns user data with passwords, hashed tokens, and chip values. From the achievements database, this returns user data with boolean bits representing achievements or the lack thereof. 

The achievements getAll method is used to preload the achievements hash map in the server on initial server load, but the users getAll method is only used for testing purposes.

#### getBy_(_) - Users

The getBy_ methods all allow for retrieval of a row corresponding to a given user's data based on the corresponding method that is called. For example, the getByLoginToken method returns a user's data searched by their login token, while the getByUsername returns a user's data searched by their username. The main use of multiple getBy_ methods allows for more efficient database lookup from different function contexts, but also further reduces any possible errors by requiring a specific key to send a corresponding valid server API request.

#### resetSequencing() - Users and Achievements

The resetSequencing method is used both in the users and achievements repositories, and is used in tandem with the deleteAllUsers method to completely clear a table in the corresponding database. This method must be used to correctly reset the auto incrementing primary key id, if the table is to be repopulated.

#### updateAchievement_(is_added, username) - Achievements

The updateAchievement_ methods are used to add or remove an achievement from the given user. The is_added argument is a boolean bit denoting whether to remove or add an achievement to the user in question (0 for remove, 1 for add). There is a different updateAchievement_ method for each achievement due to the nature of relational SQL databases and prepared statements, as SQL commands should not accept prepared statements in the form of column names by design. 

#### updateChips_(new_amount, username) - Users

The updateChips_ methods are used to update the chip values of the given user to the new_amount value received. These methods exist for both useable chips and banked chips (updateChipsUseable and updateChipsBank respectively) and are used server-side in tandem with the previous value of the chips_useable and chips_bank, as all server-side chip-related operations are done in relation to the previous chip value.