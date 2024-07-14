import {
  chunkString,
  decodeTCNtoUCI,
  getGameById,
  getMoveTimes,
  getPgnFromUCI,
} from '@/lib/utils';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/game/{id}:
 *   get:
 *     summary: Retrieve PGN for a game by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: ID of the game to retrieve
 *       - name: timestamp
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Whether to include move timestamps in the pgn
 *     description: Can retrieve a chess.com game PGN given the id with/without move timestamps
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *             example: |
 *               [Event "Live Chess"]
 *               [Site "Chess.com"]
 *               [Date "2024.07.08"]
 *               [White "MagnusCarlsen"]
 *               [Black "artooon"]
 *               [Result "1-0"]
 *               [ECO "C50"]
 *               [WhiteElo "3156"]
 *               [BlackElo "3113"]
 *               [TimeControl "180"]
 *               [EndTime "8:31:13 PDT"]
 *               [Termination "MagnusCarlsen won by resignation"]
 *               [SetUp "1"]
 *               [FEN "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]
 *
 *               1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d3 Bc5 5. Nc3 h6 6. Be3 Bxe3 7. fxe3 d6 8. O-O Be6 9. Nd5 Bxd5 10. exd5 Ne7 11. e4 O-O 12. Nh4 Ng6 13. Nf5 Ne7 14. Nxh6+ Kh7 15. Rxf6 gxf6 16. Qh5 Kg7 17. Rf1 Qe8 18. Nf5+ Nxf5 19. Qg4+ Kh7 20. Rxf5 1-0
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(req.url);
    const showTimestamp =
      url.searchParams.get('timestamp')?.toLowerCase() === 'true';

    const game = await getGameById(params.id);
    if (!game.game) return new NextResponse('Bad request', { status: 400 });
    const moveList = chunkString(game.game.moveList, 2);
    const decodedMoveList = moveList.map((move) => decodeTCNtoUCI(move));
    let moveTimes: number[] = [];
    if (showTimestamp)
      moveTimes = getMoveTimes(
        game.game.moveTimestamps,
        game.game.timeIncrement1,
        game.game.baseTime1
      );
    const pgn = getPgnFromUCI(decodedMoveList, game.game.pgnHeaders, moveTimes);
    const response = new NextResponse(pgn);
    response.headers.set('Content-type', 'text/plain');
    return response;
  } catch (e) {
    console.error(e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
