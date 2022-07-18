import check from './check.mp3'
import deal_card from './deal_card.mp3'
import deal_hand from './deal_hand.mp3'
import deal_flop from './deal_flop.mp3'
import new_message from './new_message.mp3'
import play_chips from './play_chips.mp3'
import your_turn from './your_turn.mp3'

const sound_array = [['check', check], ['deal_card', deal_card], ['deal_hand', deal_hand], ['deal_flop', deal_flop], ['new_message', new_message], ['play_chips', play_chips], ['your_turn', your_turn]]

const audiofiles = new Map(sound_array)

export default audiofiles;