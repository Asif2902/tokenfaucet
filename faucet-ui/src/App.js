import { useEffect, useState } from "react";
import "./App.css";
import { ethers } from "ethers";
import faucetContract from "./ethereum/faucet";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState();
  const [fcContract, setFcContract] = useState();
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [transactionData, setTransactionData] = useState(
    localStorage.getItem("transactionData") || ""
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    getCurrentWalletConnected();
    addWalletListener();
  }, [walletAddress]);

  useEffect(() => {
    localStorage.setItem("transactionData", transactionData);
  }, [transactionData]);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setSigner(provider.getSigner());
        setFcContract(faucetContract(provider));
        setWalletAddress(accounts[0]);
        setIsConnected(true);

        // Request signature
        let signature;
        try {
          signature = await signer.signMessage("I NEED StakeR  Token FAUCET");
        } catch (error) {
          console.error(error);
          setIsConnected(false);
          return;
        }

        // Check if signature is received
        if (!signature) {
          setIsConnected(false);
          setShowError(true);
          return;
        }
        
      } catch (error) {
        console.error(error);
        setIsConnected(false);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };

  const getCurrentWalletConnected = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const chainId = await provider.send("eth_chainId");
        if (chainId === "0x279f") {
          setIsCorrectNetwork(true);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setSigner(provider.getSigner());
            setFcContract(faucetContract(provider));
            setWalletAddress(accounts[0]);
            setIsConnected(true);

            // Request signature automatically
            let signature;
            try {
              signature = await signer.signMessage("I am a Hoomaan. I Need Tokens For Testing ");
            } catch (error) {
              console.error(error);
              setIsConnected(false);
              return;
            }

            // Check if signature is received
            if (!signature) {
              setIsConnected(false);
              setShowError(true);
              return;
            }
          }
        } else {
          setIsCorrectNetwork(false);
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x279f" }],
          });
        }
      } catch (error) {
        console.error(error);
        setIsConnected(false);
      }
    } else {
      console.log("MetaMask is not installed");
    }
  };

  const addWalletListener = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0]);
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } else {
      setWalletAddress("");
      setIsConnected(false);
      console.log("MetaMask is not installed");
    }
  };

  const getOCTHandler = async () => {
    setWithdrawError("");
    setWithdrawSuccess("");
    try {
      const fcContractWithSigner = fcContract.connect(signer);
      const resp = await fcContractWithSigner.requestTokens();
      setWithdrawSuccess("Operation succeeded - enjoy your tokens!");
      setTransactionData(resp.hash);
    } catch (err) {
      setWithdrawError(err.message);
    }
  };

  return (
    <div>
      {showError && (
        <div className="error-message">
          You didn't sign the signature. Please refresh the page.
        </div>
      )}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-brand">
            <h1 className="navbar-item is-size-4">StakeR  Token (TT)</h1>
          </div>
          <div id="navbarMenu" className="navbar-menu">
            <div className="navbar-end is-align-items-center">
              <button
                className="button is-white connect-wallet"
                onClick={connectWallet}
              >
                <span className="is-link has-text-weight-bold">
                  {isConnected
                    ? `Connected: ${walletAddress.substring(
                        0,
                        6
                      )}...${walletAddress.substring(38)}`
                    : "Connect Wallet"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      <section className="hero is-fullheight">
        <div className="faucet-hero-body">
          <div className="container has-text-centered main-content">
            <h1 className="title is-1">Faucet</h1>
            <p>Fast and reliable. 500 StakeR  token /12h</p>

            <a href="https://stake.0xasif.monster"><b>
            staking</b></a>&nbsp;&nbsp;&nbsp;&nbsp;<a
            href="https://ttt.0xasif.monster"><b>Game</b></a>

            <div className="mt-5">
              {withdrawError && (
                <div className="withdraw-error">{withdrawError}</div>
              )}
              {withdrawSuccess && (
                <div className="withdraw-success">{withdrawSuccess}</div>
              )}{" "}
            </div>
            <div className="box address-box">
              <div className="columns">
                <div className="column is-four-fifths">
                  <input
                    className="input is-medium"
                    type="text"
                    placeholder="Enter your wallet address (0x...)"
                    defaultValue={walletAddress}
                    disabled={!isConnected}
                  />
                </div>
                <div className="column">
                  <button
                    className="button is-link is-medium"
                    onClick={getOCTHandler}
                    disabled={!isConnected || !isCorrectNetwork}
                  >
                    GET TOKENS
                  </button>
                </div>
              </div>
              <article className="panel is-grey-darker">
                <p className="panel-heading">Last Transaction Data</p>
                <div className="panel-block">
                  <p>
                    {transactionData ? (
                      <a
                        href={`https://testnet.monadexplorer.com/tx/${transactionData}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Transaction hash: {transactionData}
                      </a>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
