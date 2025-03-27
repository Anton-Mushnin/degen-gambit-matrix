import { useActiveAccount } from 'thirdweb/react';
import styles from "./Navbar.module.css";
import { getBalance } from '@wagmi/core';
import { wagmiConfig } from "../../config";
import { useQuery } from "@tanstack/react-query";

const Navbar = () => {
    const activeAccount = useActiveAccount()
    const balance = useQuery({
        queryKey: ['balance', activeAccount?.address],
        queryFn: () => getBalance(wagmiConfig, {address: activeAccount?.address ?? ''}),
        refetchOnWindowFocus: true,
    })

    return (
        <div className={styles.container}>
            <div className={styles.item}>
                <span>{`Balance: ${balance.data?.formatted}`}</span>
            </div>
            <div className={styles.getsome} onClick={() => window.open(`https://getsome.game7.io?network=testnet&address=${activeAccount?.address}`, "_blank")}>
                getsome
            </div>
        </div>
    )
}

export default Navbar;