import ace_clubs from './ace_of_clubs.png';
import two_clubs from './2_of_clubs.png';
import three_clubs from './3_of_clubs.png';
import four_clubs from './4_of_clubs.png';
import five_clubs from './5_of_clubs.png';
import six_clubs from './6_of_clubs.png';
import seven_clubs from './7_of_clubs.png';
import eight_clubs from './8_of_clubs.png';
import nine_clubs from './9_of_clubs.png';
import ten_clubs from './10_of_clubs.png';
import jack_clubs from './jack_of_clubs.png';
import queen_clubs from './queen_of_clubs.png';
import king_clubs from './king_of_clubs.png';
import ace_diamonds from './ace_of_diamonds.png';
import two_diamonds from './2_of_diamonds.png';
import three_diamonds from './3_of_diamonds.png';
import four_diamonds from './4_of_diamonds.png';
import five_diamonds from './5_of_diamonds.png';
import six_diamonds from './6_of_diamonds.png';
import seven_diamonds from './7_of_diamonds.png';
import eight_diamonds from './8_of_diamonds.png';
import nine_diamonds from './9_of_diamonds.png';
import ten_diamonds from './10_of_diamonds.png';
import jack_diamonds from './jack_of_diamonds.png';
import queen_diamonds from './queen_of_diamonds.png';
import king_diamonds from './king_of_diamonds.png';
import ace_hearts from './ace_of_hearts.png';
import two_hearts from './2_of_hearts.png';
import three_hearts from './3_of_hearts.png';
import four_hearts from './4_of_hearts.png';
import five_hearts from './5_of_hearts.png';
import six_hearts from './6_of_hearts.png';
import seven_hearts from './7_of_hearts.png';
import eight_hearts from './8_of_hearts.png';
import nine_hearts from './9_of_hearts.png';
import ten_hearts from './10_of_hearts.png';
import jack_hearts from './jack_of_hearts.png';
import queen_hearts from './queen_of_hearts.png';
import king_hearts from './king_of_hearts.png';
import ace_spades from './ace_of_spades.png';
import two_spades from './2_of_spades.png';
import three_spades from './3_of_spades.png';
import four_spades from './4_of_spades.png';
import five_spades from './5_of_spades.png';
import six_spades from './6_of_spades.png';
import seven_spades from './7_of_spades.png';
import eight_spades from './8_of_spades.png';
import nine_spades from './9_of_spades.png';
import ten_spades from './10_of_spades.png';
import jack_spades from './jack_of_spades.png';
import queen_spades from './queen_of_spades.png';
import king_spades from './king_of_spades.png';
import poker_table from './poker_table.png';
import player_slot from './player_slot.png';
import empty_card from './empty_card.png';
import card_back from './card_back.png';

const image_array = [['C1', ace_clubs], ['C2', two_clubs], ['C3', three_clubs], ['C4', four_clubs], ['C5', five_clubs], ['C6', six_clubs], ['C7', seven_clubs],
               ['C8', eight_clubs], ['C9', nine_clubs], ['CA', ten_clubs], ['CB', jack_clubs], ['CC', queen_clubs], ['CD', king_clubs], 
               ['D1', ace_diamonds], ['D2', two_diamonds], ['D3', three_diamonds], ['D4', four_diamonds], ['D5', five_diamonds], ['D6', six_diamonds], ['D7', seven_diamonds],
               ['D8', eight_diamonds], ['D9', nine_diamonds], ['DA', ten_diamonds], ['DB', jack_diamonds], ['DC', queen_diamonds], ['DD', king_diamonds],
               ['H1', ace_hearts], ['H2', two_hearts], ['H3', three_hearts], ['H4', four_hearts], ['H5', five_hearts], ['H6', six_hearts], ['H7', seven_hearts],
               ['H8', eight_hearts], ['H9', nine_hearts], ['HA', ten_hearts], ['HB', jack_hearts], ['HC', queen_hearts], ['HD', king_hearts], 
               ['S1', ace_spades], ['S2', two_spades], ['S3', three_spades], ['S4', four_spades], ['S5', five_spades], ['S6', six_spades], ['S7', seven_spades],
               ['S8', eight_spades], ['S9', nine_spades], ['SA', ten_spades], ['SB', jack_spades], ['SC', queen_spades], ['SD', king_spades], ['Table', poker_table],
               ['Player', player_slot], ['Empty', empty_card], ['Back', card_back]]

const images = new Map(image_array)

export default images;