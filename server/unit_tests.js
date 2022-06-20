const Deck = require('./deck');

let playing_users = []
let playing_chips = []
let table_chips = []
let players_ingame = []
let all_in_users = []
let house_chips = 0
let all_ins = []
let side_pots = []

function arrayIsEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

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


//-----UNIT TESTING-----//

unit_tests_sidepots()

//UNIT TESTING - Side Pots

function unit_tests_sidepots() {
    function reset_globals() {
        playing_users.length = 0
        playing_chips.length = 0
        table_chips.length = 0
        players_ingame.length = 0
        all_in_users.length = 0
        house_chips = 0
        all_ins.length = 0
        side_pots.length = 0
    }

    //4 players 1 all-in
    function test1() {
        //final house chips value
        const VALUE1 = 2030
        //length of side pots array
        const VALUE2 = 1
        //pot size of side pot 1
        const VALUE3 = 0
        //participants of side pot 1
        const VALUE4 = ['Tester1', 'Tester2', 'Tester3']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(500)
        playing_chips.push(4500)
        playing_chips.push(3500)
        playing_chips.push(0)

        players_ingame = [1, 1, 1, 1]
        all_in_users = [0, 0, 0, 1]

        all_ins = [{bet_size: 500, player_index: 3}]
        house_chips = 30
        table_chips = [500, 500, 500, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE4)) {
                            console.log("Test 1 Success")
                        }
                        else {
                            console.log("Test1 Error: Side pots player indices not at correct value.")
                        }
                    }
                    else {
                        console.log("Test1 Error: Side pots pot size not at correct value.")
                    }
                }
                else {
                    console.log("Test1 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test1 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test1 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 2 all-in
    function test2() {
        //final house chips value
        const VALUE1 = 9000
        //length of side pots array
        const VALUE2 = 2
        //pot size of side pot 1
        const VALUE3 = 7500
        //pot size of side pot 2
        const VALUE4 = 0
        //participants of side pot 1
        const VALUE5 = ['Tester1', 'Tester2', 'Tester3']
        //participants of side pot 2
        const VALUE6 = ['Tester1', 'Tester2']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(5000)
        playing_chips.push(3500)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [1, 1, 1, 1]
        all_in_users = [0, 0, 1, 1]

        all_ins = [{bet_size: 3000, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 7000
        table_chips = [3000, 3000, 3000, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE5) && arrayIsEqual(side_pots[1].participants, VALUE6)) {
                            console.log("Test 2 Success")
                        }
                        else {
                            console.log("Test2 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test2 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test2 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test2 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test2 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 3 all-in
    function test3() {
        //final house chips value
        const VALUE1 = 2000
        //length of side pots array
        const VALUE2 = 3
        //pot size of side pot 1
        const VALUE3 = 7500
        //pot size of side pot 2
        const VALUE4 = 8000
        //pot size of side pot 3
        const VALUE5 = 500
        //participants of side pot 1
        const VALUE6 = ['Tester1', 'Tester2', 'Tester3']
        //participants of side pot 2
        const VALUE7 = ['Tester1', 'Tester2']
        //participants of side pot 3
        const VALUE8 = ['Tester1']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [1, 1, 1, 1]
        all_in_users = [0, 1, 1, 1]

        all_ins = [{bet_size: 7000, player_index: 1}, {bet_size: 3000, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 0
        table_chips = [7500, 7000, 3000, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4 && side_pots[2].pot_size === VALUE5) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE6) && arrayIsEqual(side_pots[1].participants, VALUE7) && arrayIsEqual(side_pots[2].participants, VALUE8)) {
                            console.log("Test 3 Success")
                        }
                        else {
                            console.log("Test3 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test3 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test3 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test3 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test3 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 4 all-in
    function test4() {
        //final house chips value
        const VALUE1 = 2000
        //length of side pots array
        const VALUE2 = 4
        //pot size of side pot 1
        const VALUE3 = 7500
        //pot size of side pot 2
        const VALUE4 = 8000
        //pot size of side pot 3
        const VALUE5 = 500
        //pot size of side pot 4
        const VALUE6 = 0
        //participants of side pot 1
        const VALUE7 = ['Tester1', 'Tester2', 'Tester3']
        //participants of side pot 2
        const VALUE8 = ['Tester1', 'Tester2']
        //participants of side pot 3
        const VALUE9 = ['Tester1']
        //participants of side pot 4
        const VALUE10 = []

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [1, 1, 1, 1]
        all_in_users = [1, 1, 1, 1]

        all_ins = [{bet_size: 7500, player_index: 0}, {bet_size: 7000, player_index: 1}, {bet_size: 3000, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 0
        table_chips = [7500, 7000, 3000, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4 && side_pots[2].pot_size === VALUE5 && side_pots[3].pot_size === VALUE6) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE7) && arrayIsEqual(side_pots[1].participants, VALUE8) && arrayIsEqual(side_pots[2].participants, VALUE9) && arrayIsEqual(side_pots[3].participants, VALUE10)) {
                            console.log("Test 4 Success")
                        }
                        else {
                            console.log("Test4 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test4 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test4 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test4 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test4 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 1 all-in 1 fold
    function test5() {
        //final house chips value
        const VALUE1 = 2750
        //length of side pots array
        const VALUE2 = 1
        //pot size of side pot 1
        const VALUE3 = 0
        //participants of side pot 1
        const VALUE4 = ['Tester2', 'Tester3']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [0, 1, 1, 1]
        all_in_users = [0, 0, 0, 1]

        all_ins = [{bet_size: 500, player_index: 3}]
        house_chips = 1000
        table_chips = [250, 500, 500, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE4)) {
                            console.log("Test 5 Success")
                        }
                        else {
                            console.log("Test5 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test5 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test5 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test5 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test5 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 1 all-in 2 fold
    function test6() {
        //final house chips value
        const VALUE1 = 1600
        //length of side pots array
        const VALUE2 = 1
        //pot size of side pot 1
        const VALUE3 = 2500
        //participants of side pot 1
        const VALUE4 = ['Tester3']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [0, 0, 1, 1]
        all_in_users = [0, 0, 0, 1]

        all_ins = [{bet_size: 500, player_index: 3}]
        house_chips = 500
        table_chips = [100, 0, 3000, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE4)) {
                            console.log("Test 6 Success")
                        }
                        else {
                            console.log("Test6 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test6 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test6 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test6 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test6 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 2 all-in 1 fold
    function test7() {
        //final house chips value
        const VALUE1 = 2500
        //length of side pots array
        const VALUE2 = 2
        //pot size of side pot 1
        const VALUE3 = 1500
        //pot size of side pot 2
        const VALUE4 = 2000
        //participants of side pot 1
        const VALUE5 = ['Tester1', 'Tester2', 'Tester3']
        //participants of side pot 2
        const VALUE6 = ['Tester1', 'Tester2']

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [0, 1, 1, 1]
        all_in_users = [0, 0, 1, 1]

        all_ins = [{bet_size: 1000, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 500
        table_chips = [2000, 2000, 1000, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE5) && arrayIsEqual(side_pots[1].participants, VALUE6)) {
                            console.log("Test 7 Success")
                        }
                        else {
                            console.log("Test7 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test7 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test7 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test7 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test7 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 2 all-in 2 fold
    function test8() {
        //final house chips value
        const VALUE1 = 1000
        //length of side pots array
        const VALUE2 = 2
        //pot size of side pot 1
        const VALUE3 = 250
        //pot size of side pot 2
        const VALUE4 = 0
        //participants of side pot 1
        const VALUE5 = ['Tester3']
        //participants of side pot 2
        const VALUE6 = []

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [0, 0, 1, 1]
        all_in_users = [0, 0, 1, 1]

        all_ins = [{bet_size: 750, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 0
        table_chips = [0, 0, 750, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE5) && arrayIsEqual(side_pots[1].participants, VALUE6)) {
                            console.log("Test 8 Success")
                        }
                        else {
                            console.log("Test8 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test8 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test8 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test8 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test8 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 3 all-in 1 fold
    function test9() {
        //final house chips value
        const VALUE1 = 9600
        //length of side pots array
        const VALUE2 = 3
        //pot size of side pot 1
        const VALUE3 = 8000
        //pot size of side pot 2
        const VALUE4 = 500
        //pot size of side pot 3
        const VALUE5 = 0
        //participants of side pot 1
        const VALUE6 = ['Tester1', 'Tester2']
        //participants of side pot 2
        const VALUE7 = ['Tester1']
        //participants of side pot 3
        const VALUE8 = []


        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [1, 1, 0, 1]
        all_in_users = [1, 1, 0, 1]

        all_ins = [{bet_size: 7500, player_index: 0}, {bet_size: 7000, player_index: 1}, {bet_size: 3000, player_index: 3}]
        house_chips = 100
        table_chips = [7500, 7000, 500, 3000]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4 && side_pots[2].pot_size === VALUE5) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE6) && arrayIsEqual(side_pots[1].participants, VALUE7) && arrayIsEqual(side_pots[2].participants, VALUE8)) {
                            console.log("Test 9 Success")
                        }
                        else {
                            console.log("Test9 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test9 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test9 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test9 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test9 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    //4 players 2 all-in 2 fold (edge case)
    function test10() {
        //final house chips value
        const VALUE1 = 1000
        //length of side pots array
        const VALUE2 = 2
        //pot size of side pot 1
        const VALUE3 = 0
        //pot size of side pot 2
        const VALUE4 = 0
        //participants of side pot 1 (only due to calculations with 0, this is fine)
        const VALUE5 = ['Tester1', 'Tester2', 'Tester3', 'Tester4']
        //participants of side pot 2
        const VALUE6 = []

        playing_users.push('Tester1')
        playing_users.push('Tester2')
        playing_users.push('Tester3')
        playing_users.push('Tester4')
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)
        playing_chips.push(0)

        players_ingame = [0, 0, 1, 1]
        all_in_users = [0, 0, 1, 1]

        all_ins = [{bet_size: 500, player_index: 2}, {bet_size: 500, player_index: 3}]
        house_chips = 0
        table_chips = [0, 0, 500, 500]
        calculateSidePots()

        if (house_chips === VALUE1) {
            if (table_chips.reduce((a, b) => a + b, 0) === 0) {
                if (side_pots.length === VALUE2) {
                    if (side_pots[0].pot_size === VALUE3 && side_pots[1].pot_size === VALUE4) {
                        if (arrayIsEqual(side_pots[0].participants, VALUE5) && arrayIsEqual(side_pots[1].participants, VALUE6)) {
                            console.log("Test 10 Success")
                        }
                        else {
                            console.log("Test10 Error: Side pots player indices not at correct values.")
                        }
                    }
                    else {
                        console.log("Test10 Error: Side pots pot sizes not at correct values.")
                    }
                }
                else {
                    console.log("Test10 Error: Side pots array not at correct length.")
                }
            }
            else {
                console.log("Test10 Error: Table chips not reset correctly to 0.")
            }
        }
        else {
            console.log("Test10 Error: House chips not at correct value.")
        }

        reset_globals()
    }

    console.log("-----Side Pots Calculation Unit Testing-----")
    test1()
    test2()
    test3()
    test4()
    test5()
    test6()
    test7()
    test8()
    test9()
    test10()
}