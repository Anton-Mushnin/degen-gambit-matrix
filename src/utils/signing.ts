import { g7Testnet, wagmiConfig } from "../config";
import { zigZagZogABI } from "../ABIs/ZigZagZog.abi";
import { ZIG_ZAG_ZOG_ADDRESS } from "../components/zigZagZog/ZIgZagZog";
import { getPublicClient } from "@wagmi/core";
import { WalletClient } from "viem";

export interface ShapeSelection {
    circles: bigint;
    squares: bigint;
    triangles: bigint;
  }

export const commitChoices = async (shapes: ShapeSelection, roundNumber: bigint, gameNumber: bigint, client: WalletClient) => {

    console.log("Commiting choices", shapes, gameNumber, roundNumber)
    if (!client.account) {
        throw new Error("No account provided");
    }

    try {
        const publicClient = getPublicClient(wagmiConfig);

      // Generate a random nonce
      const nonce = Math.floor(Math.random() * 1000000);

      // Get the domain data for EIP-712 typed data
      const {domain} = await publicClient.getEip712Domain({address: ZIG_ZAG_ZOG_ADDRESS});
      
      // Prepare the EIP-712 typed data message
      // The types must match the contract's expectations exactly
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          ChoicesMessage: [
            { name: 'nonce', type: 'uint256' },
            { name: 'gameNumber', type: 'uint256' },
            { name: 'roundNumber', type: 'uint256' },
            { name: 'numCircles', type: 'uint256' },
            { name: 'numSquares', type: 'uint256' },
            { name: 'numTriangles', type: 'uint256' }
          ]
        },
        primaryType: 'ChoicesMessage',
        domain: {
          name: domain.name,
          version: domain.version,
          chainId: Number(domain.chainId),
          verifyingContract: domain.verifyingContract
        },
        message: {
          nonce: nonce.toString(),
          gameNumber: gameNumber.toString(),
          roundNumber: roundNumber.toString(),
          numCircles: shapes.circles.toString(),
          numSquares: shapes.squares.toString(),
          numTriangles: shapes.triangles.toString()
        }
      };
      
      console.log('Signing typed data:', JSON.stringify(typedData, null, 2));
      
      // Sign using eth_signTypedData_v4 for EIP-712 compatibility
      const ethereum = window.ethereum;
      if (!ethereum) {
        throw new Error("No Ethereum provider found. Please install MetaMask or another compatible wallet.");
      }

      const signedMessage = await ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [client.account.address, JSON.stringify(typedData)]
      });
      
      
      console.log('Signed message:', signedMessage);

      try {


        const hash = await client.writeContract({
            account: client.account,
            address: ZIG_ZAG_ZOG_ADDRESS,
            abi: zigZagZogABI,
            functionName: 'commitChoices',
            args: [BigInt(gameNumber), BigInt(roundNumber), signedMessage],
            chain: g7Testnet,
          })

        console.log('Hash:', hash);
        
        // Store shapes and nonce for later reveal
        // localStorage.setItem(`commitment_${ZIG_ZAG_ZOG_ADDRESS}_${client.account.address}_${gameNumber}_${roundNumber}`, JSON.stringify({
        //   nonce,
        //   shapes
        // }));
    
        
        return { 
          nonce: nonce,
          shapes: shapes,
          gameNumber: gameNumber,
          roundNumber: roundNumber,
        };
      } catch (error: any) {
        // Check for specific error messages from the contract
        const errorMessage = error.message || '';
        
        if (errorMessage.includes("ZigZagZog.commitChoices: game has ended")) {          
          return { 
            success: false, 
            error: "Game has ended. Buy plays to start a new game." 
          };
        } else {
          // Re-throw other errors to be caught by outer try/catch
          throw error;
        }
      }
    } catch (error) {
      console.error("Error during commitment:", error);
      const errorMessage = error instanceof Error ? error.message : "Commitment failed";
      
      // Check for specific error patterns in regular errors as well
      if (typeof errorMessage === 'string' && 
          (errorMessage.includes("game has ended") || 
           errorMessage.includes("no remaining plays"))) {
        return { 
          success: false, 
          error: "Game has ended. Buy plays to start a new game." 
        };
      }
      
      return { success: false, error: errorMessage };
    }
  };