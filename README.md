# Degen Gambit Matrix

A Matrix-style terminal interface for interacting with fully-onchain games, starting with the DegenGambit contract.

![Matrix Terminal Interface](https://i.imgur.com/placeholder.png)

## Overview

This project is a Proof of Concept (POC) for a stylized, immersive interface to fully-onchain games. It provides a Matrix-inspired terminal UI that connects to blockchain games, starting with DegenGambit. The long-term vision is to create an adaptable interface that can work with any fully-onchain game contract using AI for dynamic integration.

## Features

- **Matrix-Style Terminal Interface**: Interact with blockchain games through a nostalgic, cyberpunk-inspired UI
- **DegenGambit Integration**: Play the DegenGambit game directly from the terminal
- **Block Production**: Server-side block production to ensure timely transaction processing
- **ThirdWeb Integration**: Connect wallets easily through ThirdWeb
- **Auto-Spin**: Automatically continue spinning based on game outcomes

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Anton-Mushnin/degen-gambit-matrix.git
   cd degen-gambit-matrix
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your environment variables:
   ```
   VITE_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
   VITE_CONTRACT_ADDRESS=your-contract-address
   VITE_PRIVATE_KEY=your-private-key-for-playing (optional)
   BLOCK_PRODUCER_PRIVATE_KEY=your-private-key-for-block-production
   PORT=3000
   ```

### Running the Application

Start the development server:
```bash
npm run dev
```

This will start both the Vite development server for the frontend and the Express server for the block producer API.

## Usage

Once the application is running, you can interact with it using the following commands:

- `spin` - Spin the wheel
- `spin boost` - Spin the wheel with a boost (requires GAMBIT tokens)
- `getsome` - Visit getsome.game7.io to get testnet tokens
- `clear` - Clear the terminal (or use ⌘K / Ctrl+K)
- `auto` - Toggle auto-spin mode

## Architecture

The application consists of:

1. **Frontend**: React application with a Matrix-style terminal interface
   - Built with Vite, React, and TypeScript
   - Uses ThirdWeb for wallet connections
   - Styled with styled-components

2. **Backend**: Express server for block production
   - Handles block production when needed
   - Keeps private keys secure on the server side
   - Provides API endpoints for block status and creation

3. **Blockchain Interaction**: 
   - Uses viem and ThirdWeb for blockchain interactions
   - Supports both browser wallets and private key-based transactions

## Security Considerations

- **Private Keys**: Never commit your `.env` file with private keys
- **Block Production**: The block producer private key should be kept secure and only used on the server
- **Client-Side Security**: Sensitive operations like block production happen on the server side

## Future Vision

This POC demonstrates the potential for creating immersive interfaces for blockchain games. The long-term vision includes:

- AI-powered adapters for any fully-onchain game contract
- Enhanced visual effects and animations
- Multi-game support in a single interface
- Social features and leaderboards

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- PermissionlessGames for the DegenGambit contract
- Game7 for the testnet and DegenGambit contract
- The ThirdWeb team for their excellent SDK
- The Matrix for inspiration
