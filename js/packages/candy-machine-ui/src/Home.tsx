import { useEffect, useMemo, useState, useCallback } from 'react';
import * as anchor from '@project-serum/anchor';

import styled, { keyframes } from 'styled-components';
import { Container, Snackbar } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Alert from '@material-ui/lab/Alert';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from './candy-machine';
import { AlertState } from './utils';
import { Header } from './Header';
import { MintButton } from './MintButton';
import { GatewayProvider } from '@civic/solana-gateway-react';
import {ReactComponent as More} from "./image/more.svg"

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const AnimationTextBottom = keyframes`
  0% {
    max-width:200px;
    height:35px;
  }

  100% {
    max-width:100%;
    height: 455px;
  }
`

const AnimationTextTop = keyframes`
  0% {
    max-width: 100%;
    height:455px;
  }

  100% {
    max-width:200px;
    height:35px;
  }
`

interface propsText {
  height: string;
  maxWidth: string;
  isAnimation: boolean;
  isOverflow: string;
}

const MainText = styled.p.attrs((props: propsText) => props)`
  height:${(props) => props.height};
  max-width:${(props) => props.maxWidth};
  overflow: hidden;
  color: white;
  background-color:#3f3f3f8d;
  backdrop-filter: blur(5px);
  padding:15px;
  font-family: arial bold;
  font-size: 20px;
  line-height:38px;
  font-weight: bolder;
  text-align: center;
  border-radius:10px;
  margin: 0 auto;
  margin-top:30px;
  overflow: ${(props) => props.isOverflow};

  &::-webkit-scrollbar{
    width: 6px;
    background: #27aa99;
  }

  @media (max-width:670px) {
    max-width: 100%;
    color: #d32dcd;
  };

  animation: ${(props) => props.isAnimation ? AnimationTextBottom : AnimationTextTop} 1s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
`;

const TextMore = styled.p`
  color:white;
  margin: 0;
  cursor:pointer;
`

const MintContainer = styled.div``; // add your owns styles here

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}

const Home = (props: HomeProps) => {
  const [isUserMinting, setIsUserMinting] = useState(false);
  const [isText, setIsText] = useState(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: undefined,
  });

  const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  const refreshCandyMachineState = useCallback(async () => {
    if (!anchorWallet) {
      return;
    }

    if (props.candyMachineId) {
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection,
        );
        setCandyMachine(cndy);
      } catch (e) {
        console.log('There was a problem fetching Candy Machine state');
        console.log(e);
      }
    }
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const onMint = async () => {
    try {
      setIsUserMinting(true);
      document.getElementById('#identity')?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            true,
          );
        }

        if (status && !status.err) {
          setAlertState({
            open: true,
            message: 'Congratulations! Mint succeeded!',
            severity: 'success',
          });
        } else {
          setAlertState({
            open: true,
            message: 'Mint failed! Please try again!',
            severity: 'error',
          });
        }
      }
    } catch (error: any) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsUserMinting(false);
    }
  };

  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    props.connection,
    refreshCandyMachineState,
  ]);

  return (
    <Container>
      <Container maxWidth="xs" style={{ position: 'relative', marginTop: 100 }}>
        <Paper
          style={{ padding: 24, backgroundColor: '#151A1F', borderRadius: 6 }}
        >
          {!wallet.connected ? (
            <ConnectButton>Connect Wallet</ConnectButton>
          ) : (
            <>
              <Header candyMachine={candyMachine} />
              <MintContainer>
                {candyMachine?.state.isActive &&
                candyMachine?.state.gatekeeper &&
                wallet.publicKey &&
                wallet.signTransaction ? (
                  <GatewayProvider
                    wallet={{
                      publicKey:
                        wallet.publicKey ||
                        new PublicKey(CANDY_MACHINE_PROGRAM),
                      //@ts-ignore
                      signTransaction: wallet.signTransaction,
                    }}
                    gatekeeperNetwork={
                      candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                    }
                    clusterUrl={rpcUrl}
                    options={{ autoShowModal: false }}
                  >
                    <MintButton
                      candyMachine={candyMachine}
                      isMinting={isUserMinting}
                      onMint={onMint}
                    />
                  </GatewayProvider>
                ) : (
                  <MintButton
                    candyMachine={candyMachine}
                    isMinting={isUserMinting}
                    onMint={onMint}
                  />
                )}
              </MintContainer>
            </>
          )}
        </Paper>
      </Container>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>

      <MainText 
        height={`${isText ? '455px' : '35px'}`}
        maxWidth={`${isText ? '100%' : '200px'}`}
        isAnimation={isText}
        isOverflow={`${isText ? 'auto' : 'hidden'}`}
      >

        <TextMore onClick={() => {setIsText(!isText)}} >
          To learn more <span><More className={`more ${!isText && "more_expand" }`} /></span>
        </TextMore>
          Degen Nation - Mars Mission
          <br />
          6969 anons are building a new nation on Mars.
          <br />
          A PFP collection that gives you access to 3D metaverse avatars & is a membership pass to a DAO.
          <br />
          Releases in 2 drops. 
          <br />
          1st drop 30th Jan. 2022 - 3484 female Degens (35 1/1 included)
          <br />
          2nd drop mid March 2022 - 3484 male Degens
          <br />
          (NFT #6969 will be a special one - TBA)
          <br />
          1st Drop Details
          <br />
          Mint-Date: 30. Jan. 2022 - 6PM UTC
          <br />
          Total Supply: 3484 (-151 marketing/collabs/team DAO memberships)
          <br />
          Mint-Price: 2 $SOL
          <br />
          Utility:
          <ul>
            <li>- DAO membership</li>
            <li>- VIP access to IRL events hosted by us(in Europe)</li>
            <li>- free hoodie from our 1st collection for holders</li>
            <li>- DAO deceides the mint price of the 2nd drop(social experiment)</li>
          </ul>
          <br />
          For the detailed roadmap & blackpaper, please check out Discord channel "Roadmap"
          <br />
          "Wait, female & male characters, will there be breeding?"
          <br />
          "Breeding? Are we animals? We call it fucking!"
      </MainText>
    </Container>
  );
};

export default Home;
