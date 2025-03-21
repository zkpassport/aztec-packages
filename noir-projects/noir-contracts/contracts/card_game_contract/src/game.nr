use crate::cards::Card;
use dep::aztec::protocol_types::{address::AztecAddress, traits::{Deserialize, Serialize}};

global NUMBER_OF_PLAYERS: u32 = 2;
global NUMBER_OF_CARDS_DECK: u32 = 2;

pub struct PlayerEntry {
    address: AztecAddress,
    deck_strength: u32,
    points: u64,
}

impl PlayerEntry {
    pub fn is_initialized(self) -> bool {
        !self.address.is_zero()
    }
}

global PLAYER_SERIALIZED_LEN: u32 = 3;

impl Deserialize<PLAYER_SERIALIZED_LEN> for PlayerEntry {
    fn deserialize(fields: [Field; PLAYER_SERIALIZED_LEN]) -> PlayerEntry {
        let address = AztecAddress::from_field(fields[0]);
        let deck_strength = fields[1] as u32;
        let points = fields[2] as u64;

        PlayerEntry { address, deck_strength, points }
    }
}

impl Eq for PlayerEntry {
    fn eq(self, other: PlayerEntry) -> bool {
        self.address.eq(other.address)
            & self.deck_strength.eq(other.deck_strength)
            & self.points.eq(other.points)
    }
}

global PLAYABLE_CARDS: u32 = 4;

pub struct Game {
    players: [PlayerEntry; NUMBER_OF_PLAYERS],
    rounds_cards: [Card; PLAYABLE_CARDS],
    started: bool,
    finished: bool,
    claimed: bool,
    current_player: u32,
    current_round: u32,
}

global GAME_SERIALIZED_LEN: u32 = 15;

impl Serialize<GAME_SERIALIZED_LEN> for Game {
    fn serialize(game: Game) -> [Field; GAME_SERIALIZED_LEN] {
        [
            game.players[0].address.to_field(),
            game.players[0].deck_strength as Field,
            game.players[0].points as Field,
            game.players[1].address.to_field(),
            game.players[1].deck_strength as Field,
            game.players[1].points as Field,
            game.rounds_cards[0].to_field(),
            game.rounds_cards[1].to_field(),
            game.rounds_cards[2].to_field(),
            game.rounds_cards[3].to_field(),
            game.started as Field,
            game.finished as Field,
            game.claimed as Field,
            game.current_player as Field,
            game.current_round as Field,
        ]
    }
}

impl Deserialize<GAME_SERIALIZED_LEN> for Game {
    fn deserialize(fields: [Field; GAME_SERIALIZED_LEN]) -> Game {
        let player1 = PlayerEntry::deserialize([fields[0], fields[1], fields[2]]);
        let player2 = PlayerEntry::deserialize([fields[3], fields[4], fields[5]]);

        let players = [player1, player2];
        let rounds_cards = [
            Card::from_field(fields[6]),
            Card::from_field(fields[7]),
            Card::from_field(fields[8]),
            Card::from_field(fields[9]),
        ];
        Game {
            players,
            rounds_cards,
            started: fields[10] as bool,
            finished: fields[11] as bool,
            claimed: fields[12] as bool,
            current_player: fields[13] as u32,
            current_round: fields[14] as u32,
        }
    }
}

impl Game {
    pub fn add_player(&mut self, player_entry: PlayerEntry) -> bool {
        let mut added = false;

        for i in 0..NUMBER_OF_PLAYERS {
            let entry = self.players[i];
            if entry.is_initialized() {
                assert(!entry.address.eq(player_entry.address), "Player already in game");
            } else if !added {
                self.players[i] = player_entry;
                added = true;
            }
        }

        added
    }

    pub fn start_game(&mut self) {
        assert(!self.started, "Game already started");
        for i in 0..NUMBER_OF_PLAYERS {
            let entry = self.players[i];
            assert(entry.is_initialized(), "Game not full");
        }
        let sorted_by_deck_strength = self.players.sort_via(|a: PlayerEntry, b: PlayerEntry| {
            a.deck_strength < b.deck_strength
        });
        self.players = sorted_by_deck_strength;
        self.started = true;
    }

    pub fn current_player(self) -> PlayerEntry {
        assert(self.started, "Game not started");
        assert(!self.finished, "Game finished");
        self.players[self.current_player]
    }

    pub fn winner(self) -> PlayerEntry {
        assert(self.finished, "Game not finished");
        let mut winner = self.players[0];
        for i in 1..NUMBER_OF_PLAYERS {
            let entry = self.players[i];
            if entry.points > winner.points {
                winner = entry;
            }
        }
        winner
    }

    pub fn play_card(&mut self, card: Card) {
        assert(self.started, "Game not started");
        assert(!self.finished, "Game finished");

        let round_offset = self.current_round * NUMBER_OF_PLAYERS;

        self.rounds_cards[round_offset + self.current_player] = card;
        self.current_player = (self.current_player + 1) % NUMBER_OF_PLAYERS;

        if self.current_player == 0 {
            self._finish_round();
        }
    }

    fn _finish_round(&mut self) {
        let round_offset = self.current_round as u32 * NUMBER_OF_PLAYERS;
        self.current_round += 1;

        let mut winner_index = 0;
        let mut winner_strength = 0;
        let mut round_points = 0;

        for i in 0..NUMBER_OF_PLAYERS {
            let card = self.rounds_cards[round_offset + i];
            round_points += (card.points as u64);
            if card.strength > winner_strength {
                winner_strength = card.strength;
                winner_index = i;
            }
        }

        self.players[winner_index].points += round_points;
        if self.current_round == NUMBER_OF_CARDS_DECK {
            self.finished = true;
        }
    }
}
