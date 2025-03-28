
import { zigZagZogABI } from "../ABIs/ZigZagZog.abi";
import { multicall } from "@wagmi/core";
import { wagmiConfig } from "../config";

export interface GameConstants {
    playCost: string;
    commitDuration: number;
    revealDuration: number;
  }
  
  
  export const getZigZagZogConstants = async (contractAddress: string): Promise<GameConstants> => {
  
      const contract = {
          address: contractAddress,
          abi: zigZagZogABI,
        } as const
  
        const result = await multicall(wagmiConfig, {
          contracts: [
            {
              ...contract,
              functionName: 'playCost',
            },
            {
              ...contract,
              functionName: 'commitDuration',
            },
            {
              ...contract,
              functionName: 'revealDuration',
            },
          ],
        })
        return parseZigZagZogConstants(result)
  }

  export const parseZigZagZogConstants = (result: any[]): GameConstants => {
    const results = result.map((r) => r.result);
    const [playCost, commitDuration, revealDuration] = results;

  return {
    playCost: playCost.toString(),
    commitDuration: Number(commitDuration) * 1000,
    revealDuration: Number(revealDuration) * 1000,
  };
};