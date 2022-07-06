class Deck {
    constructor() {}

    DECK_LENGTH = 52;

    buildDeck() {
        const deck = [];
        const suits = ["S", "H", "D", "C"];

        //numbers in hexadecimal
        const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D"];

        for (let i = 0; i < suits.length; i++){
            for (let j = 0; j < numbers.length; j++){
                deck.push(suits[i].concat(numbers[j]));
            }
        }

        return deck;
    }

    shuffleDeck(deck) {
        let shuffledDeck = [...deck];

        for (let i = 0; i < this.DECK_LENGTH - 1; i++){
            let randomIndex = Math.floor(Math.random() * (this.DECK_LENGTH - i));

            //swap card in index i with card between indices i and end
            let tempHolder = shuffledDeck[i]; 
            shuffledDeck[i] = shuffledDeck[i + randomIndex];
            shuffledDeck[i + randomIndex] = tempHolder;
        }

        return shuffledDeck;
    }

    playCard(shuffledDeck) {
        return shuffledDeck.pop();
    }

    //parameters: usernames (string), players (object: hand, username, hand_strength, high_rank)
    //puts usernames into empty player objects
    //makes players an empty array
    initializePlayers(usernames, players) {
        players.length = 0

        for (let username of usernames) {
            players.push({
                hand: [],
                username: username,
                hand_strength: '',
                high_rank: ''
            })
        }
    }

    //assumes players object has empty array hand, username, empty string high_rank, empty string hand_strength
    dealHands(shuffledDeck, players) {
        for (let player of players) {
            player.hand.push(this.playCard(shuffledDeck))
            player.hand.push(this.playCard(shuffledDeck))
        }
    }

    //initializes entire board, only part is shown at a time to client
    dealBoard(shuffledDeck, board) {
        board.length = 0
        
        for (let i = 0; i < 5; i++) {
            board.push(this.playCard(shuffledDeck))
        }
    }

    handChecker(hand, board) {
        let playableCards = board.concat(hand)
        playableCards.sort()

        //maps numbers to suits
        const cardMap = new Map()

        //maps frequency to numbers
        const numberMap = new Map()
        
        //initialization of cardMap
        playableCards.forEach(function (card, index) {
            if (cardMap.has(card[0])) {
                cardMap.get(card[0]).push(card[1])
            }
            else {
                cardMap.set(card[0], [card[1]])
            }
        })

        //initialization of numberMap, aces are treated as high
        playableCards.forEach(function (card, index) {
            //aces are treated as high
            card = card.replace('1', 'E')

            if (numberMap.has(card[1])) {
                numberMap.set(card[1], numberMap.get(card[1]) + 1) 
            }
            else {
                numberMap.set(card[1], 1)
            }
        })

        //only use if flush is already existing, returns highest number (hex) if true, empty string otherwise
        function straightFlushChecker(cardMap) {
            let high_rank = ""

            for (const suit of cardMap.keys()) {
                if (cardMap.get(suit).length >= 5) {
                    let ace_exists = false
                    let straight_counter = 1
                    let high_ace = false
                    let last_rank = cardMap.get(suit)[0]

                    cardMap.get(suit).forEach(function (rank, index) {
                        if (rank === '1') {
                            ace_exists = true
                        }

                        if (parseInt(rank, 16) === parseInt(last_rank, 16) + 1) {
                            straight_counter += 1

                            //if ace and king exists, ace can be treated as high
                            if (ace_exists && rank === "D") {
                                straight_counter += 1
                                high_ace = true
                            }
                        }
                        else {
                            straight_counter = 1
                        }

                        if (straight_counter >= 5) {
                            if (high_ace) {
                                high_rank = "E"
                            }
                            else {
                                high_rank = rank
                            }
                        }

                        last_rank = rank
                    })
                }
            }

            return high_rank
        }

        //call to find 4ofaKind, full house, 3ofaKind, 2pair, pair, or high card and the corresponding ranks.
        function pairChecker(numberMap) {
            let pair = false
            let pairs = []

            let triplet = false
            let triplets = []

            let high_cards = []
            let fourOfAKind = false
            let fours = ""

            for (const rank of numberMap.keys()) {
                if (numberMap.get(rank) === 4) {
                    fourOfAKind = true
                    fours = rank
                }
                else if (numberMap.get(rank) === 2) {
                    pair = true
                    pairs.push(rank)
                }
                else if (numberMap.get(rank) === 3) {
                    triplet = true
                    triplets.push(rank)
                }
                else {
                    high_cards.push(rank)
                }
            }

            high_cards.sort()
            high_cards.reverse()

            triplets.sort()
            triplets.reverse()

            //solution to make full house from 2 triplets, pairs take lower rank triplet
            if (triplets.length > 1) {
                pairs.push(triplets[1])
                pair = true
            }

            pairs.sort()
            pairs.reverse()

            if (fourOfAKind) {
                //must add triplets and pairs to the pool of kicker
                high_cards = high_cards.concat(triplets).concat(pairs)
                high_cards.sort()
                high_cards.reverse()

                return {
                    high_rank: fours.concat(high_cards[0]),
                    hand_strength: "4"
                }
            }
            else if (pair && triplet) {
                return {
                    high_rank: triplets[0].concat(pairs[0]),
                    hand_strength: "32"
                }
            }
            else if (triplet) {
                return {
                    high_rank: triplets[0].concat(high_cards[0]).concat(high_cards[1]),
                    hand_strength: "3"
                }
            }
            else if (pairs.length > 1) {
                return {
                    high_rank: pairs[0].concat(pairs[1]).concat(high_cards[0]),
                    hand_strength: "22"
                }
            }
            else if (pair) {
                return {
                    high_rank: pairs[0].concat(high_cards[0]).concat(high_cards[1]).concat(high_cards[2]),
                    hand_strength: "2"
                }
            }
            else {
                return {
                    high_rank: high_cards[0].concat(high_cards[1]).concat(high_cards[2]).concat(high_cards[3]).concat(high_cards[4]),
                    hand_strength: "1"
                }
            }
        }

        function flushChecker(cardMap) {
            let flush = false
            let flushes = []

            for (const suit of cardMap.keys()) {
                if (cardMap.get(suit).length >= 5) {
                    //aces are treated as high aces, removes low ace in array, adds in high ace
                    if (cardMap.get(suit)[0] === '1') {
                        cardMap.get(suit).shift()
                        cardMap.get(suit).push('E')
                    }

                    flush = true
                    flushes = [...cardMap.get(suit)]
                }
            }

            if (flush) {
                flushes.reverse()
                return flushes[0].concat(flushes[1]).concat(flushes[2]).concat(flushes[3]).concat(flushes[4])
            }
            else {
                return ""
            }
        }

        function straightChecker(cardMap) {
            let all_ranks = []

            for (const suit of cardMap.keys()) {
                all_ranks = all_ranks.concat(cardMap.get(suit))
            }

            let set_ranks = [...new Set(all_ranks)]
            all_ranks = Array.from(set_ranks)
            all_ranks.sort()

            let high_rank = ""

            let ace_exists = false
            let straight_counter = 1
            let high_ace = false
            let last_rank = all_ranks[0]

            for (const rank of all_ranks) {
                if (rank === '1') {
                    ace_exists = true
                }

                if (parseInt(rank, 16) === parseInt(last_rank, 16) + 1) {
                    straight_counter += 1

                    //if ace and king exists, ace can be treated as high
                    if (ace_exists && rank === "D") {
                        straight_counter += 1
                        high_ace = true
                    }
                }
                else {
                    straight_counter = 1
                }

                if (straight_counter >= 5) {
                    if (high_ace) {
                        high_rank = "E"
                    }
                    else {
                        high_rank = rank
                    }
                }

                last_rank = rank
            }

            return high_rank
        }

        const pairResults = pairChecker(numberMap)
        const flushResults = flushChecker(cardMap)
        const straightResults = straightChecker(cardMap)

        if (flushResults != "") {
            const straightFlushResults = straightFlushChecker(cardMap)
            if (straightFlushResults != "") {
                return {
                    high_rank: straightFlushResults,
                    hand_strength: "SF"
                }
            }
            else if (pairResults.hand === "4" || pairResults.hand === "32") {
                return pairResults
            }
            else {
                return {
                    high_rank: flushResults,
                    hand_strength: "F"
                }
            }
        }
        else if (straightResults != "") {
            return {
                high_rank: straightResults,
                hand_strength: "S"
            }
        }
        else {
            return pairResults
        }
    }

    //attaches hand_strength and high_rank to each player object, should be empty beforehand
    multiHandChecker(board, players) {
        for (let player of players) {
            const hand_power = this.handChecker(player.hand, board)
            player.hand_strength = hand_power.hand_strength
            player.high_rank = hand_power.high_rank
        }
    }

    //sorts hands from strongest to weakest, returns array of names in order
    multiHandSorter(players) {
        //ranks the types of hands in order (strongest to weakest)
        const hand_rankings = ["SF", "4", "32", "F", "S", "3", "22", "2", "1"]

        function sortByHighRank(a, b) {
            if (a.high_rank < b.high_rank) {
                return -1
            }
            if (a.high_rank > b.high_rank) {
                return 1
            }
            return 0
        }

        //copy of players is made so that order of players is kept
        const players_mutable = players.map(param => ({...param}));
        console.log(players_mutable)

        //pre-sorting purely by highest_rank, easier for post-processing
        players_mutable.sort(sortByHighRank)
        players_mutable.reverse()

        //creates map from players to sort by hand type, strongest to weakest
        const player_map = new Map()
        let sorted_players = []
        for (const player of players_mutable) {
            if (player_map.has(player.hand_strength)) {
                player_map.get(player.hand_strength).push(player)
            }
            else {
                player_map.set(player.hand_strength, [player])
            }
        }

        for (const ranking of hand_rankings) {
            if (player_map.has(ranking)) {
                sorted_players = sorted_players.concat(player_map.get(ranking))
            }
        }
        
        //array of usernames based on sorted_players, including nested arrays for ties
        let sorted_names = [sorted_players[0].username]

        for (let i = 1; i < sorted_players.length; i++) {
            if (sorted_players[i].hand_strength === sorted_players[i-1].hand_strength && sorted_players[i].high_rank === sorted_players[i-1].high_rank) {
                if (Array.isArray(sorted_names[sorted_names.length - 1])) {
                    sorted_names[sorted_names.length - 1].push(sorted_players[i].username)
                }
                else {
                    sorted_names[sorted_names.length - 1] = [sorted_names[sorted_names.length - 1], sorted_players[i].username]
                }
            }
            else {
                sorted_names.push(sorted_players[i].username)
            }
        }

        return sorted_names
    }

    //removes user from sorted_names when given user folds, also parses subarrays for ties
    userFolds(folded_user, sorted_names) {
        const user_index = sorted_names.indexOf(folded_user)

        if (user_index > -1) {
            sorted_names.splice(user_index, 1)
        }
        else {
            for (let i = 0; i < sorted_names.length; i++) {
                if (Array.isArray(sorted_names[i])) {              
                    const sub_user_index = sorted_names[i].indexOf(folded_user)

                    if (sub_user_index > -1) {
                        sorted_names[i].splice(sub_user_index, 1)
                        if (sorted_names[i].length === 1) {
                            //
                            sorted_names[i] = sorted_names[i][0]
                        }
                    }
                }
            }
        }
    }

    //-----TESTING-----//
    //straight_flush test - hand2
    //const hand1 = ["C5", "D2"]
    //const hand2 = ["CA", "CB"]
    //const board = ["C6", "C7", "C8", "C9", "D5"]

    //four_of_a_kind test - hand2
    //const hand1 = ["C2", "SA"]
    //const hand2 = ["S3", "H3"]
    //const board = ["D2", "H2", "C3", "D3", "S2"]

    //full_house test - hand1
    //const hand1 = ["S1", "C1"]
    //const hand2 = ["D8", "CA"]
    //const board = ["C3", "C8", "CB", "D3", "S3"]

    //flush test - hand1
    //const hand1 = ["C2", "C1"]
    //const hand2 = ["C7", "CA"]
    //const board = ["C3", "C8", "CB", "D3", "S3"]

    //straight test - hand1
    //const hand1 = ["HB", "HA"]
    //const hand2 = ["C5", "CA"]
    //const board = ["D7", "C8", "C9", "S6", "S3"]

    //three_of_a_kind test - hand2
    //const hand1 = ["D3", "H3"]
    //const hand2 = ["D8", "S8"]
    //const board = ["CC", "C8", "H4", "D3", "S2"]

    //two_pair test - hand1
    //const hand1 = ["SB", "S5"]
    //const hand2 = ["H5", "H8"]
    //const board = ["C3", "C8", "CB", "D7", "S5"]

    //pair test - hand1
    //const hand1 = ["H8", "H2"]
    //const hand2 = ["S3", "CA"]
    //const board = ["C3", "C8", "HB", "D4", "HC"]

    //high_card test - hand2
    //const hand1 = ["H3", "H6"]
    //const hand2 = ["C9", "D1"]
    //const board = ["D2", "D7", "S4", "DD", "SB"]

    /*const hand1 = ["C8", "D6"]
    const hand2 = ["S7", "H7"]
    const hand3 = ["H3", "H6"]
    const hand4 = ["D8", "S6"]
    const hand5 = ["H8", "H6"]
    const hand6 = ["SC", "CA"]
    const board = ["D2", "D7", "S1", "DD", "SB"]

    let current_names = ["ylee", "Basil", "drgnslyr", "dragongx3", "dogwarrior", "benlarosa"]
    let current_hands = [hand1, hand2, hand3, hand4, hand5, hand6]
    let current_players = []

    for (let i = 0; i < 6; i++) {
        current_players.push({
            hand: current_hands[i],
            user: current_names[i],
            hand_strength: '',
            high_rank: ''
        })
    }

    multiHandChecker(board, current_players)
    const sorted_players = multiHandSorter(current_players)
    console.log(sorted_players)
    userFolds('benlarosa', sorted_players)
    console.log(sorted_players)
    userFolds('dogwarrior', sorted_players)
    console.log(sorted_players)
    userFolds('dragongx3', sorted_players)
    console.log(sorted_players)*/

}


//idea: create map of all hand + board combinations, later, sort based on rating of combination within each sub-bracket
//      then generate array of sorted combinations; pop out of array (using indexOf and splice) when given user folds,
//      return winner at end of game

/*let hand_results = handChecker(hand1, board)
hand_results.user = "ylee"
let hand_results2 = handChecker(hand2, board)
hand_results2.user = "basil"
hands_to_compare = []
hands_to_compare.push(hand_results)
hands_to_compare.push(hand_results2)

console.log(hand_results)
console.log(hand_results2)
console.log(handComparison(hands_to_compare))
*/
//-----------------//

module.exports = Deck