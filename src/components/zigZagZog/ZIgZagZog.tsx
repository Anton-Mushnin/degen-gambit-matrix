import styles from "./ZigZagZog.module.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWalletClient, custom, WalletClient } from "viem";
import { thirdwebClientId, viemG7Testnet } from "../../config";
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { useEffect, useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { getZigZagZogConstants } from "../../utils/contractInfo";
import { getGameAndRoundState } from "../../utils/gameAndRoundState";
import { getCurrentGameNumber, getGameState } from "../../utils/gameState";
import { buyPlays, claimWinning, Commitment, revealChoices } from "../../utils/zigZagZog";
import { commitChoices } from "../../utils/signing";
import { ShapeSelection } from "../../utils/signing";
import ShapeSelector from "./ShapeSelector";
import { canClaim, getRounds, getShareInfo } from "../../utils/playerState";
import Navbar from "./Navbar";
import Rounds from "./Rounds";
// export const ZIG_ZAG_ZOG_ADDRESS = '0xc193Dc413358067B4D15fF20b50b59A9421eD1CD'
// export const ZIG_ZAG_ZOG_ADDRESS = '0xA05C355eD4EbA9f20E43CCc018AD041E5E3BEa13'
// export const ZIG_ZAG_ZOG_ADDRESS = '0xc2dc3596f6194dBBc3f9c2fB9Cc1547F4A92aa76' stuck because one player plays one shape
// export const ZIG_ZAG_ZOG_ADDRESS = '0xD0DD649939D4d6C5D0B4b15eDdF9dF4EE48eEC2F' 1 1 0 vs 0 1 1 stuck because commit and buyPlays define differently what ended game is
// export const ZIG_ZAG_ZOG_ADDRESS = '0x487a366Ed27F5F7D6ed1756B8972B23793Ce6B1d' 0 0 10 vs 0 0 10
export const ZIG_ZAG_ZOG_ADDRESS = '0x8EC5D6c9E1E1a4172BAe81660Da4ae2Ae8DE42bc'


const ZigZagZog = () => {
    const activeAccount = useActiveAccount();
    const { connect } = useConnectModal();
    const client = createThirdwebClient({ clientId: thirdwebClientId });
    const [commitment, setCommitment] = useState<Commitment | undefined>(undefined)
    const [selected, setSelected] = useState<ShapeSelection>({circles: BigInt(0), squares: BigInt(0), triangles: BigInt(0)})

    useEffect(() => {
        if (!activeAccount) {
            connect({client});
        }
      }, [activeAccount, connect, client]);

    const buyPlaysMutation = useMutation({
        mutationFn: async () => {
            if (!currentGameState.data || !activeAccount?.address || !currentGameNumber.data || !currentGameAndRoundState.data) {
                return
            }
            let _client: WalletClient | undefined;
            if (window.ethereum && activeAccount?.address) {
                _client = createWalletClient({
                    account: activeAccount.address,
                    chain: viemG7Testnet,
                    transport: custom(window.ethereum)
                });
            }
            if (!_client) {
                throw new Error("No client found");
            }
            const gameToBuyIn = currentGameAndRoundState.data.hasGameEnded ? Number(currentGameNumber.data) + 1 : Number(currentGameNumber.data)
            // const gameToBuyIn = Number(currentGameNumber.data) + 1
            const hash = await buyPlays(ZIG_ZAG_ZOG_ADDRESS, BigInt(10000), _client, BigInt(gameToBuyIn))
            return hash
        },
        onSuccess: async () => {
            await currentGameNumber.refetch()
            await currentGameState.refetch()
            await currentGameAndRoundState.refetch()
            // await playerState.refetch()
        }
    })





    

    const gameConstants = useQuery({
        queryKey: ["gameConstants"],
        queryFn: async () => {
            const constants = await getZigZagZogConstants(ZIG_ZAG_ZOG_ADDRESS)
            return constants
        },
        refetchInterval: false,
    })

    const currentGameNumber = useQuery({
        queryKey: ["currentGameNumber"],
        queryFn: async () => {
            const currentGameNumber = await getCurrentGameNumber(ZIG_ZAG_ZOG_ADDRESS)
            return currentGameNumber
        }
    })
    

    const currentGameState = useQuery({
        queryKey: ["gameState", currentGameNumber.data],
        queryFn: async () => {
            if (!currentGameNumber.data || !activeAccount?.address) {
                return
            }
            const state = await getGameState(ZIG_ZAG_ZOG_ADDRESS, BigInt(currentGameNumber.data), activeAccount?.address)
            return state
        },
        enabled: currentGameNumber.data !== undefined && activeAccount?.address !== undefined
    });

    const queryClient = useQueryClient()

    const currentGameAndRoundState = useQuery({
        queryKey: ["gameAndRoundState", currentGameState.data, activeAccount?.address],
        queryFn: async () => {
            if (!gameConstants.data || !activeAccount?.address || !currentGameNumber.data) {
                return
            }
            const gameState = await getGameState(ZIG_ZAG_ZOG_ADDRESS, BigInt(currentGameNumber.data), activeAccount.address)
            const state = await getGameAndRoundState(ZIG_ZAG_ZOG_ADDRESS, gameState, gameConstants.data, activeAccount?.address)
            console.log('state', state)
            queryClient.invalidateQueries({queryKey: ["playerState"]})
            return state
        },
        enabled: gameConstants.data !== undefined && activeAccount?.address !== undefined && currentGameNumber.data !== undefined,
        refetchInterval: 10000,
    })
    


    useEffect(() => {
        console.log('currentGameAndRoundState', currentGameAndRoundState.data)
    }, [currentGameAndRoundState.data])



    useEffect(() => {
        if (currentGameNumber.data && currentGameAndRoundState.data?.activeRound) {
            // setSelected({circles: BigInt(0), squares: BigInt(0), triangles: BigInt(0)})
        }
    }, [currentGameNumber.data, currentGameAndRoundState.data?.activeRound])

    const playerState = useQuery({
        queryKey: ["playerState", currentGameNumber.data, activeAccount?.address],
        queryFn: async () => {
            if (!currentGameNumber.data || !activeAccount?.address || !currentGameAndRoundState.data) {
                return
            }

            const activeRound = currentGameAndRoundState.data?.activeRound
            const shareInfo = await getShareInfo(ZIG_ZAG_ZOG_ADDRESS, currentGameNumber.data, activeAccount?.address)

            const rounds = await getRounds(ZIG_ZAG_ZOG_ADDRESS, 
                                            currentGameNumber.data, 
                                            BigInt(activeRound), 
                                            activeAccount?.address)
            const survivingPlays = activeRound > 1 ? rounds[activeRound - 1 - 1].survivingPlays : shareInfo.purchasedPlays //1-based index
            const hasCommitted = rounds[activeRound - 1].playerCommitted
            const hasRevealed = rounds[activeRound - 1].playerRevealed
            // console.log('hasPlayerCashedOut', currentGameState.data?.hasPlayerCashedOut)
            // console.log('canClaim', currentGameAndRoundState.data.hasGameEnded, rounds[Number(currentGameState.data?.roundNumber) - 1].playerRevealed, rounds[Number(currentGameState.data?.gameNumber) - 1].survivingPlays > 0)
            let playerCanClaim = false
            try {
                playerCanClaim = (currentGameState.data && currentGameAndRoundState.data && !currentGameState.data.hasPlayerCashedOut) ? canClaim(rounds, currentGameState.data, currentGameAndRoundState.data) : false
            } catch (e) {
                console.log('playerCanClaimError', e)
            }
            return {rounds, survivingPlays, hasCommitted, hasRevealed, playerCanClaim, shareInfo}
        },
        enabled: currentGameNumber.data !== undefined && activeAccount?.address !== undefined && currentGameAndRoundState.data !== undefined,
    })

    
    const commitChoicesMutation = useMutation({
        mutationFn: async () => {
            if (!currentGameAndRoundState.data || !activeAccount?.address || !currentGameNumber.data) {
                return
            }
            if (totalShapes(selected) !== playerState.data?.survivingPlays) {
                return
            }

            let _client: WalletClient | undefined;
            console.log("Active account", activeAccount, window.ethereum)
            if (window.ethereum && activeAccount?.address) {
                console.log("Creating client")
                _client = createWalletClient({
                    account: activeAccount.address,
                    chain: viemG7Testnet,
                    transport: custom(window.ethereum)
                });
            }
            if (!_client) {
                throw new Error("No client found");
            }

            const result = await commitChoices(selected, BigInt(currentGameAndRoundState.data?.activeRound), BigInt(currentGameNumber.data), _client)
            return result
        },
        onSuccess: async (result: any) => {
            console.log("Commitment", result)
            setCommitment(result)
            await currentGameState.refetch()
            await currentGameAndRoundState.refetch()
            // await playerState.refetch()
        }
    })

    const revealChoicesMutation = useMutation({
        mutationFn: async () => {
            console.log("Revealing choices", commitment)
            if (!commitment) {
                return
            }
            let _client: WalletClient | undefined;
            if (window.ethereum && activeAccount?.address) {
                _client = createWalletClient({
                    account: activeAccount.address,
                    chain: viemG7Testnet,
                    transport: custom(window.ethereum)
                });
            }
            if (!_client) {
                throw new Error("No client found");
            }
            const hash = await revealChoices(ZIG_ZAG_ZOG_ADDRESS, _client, commitment)
            return hash
        },
        onSuccess: async () => {
            await currentGameState.refetch()
            await currentGameAndRoundState.refetch()
            // await playerState.refetch()
        }
    })


    // useEffect(() => {
    //     console.log("Game state and constants UE")
    //     console.log(gameState.data, gameConstants.data)
    //     const interval = setInterval(() => {
    //         if (gameState.data && gameConstants.data) {
    //             const commitDeadline = gameState.data.parsedState.roundTimestamp + gameConstants.data.commitDuration
    //             const now = Date.now()
    //             const remainingTime = commitDeadline - now
    //             const isCommitPhase = remainingTime > (0)
    //             const isRevealPhase = remainingTime < (0) && remainingTime > -gameConstants.data.revealDuration
    //             const timeLeft = Math.max(isCommitPhase ? remainingTime : isRevealPhase ? remainingTime + gameConstants.data.revealDuration : 0)
    //             setIsCommitPhase(isCommitPhase)
    //             setIsRevealPhase(isRevealPhase)
    //             setTimeLeft(Number(timeLeft))
    //         }
    //     }, 1000)
    //     return () => clearInterval(interval)
    // }, [gameState.data, gameConstants.data])

    // useEffect(() => {
    //     console.log(playerState.data)
    // }, [playerState.data])


    useEffect(() => {
        console.log({playerState: playerState.data, currentGameAndRoundState: currentGameAndRoundState.data, currentGameState: currentGameState.data})
    }, [playerState.data, currentGameAndRoundState.data, currentGameState.data])

    const claimWinningMutation = useMutation({
        mutationFn: async () => {
            if (!currentGameNumber.data || !activeAccount?.address) {
                return
            }
            let _client: WalletClient | undefined;
            if (window.ethereum && activeAccount?.address) {
                _client = createWalletClient({
                    account: activeAccount.address,
                    chain: viemG7Testnet,
                    transport: custom(window.ethereum)
                });
            }
            if (!_client) {
                throw new Error("No client found");
            }
            const tx = await claimWinning(ZIG_ZAG_ZOG_ADDRESS, BigInt(currentGameNumber.data), _client)
            return tx
        },
        onSuccess: async () => {
            await currentGameState.refetch()
            await currentGameAndRoundState.refetch()
            // await playerState.refetch()
        }
    })

    const totalShapes = (selected: ShapeSelection) => {
        return Number(selected.circles) + Number(selected.triangles) + Number(selected.squares)
    }



    return (
        <div className={styles.container}>
            <Navbar phase={currentGameAndRoundState.data?.isCommitPhase ? 'Commit' : currentGameAndRoundState.data?.isRevealPhase ? 'Reveal' : 'Idle'} timeLeft={currentGameAndRoundState.data?.timeLeft ?? 0} />
            <div className={styles.hStack}>
                <div className={styles.vStack}>
                    {currentGameAndRoundState.data?.canBuyPlays && playerState.data?.survivingPlays !== undefined && (playerState.data.survivingPlays < 1 || currentGameAndRoundState.data?.hasGameEnded) && (
                        <div className={styles.buyButton} onClick={() => buyPlaysMutation.mutate()}>{buyPlaysMutation.isPending ? 'Buying...' : 'Buy Plays'}</div>
                    )}

                    {playerState.data?.survivingPlays !== undefined && playerState.data.survivingPlays > 0 && !currentGameAndRoundState.data?.hasGameEnded && (
                        <ShapeSelector selected={selected} 
                            onSelect={setSelected} 
                            playsCount={playerState.data.survivingPlays} 
                            isCommitPhase={(currentGameAndRoundState.data?.isCommitPhase && !playerState.data?.hasCommitted) ?? false} 
                        // hasCommitted={playerState.data.rounds[currentGameAndRoundState.data?.activeRound].playerCommitted}
                        />)}
                    {currentGameAndRoundState.data?.isCommitPhase && !playerState.data?.hasCommitted && playerState.data?.survivingPlays !== undefined && playerState.data.survivingPlays > 0 && (
                        <div className={styles.commitButton} onClick={() => commitChoicesMutation.mutate()} style={{cursor: totalShapes(selected) === playerState.data?.survivingPlays ? 'pointer' : 'not-allowed'}}>
                            {commitChoicesMutation.isPending ? 'Committing...' : `${totalShapes(selected) === playerState.data?.survivingPlays ? 'Commit Choices' : `${-totalShapes(selected) + playerState.data?.survivingPlays} plays left`}`}
                        </div>
                        )}
                    {currentGameAndRoundState.data?.isRevealPhase && commitment && !playerState.data?.hasRevealed && (
                        <div className={styles.commitButton} onClick={() => revealChoicesMutation.mutate()}>{revealChoicesMutation.isPending ? 'Revealing...' : 'Reveal Choices'}</div>
                    )}
                    {playerState.data?.playerCanClaim && (
                        <div className={styles.buyButton} onClick={() => claimWinningMutation.mutate()}>{claimWinningMutation.isPending ? 'Claiming...' : 'Claim Winning'}</div>
                    )}
                    <div className={styles.debugInfo}>
                        {currentGameAndRoundState.data?.isRevealPhase && 'Reveal Phase'}
                    </div>
                    <div className={styles.debugInfo}>
                        {currentGameAndRoundState.data?.isCommitPhase && 'Commit Phase'}
                    </div>
                    <div className={styles.debugInfo}>
                        {!!currentGameAndRoundState.data?.timeLeft && `Time left: ${currentGameAndRoundState.data.timeLeft}ms`}
                    </div>

                </div>
                {/* <div className={styles.vStack}>
                    <button onClick={() => buyPlaysMutation.mutate()}>Buy Plays</button>
                    
                    </div> */}
            </div>
            <Rounds 
                rounds={playerState.data?.rounds && currentGameAndRoundState.data?.activeRound ? playerState.data?.rounds.slice(0, currentGameAndRoundState.data?.activeRound - (currentGameAndRoundState.data?.hasGameEnded ? 0 : 1)) : []} 
                shareInfo={playerState.data?.shareInfo} 
                hasGameEnded={currentGameAndRoundState.data?.hasGameEnded ?? false}
            />
        </div>
    )
}

export default ZigZagZog;