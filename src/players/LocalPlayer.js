/**
 * Author and copyright: Stefan Haack (https://shaack.com)
 * Repository: https://github.com/shaack/chess-console
 * License: MIT, see file 'LICENSE'
 */
const {COLOR, INPUT_EVENT_TYPE} = await import(`${node_modules}/cm-chessboard/src/Chessboard.js`)
const {Chess} = await import(`${node_modules}/chess.mjs/src/Chess.js`)
const {PromotionDialog} = await import(`${node_modules}/cm-chessboard/src/extensions/promotion-dialog/PromotionDialog.js`)
import {Player} from "./Player.js"

export class LocalPlayer extends Player {

    constructor(playfield, name, props) {
        super(playfield, name)
        this.props = {
            allowPremoves: false
        }
        Object.assign(this.props, props)
        this.premoves = []
        if (!this.playfield.chessboard.hasExtension(PromotionDialog)) {
            this.playfield.chessboard.addExtension(PromotionDialog)
        }
    }

    /**
     * The return value returns, if valid or if is promotion.
     * The callback returns the move.
     */
    validateMoveAndPromote(fen, squareFrom, squareTo, callback) {
        const tmpChess = new Chess(fen)
        let move = {from: squareFrom, to: squareTo}
        const moveResult = tmpChess.move(move)
        if (moveResult) {
            callback(moveResult)
            return true
        } else { // is a promotion?
            if (tmpChess.get(squareFrom) && tmpChess.get(squareFrom).type === "p") {
                const possibleMoves = tmpChess.moves({square: squareFrom, verbose: true})
                for (let possibleMove of possibleMoves) {
                    if (possibleMove.to === squareTo && possibleMove.promotion) {
                        this.playfield.chessboard.showPromotionDialog(squareTo, tmpChess.turn(), (event) => {
                            if (event.piece) {
                                move.promotion = event.piece.charAt(1)
                                callback(tmpChess.move(move))
                            } else {
                                callback(null)
                            }
                        })
                        return true
                    }
                }
            }
        }
        callback(null)
        return false
    }

    /**
     * Handles the events from cm-chessboard
     *
     * INPUT_EVENT_TYPE.moveDone
     * - validates Move, returns false, if not valid
     * - does promotion
     * - calls moveResponse()
     *
     * INPUT_EVENT_TYPE.moveStart
     * - allowed only the right color to move
     */
    chessboardMoveInputCallback(event, moveResponse) {
        // if player can make move, make, if not store as premove
        // const boardFen = this.chessConsole.components.board.chessboard.getPosition()
        const gameFen = this.chessboard.chess.fen()
        if (this.playfield.playerToMove() === this) {
            if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                return this.validateMoveAndPromote(gameFen, event.squareFrom, event.squareTo, (moveResult) => {
                    let result
                    if (moveResult) { // valid
                        result = moveResponse(moveResult)
                    } else { // not valid
                        result = moveResponse({from: event.squareFrom, to: event.squareTo})
                        this.premoves = []
                        this.updatePremoveMarkers()
                    }
                    if (result) {
                        if (!this.props.allowPremoves) {
                            this.chessboard.disableMoveInput()
                        }
                    }
                })
            } else if (event.type === INPUT_EVENT_TYPE.moveInputStarted) {
                if (this.chessConsole.state.plyViewed !== this.chessConsole.state.chess.plyCount()) {
                    this.chessConsole.state.plyViewed = this.chessConsole.state.chess.plyCount()
                    return false
                } else {
                    const possibleMoves = this.chessConsole.state.chess.moves({square: event.square})
                    if (possibleMoves.length > 0) {
                        return true
                    } else {
                        this.chessConsole.components.board.chessConsole.messageBroker.publish(CONSOLE_MESSAGE_TOPICS.illegalMove, {
                            move: {
                                from: event.squareFrom
                            }
                        })
                        return false
                    }
                }
            }
        } else {
            // premoves
            if (event.type === INPUT_EVENT_TYPE.validateMoveInput) {
                this.premoves.push(event)
                this.updatePremoveMarkers()
            }
            return true
        }
    }

    moveRequest(fen, moveResponse) {
        if (!this.contextMenuEvent) {
            this.chessConsole.components.board.chessboard.context.addEventListener("contextmenu", (event) => {
                event.preventDefault()
                if (this.premoves.length > 0) {
                    this.resetBoardPosition()
                    this.premoves = []
                    this.updatePremoveMarkers()
                }
            })
            this.contextMenuEvent = true
        }
        const color = this.chessConsole.state.chess.turn() === 'w' ? COLOR.white : COLOR.black
        if (!this.chessConsole.state.chess.gameOver()) {
            if (this.premoves.length > 0) {
                // premove
                const eventFromPremovesQueue = this.premoves.shift()
                this.updatePremoveMarkers()
                setTimeout(() => {
                    this.chessboardMoveInputCallback(eventFromPremovesQueue, moveResponse)
                }, 100)
                return true
            }
            // normal move
            this.chessConsole.components.board.chessboard.enableMoveInput(
                (event) => {
                    return this.chessboardMoveInputCallback(event, moveResponse)
                }, color
            )
        }
    }

    updatePremoveMarkers() {
        this.chessConsole.components.board.chessboard.removeMarkers(this.chessConsole.components.board.props.markers.premove)
        for (const premove of this.premoves) {
            this.chessConsole.components.board.chessboard.addMarker(this.chessConsole.components.board.props.markers.premove, premove.squareTo)
        }
    }

    resetBoardPosition() {
        this.chessConsole.components.board.chessboard.setPosition(this.chessConsole.state.chess.fen(), true)
    }

}
