/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console
 * License: MIT, see file 'LICENSE'
 */

export class ChessConsolePlayer {

    constructor(chessConsole, name) {
        this.chessConsole = chessConsole
        this.name = name
    }

    /**
     * Called, when the Console requests the next Move from a Player.
     * The Player should answer the moveRequest with a moveResponse.
     * The moveResponse then returns the move result, if no move result was returned, the move was not legal.
     * @param fen current position
     * @param moveResponse a callback function to call as the moveResponse. Parameter is an object,
     * containing 'from' and `to`. Example: `moveResult = moveResponse({from: "e2", to: "e4"})`.
     */
    moveRequest(fen, moveResponse) {
    }

}
