import './App.css';
import { useMemo } from 'react';
import * as anchor from '@project-serum/anchor';
import Home from './Home';
import styled from 'styled-components';
import {ReactComponent as Discord} from "./image/discord.svg"
import {ReactComponent as Twitter} from "./image/twitter.svg"

import mobile_icons from "./image/icons/mobile_icons.png"
import pc_icons from "./image/icons/pc_icons.png"

import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolletExtensionWallet,
} from '@solana/wallet-adapter-wallets';

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletDialogProvider } from '@solana/wallet-adapter-material-ui';

import { ThemeProvider, createTheme } from '@material-ui/core';

const theme = createTheme({
  palette: {
    type: 'dark',
  },
});

const getCandyMachineId = (): anchor.web3.PublicKey | undefined => {
  try {
    const candyMachineId = new anchor.web3.PublicKey(
      process.env.REACT_APP_CANDY_MACHINE_ID!,
    );

    return candyMachineId;
  } catch (e) {
    console.log('Failed to construct CandyMachineId', e);
    return undefined;
  }
};

const candyMachineId = getCandyMachineId();
const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;
const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost
  ? rpcHost
  : anchor.web3.clusterApiUrl('devnet'));

const startDateSeed = parseInt(process.env.REACT_APP_CANDY_START_DATE!, 10);
const txTimeoutInMilliseconds = 30000;

const Header = styled.header`
  max-width: 100%;
  height:64px;
  background-color:#242424;
  opacity: 0.7;
`;

const HeaderConatiner = styled.header`
  display: flex;
  justify-content:space-between;
  align-items:center;

  max-width:1440px;
  height:100%;
  margin: 0 auto;
  padding: 0 30px;
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content:space-between;
  align-items:center;
  width: 170px;
  height:100%;

  @media (max-width: 680px) {
    width: 130px;
  }
`;

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSlopeWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [],
  );

  return (
    <ThemeProvider theme={theme}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletDialogProvider>
            <Header>
              <HeaderConatiner>
                <img 
                  className="icon_web" 
                  src={document.body.clientWidth < 680 ? mobile_icons : pc_icons } 
                  alt=""
                />
                
                <LinksContainer>
                  <a href="https://discord.gg/DegenNation69" >
                    <Discord className="links_img discord" />
                  </a>

                  <a href="https://twitter.gg/DegenNation69" >
                    <Twitter className="links_img " />
                  </a>
                </LinksContainer>
              </HeaderConatiner>
            </Header>
            <Home
              candyMachineId={candyMachineId}
              connection={connection}
              startDate={startDateSeed}
              txTimeout={txTimeoutInMilliseconds}
              rpcHost={rpcHost}
            />
          </WalletDialogProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
};

export default App;
