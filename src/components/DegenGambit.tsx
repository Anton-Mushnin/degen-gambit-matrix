import { MatrixTerminal } from "./MatrixTerminal";
import { contractAddress, privateKey, thirdwebClientId, wagmiConfig } from '../config';
import { spin, _accept, _acceptThirdWebClient } from "../utils/degenGambit";
import { useActiveAccount } from "thirdweb/react";
import { useEffect, useState } from "react";
import { numbers } from "../config/symbols";
import Matrix from "./Matrix";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, WalletClient } from "viem";
import { Account } from "thirdweb/wallets";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createThirdwebClient, ThirdwebClient } from "thirdweb";

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

    const client = createThirdwebClient({ clientId: thirdwebClientId });


    const acceptMutation = useMutation({
        mutationKey: ['accept'],
        mutationFn: ({client}: {client: WalletClient}) => _accept(contractAddress, client),
        onSuccess: (data: any) => {
            console.log(data);
        },
    });

    const acceptThirdWebMutation = useMutation({
        mutationKey: ['accept'],
        mutationFn: () => _acceptThirdWebClient(contractAddress, activeAccount, client),
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
                let _client: WalletClient | ThirdwebClient | undefined;
                let account: Account | undefined;
                if (privateKey) {
                    _client = createWalletClient({
                        account: privateKeyToAccount(privateKey),
                        chain: wagmiConfig.chains[0],
                        transport: http()
                    })
                } else {
                    if (window.ethereum && activeAccount?.address) {
                        _client = client;
                    }
                    account = activeAccount;
                }
                if (!_client) {
                    return {output: ["No account selected"]};
                }
                
                // Execute the spin
                const spinResult = await spin(contractAddress, input === "spin boost", account, _client);
                
                setTimeout(() => {
                    setIsWin(!!spinResult.prize && (Number(spinResult.prize) > 0));
                }, 8000);

                setTimeout(() => {
                    setIsWin(false);
                    if (!!spinResult.prize && (Number(spinResult.prize) > 0) && AUTO_ACCEPT) {
                        if (privateKey) {
                            acceptMutation.mutate({client: _client as WalletClient});
                        } else {
                            acceptThirdWebMutation.mutate();
                        }
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
                    "┌─────────────────────────────────────────────┐",
                    "│             AVAILABLE COMMANDS              │",
                    "├─────────────────────────────────────────────┤",
                    "│  getsome     - visit getsome.game7.io to    │",
                    "│                get some tokens              │",
                    "│  spin        - spin the wheel               │",
                    "│  auto        - toggle auto spin             │",
                    "│  clear       - Clear the terminal           │",
                    "│                (⌘K or Ctrl+K)               │",
                    "└─────────────────────────────────────────────┘",
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