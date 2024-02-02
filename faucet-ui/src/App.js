import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import faucetContract from "./ethereum/faucet";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [signer, setSigner] = useState();
  const [fcContract, setFcContract] = useState();
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [transactionData, setTransactionData] = useState(localStorage.getItem("transactionData") || "");
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);

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
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x28c60",
              chainName: "Katla",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.katla.taiko.xyz"],
              blockExplorerUrls: ["https://explorer.katla.taiko.xyz/"],
            },
          ],
        });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setSigner(provider.getSigner());
        setFcContract(faucetContract(provider));
        setWalletAddress(accounts[0]);
        setIsConnected(true);
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
        if (chainId === "0x28c60") {
          setIsCorrectNetwork(true);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            setSigner(provider.getSigner());
            setFcContract(faucetContract(provider));
            setWalletAddress(accounts[0]);
            setIsConnected(true);
          }
        } else {
          setIsCorrectNetwork(false);
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x28c60" }],
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
      <nav style={{ backgroundColor: "#4CAF50", padding: "20px 0" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ color: "white", margin: 0 }}>Asif Token (AT)</h1>
            <button
              style={{ backgroundColor: "white", color: "#4CAF50", border: "none", padding: "10px 20px", cursor: "pointer" }}
              onClick={connectWallet}
            >
              <span style={{ fontWeight: "bold" }}>
                {isConnected ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}` : "Connect Wallet"}
              </span>
            </button>
          </div>
        </div>
      </nav>
      <section style={{ backgroundColor: "#f5f5f5", minHeight: "calc(100vh - 80px)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>Faucet</h1>
            <p style={{ fontSize: "1.25rem", marginBottom: "30px" }}>Fast and reliable. 500 AT/12h</p>
          </div>
          <div style={{ marginBottom: "30px", textAlign: "center" }}>
            <a href="https://test.everypunks.xyz" style={{ marginRight: "10px", color: "#007bff", textDecoration: "none" }}><b>Taiko Filp</b></a>
            <a href="https://everypunks.xyz" style={{ color: "#007bff", textDecoration: "none" }}><b>Homepage</b></a>
          </div>
          <div style={{ marginBottom: "30px", textAlign: "center" }}>
            {withdrawError && <div style={{ color: "red" }}>{withdrawError}</div>}
            {withdrawSuccess && <div style={{ color: "green" }}>{withdrawSuccess}</div>}
          </div>
          <div style={{ marginBottom: "30px" }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <input
                style={{ width: "70%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                type="text"
                placeholder="Enter your wallet address (0x...)"
                defaultValue={walletAddress}
                disabled={!isConnected}
              />
              <button
                style={{ marginLeft: "10px", backgroundColor: "#007bff", color: "white", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer" }}
                onClick={getOCTHandler}
                disabled={!isConnected || !isCorrectNetwork}
              >
                GET TOKENS
              </button>
            </div>
            <article style={{ marginTop: "20px", border: "1px solid #ccc", borderRadius: "5px", padding: "10px" }}>
              <p style={{ marginBottom: "0" }}>
                {transactionData ? (
                  <a href={`https://explorer.katla.taiko.xyz/tx/${transactionData}`} target="_blank" rel="noopener noreferrer">
                    Transaction hash: {transactionData}
                  </a>
                ) : (
                  "--"
                )}
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;

