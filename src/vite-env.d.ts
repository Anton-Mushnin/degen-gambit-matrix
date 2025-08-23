/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_THIRDWEB_CLIENT_ID: string
  readonly VITE_MATRIX_DICE_MAINNET: string
  readonly VITE_MATRIX_DICE_SEPOLIA: string
  readonly VITE_MATRIX_DICE_POLYGON: string
  readonly VITE_MATRIX_DICE_MUMBAI: string
  readonly VITE_MATRIX_DICE_G7_TESTNET: string
  readonly VITE_MATRIX_DICE_LOCALHOST: string
  readonly VITE_DEGEN_GAMBIT_MAINNET: string
  readonly VITE_DEGEN_GAMBIT_SEPOLIA: string
  readonly VITE_DEGEN_GAMBIT_POLYGON: string
  readonly VITE_DEGEN_GAMBIT_MUMBAI: string
  readonly VITE_DEGEN_GAMBIT_LOCALHOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
