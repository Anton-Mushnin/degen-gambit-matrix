import { viemG7Testnet, wagmiConfig } from '../config'
import { getPublicClient } from '@wagmi/core'
import { degenGambitABI } from '../ABIs/DegenGambit.abi.ts';
import { multicall } from '@wagmi/core';
import { createPublicClient, formatUnits, http } from 'viem';
import { Account, Wallet } from 'thirdweb/wallets';
import { waitForReceipt } from 'thirdweb/transaction';
import { prepareContractCall, sendTransaction } from 'thirdweb/transaction';
import { viemAdapter } from 'thirdweb/adapters/viem';
import { ThirdwebClient } from 'thirdweb';


export const getBalances = async (contractAddress: string, degenAddress: string) => {
    const nativeBalance = await getPublicClient(wagmiConfig).getBalance({
        address: degenAddress,
    })
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const
      const balanceInfo = await multicall(wagmiConfig, {
        contracts: [
            {
                ...contract,
                functionName: 'balanceOf',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'symbol',
            },
            {
                ...contract,
                functionName: 'decimals',
            },
        ],
      })
      const [
        balance,
        symbol,
        decimals,
      ] = balanceInfo.map((item: any) => item.result);

      return {
        balance: formatUnits(balance, decimals),
        nativeBalance: formatUnits(nativeBalance, wagmiConfig.chains[0].nativeCurrency.decimals),
        symbol,
      }
}


export const getStreaks = async (contractAddress: string, degenAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const
      const streaksInfo = await multicall(wagmiConfig, {
        contracts: [
            {
                ...contract,
                functionName: 'CurrentDailyStreakLength',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'CurrentWeeklyStreakLength',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'LastStreakDay',
                args: [degenAddress],
            },
            {
                ...contract,
                functionName: 'LastStreakWeek',
                args: [degenAddress],
            },
        ],
      })
      const [
        dailyStreak,
        weeklyStreak,
        lastStreakDay,
        lastStreakWeek,
      ] = streaksInfo.map((item: any) => item.result);

      return {
        dailyStreak: Number(dailyStreak),
        weeklyStreak: Number(weeklyStreak),
        lastStreakDay: Number(lastStreakDay),
        lastStreakWeek: Number(lastStreakWeek),
      }
}



export const getDegenGambitInfo = async (contractAddress: string) => {
    const contract = {
        address: contractAddress,
        abi: degenGambitABI,
      } as const


      
      const result = await multicall(wagmiConfig, {
        contracts: [
          {
            ...contract,
            functionName: 'BlocksToAct',
          },
          {
            ...contract,
            functionName: 'CostToRespin',
          },
          {
            ...contract,
            functionName: 'CostToSpin',
          },
          {
            ...contract,
            functionName: 'MajorGambitPrize',
          },
          {
            ...contract,
            functionName: 'MinorGambitPrize',
          },
          {
            ...contract,
            functionName: 'prizes',
          },
          {
            ...contract,
            functionName: 'symbol',
          },
        ],
      })
      return result
    }


    export const spin = async (contractAddress: string, boost: boolean, account: Account, client: ThirdwebClient, wallet: Wallet) => {
        const viemContract = {
            address: contractAddress,
            abi: degenGambitABI,
          } as const

          const degenAddress = account.address ?? ""
          const publicClient = createPublicClient({
            chain: wagmiConfig.chains[0],
            transport: http()
          })

          const result = await multicall(wagmiConfig, {
            contracts: [
              {
                ...viemContract,
                functionName: 'symbol',
              },
              {
                ...viemContract,
                functionName: 'decimals',
              },
              {
                ...viemContract,
                functionName: 'spinCost',
                args: [degenAddress],
              },
            ],
          })
          const [
            symbol,
            decimals,
            spinCost,
          ] = result.map((item: any) => item.result);


          const contract = viemAdapter.contract.fromViem({
            viemContract: viemContract,
            chain: {
                ...viemG7Testnet,
                rpc: viemG7Testnet.rpcUrls["default"].http[0],
                blockExplorers: [{
                    name: "Game7",
                    url: viemG7Testnet.blockExplorers.default.url
                }],
                testnet: true
            },
            client,
            });


            // const walletClient = viemAdapter.wallet.toViem({
            //     wallet,
            //     client,
            //     chain: {
            //         ...viemG7Testnet,
            //         rpc: viemG7Testnet.rpcUrls["default"].http[0],
            //         blockExplorers: [{
            //             name: "Game7",
            //             url: viemG7Testnet.blockExplorers.default.url
            //         }],
            //         testnet: true
            //     },
            // });


            // const walletClient = createWalletClient({
            //     chain: viemG7Testnet,
            //     transport: custom(window.ethereum)
            //   })


            // const { request } = await publicClient.simulateContract({
            //     account: account.address,
            //     address: contractAddress,
            //     abi: degenGambitABI,
            //     functionName: 'spin',
            //     args: [boost],
            //     value: spinCost,
            //   })
            //   console.log(request)
            //   await walletClient.writeContract(request)


        //   const result = await writeContract(wagmiConfig, {
        //     ...viemContract,
        //     functionName: 'spin',
        //     args: [boost],
        //   })
        //   return result

            
        const tx = prepareContractCall({
            contract,
            method: "spin",
            params: [boost],
            value: spinCost,
          });

        const transactionResult = await sendTransaction({
            transaction: tx,
            account,
          });
           
          
          await waitForReceipt(transactionResult);

          let outcome;
          while (!outcome) {
            try {
                outcome = await publicClient.readContract({
                    ...viemContract,
                    functionName: 'inspectOutcome',
                    args: [degenAddress],
                })
            } catch (error: any) {
                if (!error.message.includes('WaitForTick()')) {
                    return {description: error.message}
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        return {description: Number(outcome[4]) > 0 
            ? `You won ${formatUnits(outcome[4], decimals)} ${Number(outcome[5]) === 1 ? wagmiConfig.chains[0].nativeCurrency.symbol : symbol}` 
            : `The Matrix has you...`,
            outcome,
          }
    }