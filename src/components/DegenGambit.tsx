import { MatrixTerminal } from "./MatrixTerminal";
import { contractAddress, privateKey, viemG7Testnet, wagmiConfig } from '../config';
import { spin, _accept } from "../utils/degenGambit";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { numbers } from "../config/symbols";
import Matrix from "./Matrix";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, WalletClient } from "viem";
import { custom } from "viem";
import { useMutation, useQueryClient } from "@tanstack/react-query";

declare global {
    interface Window {
        ethereum?: any;
    }
}


const AUTO_ACCEPT = true;

const DegenGambit = () => {
    const activeAccount = useActiveAccount();
    const [userNumbers, setUserNumbers] = useState<number[]>(numbers);
    const [isWin, setIsWin] = useState(false);
    const [outcome, setOutcome] = useState<number[]>([]); 


    const acceptMutation = useMutation({
        mutationKey: ['accept'],
        mutationFn: ({client}: {client: WalletClient}) => _accept(contractAddress, client),
        onSuccess: (data: any) => {
            console.log(data);
        },
    });

    useEffect(() => {
        queryClient.invalidateQueries({queryKey: ['isAccepting']});
    }, [acceptMutation.isPending]);

    const queryClient = useQueryClient();

    const handleInput = async (input: string): Promise<{output: string[], outcome?: bigint[], isPrize?: boolean}> => {
        switch (input) {
            case "getsome": {
                window.open(`https://getsome.game7.io?network=testnet&address=${activeAccount?.address}`, "_blank");
                return {output: []};
            }
            case input.match(/^spin( boost)?$/)?.input: {
                let _client: WalletClient | undefined;
                if (privateKey) {
                    _client = createWalletClient({
                        account: privateKeyToAccount(privateKey),
                        chain: wagmiConfig.chains[0],
                        transport: http()
                    })
                } else {
                    if (window.ethereum && activeAccount?.address) {
                        _client = createWalletClient({
                            account: activeAccount.address,
                            chain: viemG7Testnet,
                            transport: custom(window.ethereum)
                        });
                    }
                }
                if (!_client) {
                    return {output: ["No account selected"]};
                }
                
                // Execute the spin
                const spinResult = await spin(contractAddress, input === "spin boost", _client);
                if (spinResult.outcome) {
                    const outcomeValues = spinResult.outcome.map(item => numbers[Number(item)]);
                    setOutcome(outcomeValues);
                }
                
                setTimeout(() => {
                    setIsWin(!!spinResult.prize && (Number(spinResult.prize) > 0));
                }, 8000);

                setTimeout(() => {
                    setIsWin(false);
                    if (!!spinResult.prize && (Number(spinResult.prize) > 0) && AUTO_ACCEPT) {
                        acceptMutation.mutate({client: _client});
                        queryClient.invalidateQueries({queryKey: ['isAccepting']});
                    }
                }, 20000);

                return {
                    output: [spinResult.description],
                    outcome: spinResult.outcome ? [...spinResult.outcome.slice(0,3)] : undefined,
                    isPrize: spinResult.prize ? Number(spinResult.prize) > 0 : undefined
                }

            }
            case input.match(/^set \d+ \d+$/)?.input: {
                const [, indexStr, numberStr] = input.split(' ');
                const index = parseInt(indexStr);
                const number = parseInt(numberStr);
                
                if (index < 0 || index >= userNumbers.length) {
                    return {output: [`Invalid index. Must be between 0 and ${userNumbers.length - 1}`]};
                }
                
                const newNumbers = [...userNumbers];
                newNumbers[index] = number;
                setUserNumbers(newNumbers);
                return {output: ["Minor symbols:", newNumbers.slice(1, 16).join(', '), "Major symbols:", newNumbers.slice(-3).join(', ')]};
            }
            default: {
                return {output: [
                    "=== DEGEN GAMBIT COMMANDS ===",
                    "Game Flow:",
                    "  spin     - Spin the wheel",
                    "  spin boost - Spin the wheel with a boost",
                    "",
                    "Other:",
                    "  getsome  - Visit getsome.game7.io to get some tokens",
                    "  clear    - Clear the terminal (⌘K or Ctrl+K)",
                    "=============================",
                ],
                };
            }
        }
    }

    return (
        <div style={{ position: 'relative', width: '100%', maxHeight: '100%', height: '100%', paddingTop: '20px'}}>
            {isWin && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: 10
                }}>
                    <Matrix outcome={[1,1,1]} onClose={() => setIsWin(false)} />
                </div>
            )}
            <MatrixTerminal 
                onUserInput={handleInput} 
                numbers={userNumbers}
            /> 
        </div>
    )
}

export default DegenGambit;