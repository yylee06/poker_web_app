//var Datastore = require('nedb');
//var db = new Datastore();

function buildDeck(){
    const deck = [];
    const suits = ["S", "H", "D", "C"];
    const numbers = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    for (let i = 0; i < suits.length; i++){
        for (let j = 0; j < numbers.length; j++){
            deck.push(numbers[j] + suits[i]);
        }
    }

    return deck;
}

function shuffleDeck(deck /* datatype: Array */){
    const shuffledDeck = [...deck];
    deckLength = 52; //declared for clarity

    for (let i = 0; i < deckLength - 1; i++){
        randomIndex = Math.floor(Math.random() * (deckLength - i));

        //swap card in index i with card between indices i and end
        tempHolder = shuffledDeck[i]; 
        shuffledDeck[i] = shuffledDeck[i + randomIndex];
        shuffledDeck[i + randomIndex] = tempHolder;
    }

    return shuffledDeck;
}

function playCard(shuffledDeck /* datatype: Array */){
    return shuffledDeck.pop();
}


const deck = buildDeck();
const playingDeck = shuffleDeck(deck);

/*const card1 = playCard(playingDeck);
const card2 = playCard(playingDeck);
console.log(card1);
console.log(card2);
console.log(playingDeck.length);*/

/*for (let i = 0; i < deck.length; i++){
    console.log(deck[i]);
}*/
