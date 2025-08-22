import Web3 from 'web3';
import SurajyaCore from "./SurajyaCore.json";

let web3;
let contract;
let account;

// Contract address from your deployment
const contractAddress = "0xcb0D5676Bd7f59232b7Dc1fcA48EcD42ed78bD62";

export const initWeb3 = async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();
      account = accounts[0];

      contract = new web3.eth.Contract(SurajyaCore.abi, contractAddress);
      return { web3, contract, account };
    } catch (error) {
      console.error("User denied account access:", error);
    }
  } else {
    console.log("Please install MetaMask!");
  }
};


export const getWeb3 = () => web3;
export const getContract = () => contract;
export const getAccount = () => account;