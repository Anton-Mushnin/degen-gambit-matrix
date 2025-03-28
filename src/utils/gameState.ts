import { zigZagZogABI } from "../ABIs/ZigZagZog.abi";
import { wagmiConfig } from "../config";
import { getPublicClient, multicall } from "@wagmi/core";

export interface GameState {
    gameNumber: string;
    roundNumber: string;
    gameTimestamp: number;
    roundTimestamp: number;
    hasGameEnded: boolean;
    hasPlayerCashedOut: boolean;
  }

export const getGameState = async (contractAddress: string, gameNumber: bigint, playerAddress: string): Promise<GameState> => {


    const contract = {
        address: contractAddress,
        abi: zigZagZogABI,
      } as const
  

      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'GameState',
            args: [gameNumber]
          },
          {
            ...contract,
            functionName: 'hasGameEnded',
            args: [gameNumber]
          },
          {
            ...contract,
            functionName: 'playerCashedOut',
            args: [gameNumber, playerAddress]
          },
        ],
      })
      return parseGameState(result, gameNumber)
    }


    export const parseGameState = (result: any[], gameNumber: bigint): GameState => {
        const results = result.map((r) => r.result);
        const [gameState, hasGameEnded, hasPlayerCashedOut] = results;
    console.log('parsing')
      return {
        gameNumber: gameNumber.toString(),
        gameTimestamp: Number(gameState[0]) * (1000),
        roundNumber: gameState[1].toString(),
        roundTimestamp: Number(gameState[2])  * (1000),
        hasGameEnded: hasGameEnded,
        hasPlayerCashedOut: hasPlayerCashedOut,
      };
    };


    export const getCurrentGameNumber = async (contractAddress: string): Promise<string> => {
        const contract = {
            address: contractAddress,
            abi: zigZagZogABI,
          } as const
        const publicClient = getPublicClient(wagmiConfig);
        const currentGameNumber = await publicClient.readContract({
            ...contract,
            functionName: 'currentGameNumber',
        })
        return currentGameNumber.toString()
}