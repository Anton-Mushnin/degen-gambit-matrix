import { useActiveAccount } from 'thirdweb/react';
import styles from "./Navbar.module.css";
import { getBalance } from '@wagmi/core';
import { wagmiConfig } from "../../config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from 'react';

const Navbar = ({phase, timeLeft}: {phase: string, timeLeft: number}) => {
    const [_timeLeft, setTimeLeft] = useState(Math.floor(timeLeft / 1000))

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prevTime => prevTime > 0 ? prevTime - 1 : 0)
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        setTimeLeft(Math.floor(timeLeft / 1000))
    }, [timeLeft])

    const queryClient = useQueryClient()

    useEffect(() => {
        if (_timeLeft === 0) {
            queryClient.invalidateQueries({queryKey: ["currentGameAndRoundState"]})
        }
    }, [_timeLeft])

    const activeAccount = useActiveAccount()
    const balance = useQuery({
        queryKey: ['balance', activeAccount?.address],
        queryFn: () => getBalance(wagmiConfig, {address: activeAccount?.address ?? ''}),
        refetchOnWindowFocus: true,
        refetchInterval: 3000,
    })

    return (
        <div className={styles.container}>
            <div className={styles.leftSide}>
                <div className={styles.item}>
                    <span>{`Phase: ${phase}`}</span>
                </div>
                {_timeLeft > 0 && <div className={styles.item}>
                    <span>{`Time Left: ${_timeLeft}s`}</span>
                </div>}
            </div>
            <div className={styles.rightSide}>
                <div className={styles.item}>
                    <span>{`Balance: ${balance.data?.formatted}`}</span>
                </div>
                <div className={styles.getsome} onClick={() => window.open(`https://getsome.game7.io?network=testnet&address=${activeAccount?.address}`, "_blank")}>
                    getsome
                </div>
            </div>
        </div>
    )
}

export default Navbar;