import { custom } from "viem";
import styles from "./ZigZagZog.module.css";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createWalletClient, WalletClient } from "viem";
import { thirdwebClientId, viemG7Testnet } from "../../config";
import { useActiveAccount, useConnectModal } from 'thirdweb/react';
import { useEffect, useState } from "react";
import { createThirdwebClient } from "thirdweb";
import { 
    getZigZagZogConstants,
    getZigZagZogInfo,
    buyPlays,
    parseZigZagZogInfo,
    parseZigZagZogConstants,
    getPlayerState,
    Commitment,
    revealChoices,
    parsePlayerState
} from "../../utils/zigZagZog";
import { commitChoices, ShapeSelection } from "../../utils/signing";
import ShapeSelector from "./ShapeSelector";

export const ZIG_ZAG_ZOG_ADDRESS = '0xc193Dc413358067B4D15fF20b50b59A9421eD1CD'
// export const ZIG_ZAG_ZOG_ADDRESS = '0xA05C355eD4EbA9f20E43CCc018AD041E5E3BEa13'

const ZigZagZog = () => {
    const activeAccount = useActiveAccount();
    const { connect } = useConnectModal();
    const client = createThirdwebClient({ clientId: thirdwebClientId });

    const [isCommitPhase, setIsCommitPhase] = useState(false)
    const [isRevealPhase, setIsRevealPhase] = useState(false)
    const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined)
    const [commitment, setCommitment] = useState<Commitment | undefined>(undefined)
    const [selected, setSelected] = useState<ShapeSelection>({circles: BigInt(0), squares: BigInt(0), triangles: BigInt(0)})

    useEffect(() => {
        if (!activeAccount) {
            connect({client});
        }
      }, [activeAccount, connect, client]);

    const buyPlaysMutation = useMutation({
        mutationFn: async () => {
            if (!gameState.data || !activeAccount?.address) {
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
            //TODO: buyPlays in current game if it's ongoing
            const currentGameIsActive = false //gameState.data?.parsedState.hasGameEnded === false
            const hash = await buyPlays(ZIG_ZAG_ZOG_ADDRESS, BigInt(10000), _client, currentGameIsActive ? gameState.data.parsedState.currentGameNumber : gameState.data.parsedState.currentGameNumber + BigInt(1))
            return hash
        },
        onSuccess: async () => {
            await gameState.refetch()
            await playerState.refetch()
        }
    })

    const gameConstants = useQuery({
        queryKey: ["gameConstants"],
        queryFn: async () => {
            const constants = await getZigZagZogConstants(ZIG_ZAG_ZOG_ADDRESS)
            const parsedConstants = parseZigZagZogConstants(constants)
            return parsedConstants
        },
        refetchInterval: false,
    })

    const gameState = useQuery({
        queryKey: ["gameState", Number(gameConstants.data?.commitDuration)],
        queryFn: async () => {
            if (!gameConstants.data) {
                return
            }
            const state = await getZigZagZogInfo(ZIG_ZAG_ZOG_ADDRESS)
            const parsedState = parseZigZagZogInfo(state)           
            return {parsedState}
        },
        enabled: gameConstants.data !== undefined
    });

    const playerState = useQuery({
        queryKey: ["playerState", Number(gameState.data?.parsedState.currentGameNumber), Number(gameState.data?.parsedState.roundNumber), activeAccount?.address],
        queryFn: async () => {
            if (!gameState.data || !activeAccount?.address) {
                return
            }
            const state = await getPlayerState(ZIG_ZAG_ZOG_ADDRESS, activeAccount?.address, gameState.data?.parsedState.currentGameNumber, gameState.data?.parsedState.roundNumber)
            const parsedState = parsePlayerState(state)
            return parsedState
        },
        enabled: gameState.data !== undefined && activeAccount?.address !== undefined
    })
    
    const commitChoicesMutation = useMutation({
        mutationFn: async () => {
            if (!gameState.data || !activeAccount?.address) {
                return
            }
            // const shapes = {
            //     circles: BigInt(4),
            //     squares: BigInt(3),
            //     triangles: BigInt(3)
            // }

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

            const result = await commitChoices(selected, gameState.data.parsedState.roundNumber, gameState.data.parsedState.currentGameNumber, _client)
            return result
        },
        onSuccess: async (result: any) => {
            console.log("Commitment", result)
            setCommitment(result)
            // await gameState.refetch()
            await playerState.refetch()
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
        }
    })


    useEffect(() => {
        console.log("Game state and constants UE")
        console.log(gameState.data, gameConstants.data)
        const interval = setInterval(() => {
            if (gameState.data && gameConstants.data) {
                const commitDeadline = gameState.data.parsedState.roundTimestamp + gameConstants.data.commitDuration
                const now = Date.now()
                const remainingTime = commitDeadline - now
                const isCommitPhase = remainingTime > (0)
                const isRevealPhase = remainingTime < (0) && remainingTime > -gameConstants.data.revealDuration
                const timeLeft = Math.max(isCommitPhase ? remainingTime : isRevealPhase ? remainingTime + gameConstants.data.revealDuration : 0)
                setIsCommitPhase(isCommitPhase)
                setIsRevealPhase(isRevealPhase)
                setTimeLeft(Number(timeLeft))
            }
        }, 1000)
        return () => clearInterval(interval)
    }, [gameState.data, gameConstants.data])

    useEffect(() => {
        console.log(playerState.data)
    }, [playerState.data])





    return (
        <div className={styles.hStack}>
            <div className={styles.vStack}>
                {gameState.data && 'State OK'}
                {gameConstants.data && 'Constants OK'}
                <br />  
                {isCommitPhase && 'Commit Phase'}
                <br />  

                {isRevealPhase && 'Reveal Phase'}
                <br />  

                {timeLeft && `Time left: ${timeLeft}`}
                <br />
                <button onClick={() => buyPlaysMutation.mutate()}>Buy Plays</button>
                <button onClick={() => gameState.refetch()}>Refetch</button>
                <button onClick={() => commitChoicesMutation.mutate()}>Commit Choices</button>
                <button onClick={() => revealChoicesMutation.mutate()}>Reveal Choices</button>
                {playerState.data && (isCommitPhase || isRevealPhase || !gameState.data?.parsedState.hasGameEnded) && <ShapeSelector isCommitPhase={isCommitPhase || (!gameState.data?.parsedState.hasGameEnded && !isRevealPhase)} playsCount={Number(playerState.data?.survivingPlays)} selected={selected} onSelect={setSelected} />}
            </div>
        </div>
    )
}

export default ZigZagZog;