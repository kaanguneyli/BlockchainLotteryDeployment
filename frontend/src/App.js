import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import logo from './logo.svg';
import './App.css';

import { ethers } from 'ethers';

/* global BigInt
 */// Import ABIs
import AdminFacetABI from './ABIs/AdminFacet.json';
import LotteryFacetABI from './ABIs/LotteryFacet.json';
import QueryFacetABI from './ABIs/QueryFacet.json';
import Main_Facet_ABI from './ABIs/MainFacet.json';
import ERC20ABI from './ABIs/ERC20ABI.json';

/* const LOTTERY_FACET_ADDRESS = '0x0165878a594ca255338adfa4d48449f69242eb8f';
const QUERY_FACET_ADDRESS = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853';
const ADMIN_FACET_ADDRESS = '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707';
 */

const DIAMOND_address = '0xB366c38454a6e02Ad10413c1dAAa58F35b9Ed4d2';
let TOKEN_ADDRESS = '0x9C279a738FFd5344124396De910507Aba2Ed58e6';
 

function App() {
  const [web3, setWeb3] = useState(null);
  const [adminFacet, setAdminFacet] = useState(null);
  const [lotteryFacet, setLotteryFacet] = useState(null);
  const [queryFacet, setQueryFacet] = useState(null);
  const [account, setAccount] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [lotteryWinner, setLotteryWinner] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [lotteryInfo, setLotteryInfo] = useState(null);
  const [lotterySales, setLotterySales] = useState(null);
  const [lotteryURL, setLotteryURL] = useState(null);
  const [numPurchaseTxs, setNumPurchaseTxs] = useState(null);
  const [paymentToken, setPaymentTokenState] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [ticket, setTicket] = useState({
    lottery_no: '',
    quantity: '',
    random_number: ''
  });

  const [lotteryParams, setLotteryParams] = useState({
    unixEnd: '',
    nooftickets: '',
    noofwinners: '',
    minpercentage: '',
    ticketprice: '',
    htmlhash: '',
    url: ''
  });

  const [tokenAddress, setTokenAddress] = useState('');
  const [ticketQuery, setTicketQuery] = useState({ i: '', lottery_no: '' });

  const [showCreateLottery, setShowCreateLottery] = useState(false);
  const [showSetPaymentToken, setShowSetPaymentToken] = useState(false);
  const [showEnterLottery, setShowEnterLottery] = useState(false);
  const [showGetLotteryWinner, setShowGetLotteryWinner] = useState(false);
  const [showGetTicketData, setShowGetTicketData] = useState(false);
  const [showGetLotteryInfo, setShowGetLotteryInfo] = useState(false);
  const [showGetLotterySales, setShowGetLotterySales] = useState(false);
  const [showGetLotteryURL, setShowGetLotteryURL] = useState(false);
  const [showGetNumPurchaseTxs, setShowGetNumPurchaseTxs] = useState(false);
  const [showGetPaymentToken, setShowGetPaymentToken] = useState(false);
  const [showGetStartTime, setShowGetStartTime] = useState(false);
  const [tokenInstance, setTokenContract] = useState(null);
  


  const getLotteryContract = async () => {
    if (!window.ethereum) throw new Error("Metamask is not installed");

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log("Connected account:", accounts[0]);
  } catch (error) {
      console.error("Error connecting to MetaMask:", error);
  }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Await the network validation to ensure it's on the correct network
    const network = await provider.getNetwork();
   
    const adminFacetInstance=  new ethers.Contract(DIAMOND_address, Main_Facet_ABI, signer);

    setAdminFacet(adminFacetInstance);
    const userAddress = await signer.getAddress();
        setAccount(userAddress);

    console.log('AdminFacet:', adminFacetInstance);

    return { adminFacetInstance };

  };

  useEffect(() => {
    getLotteryContract();
  }
  , []);


  useEffect(() => {
    if (TOKEN_ADDRESS) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      console.log('Token Address:', TOKEN_ADDRESS);
      const tokenInstance = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI, signer);
      console.log('Token Instance:', tokenInstance);
      setTokenContract(tokenInstance);
    }
  }, [TOKEN_ADDRESS]);
  // Functions to interact with the contracts
  const createLottery = async () => {
    const {adminFacetInstance} = await getLotteryContract();

    if (adminFacet ) {
      try {
        const unixEnd = BigInt(lotteryParams.unixEnd); // Directly convert to BigInt
        const nooftickets = parseInt(lotteryParams.nooftickets); // Convert to integer
        const noofwinners = parseInt(lotteryParams.noofwinners); // Convert to integer
        const minpercentage = parseInt(lotteryParams.minpercentage); // Convert to integer
        const ticketprice = ethers.utils.parseEther(lotteryParams.ticketprice); // Convert to Ether
        const htmlhash = ethers.utils.formatBytes32String(lotteryParams.htmlhash); // Convert to bytes32
        const url = lotteryParams.url; // URL

        console.log("admin facet:", adminFacetInstance);

        const tx = await adminFacetInstance.createLottery(
            unixEnd,
            nooftickets,
            noofwinners,
            minpercentage,
            ticketprice,
            htmlhash,
            url,
            { gasLimit: 500000 }
        );
        console.log("Transaction sent, waiting for confirmation...");

        await tx.wait();
        console.log('Lottery created');
      } catch (error) {
        console.error('Error creating lottery:', error);
      }
    } else {
      console.log('AdminFacet contract or account is not set');
      console.log('AdminFacet:', adminFacet);
      console.error('AdminFacet contract or account is not set');
    }
  };
  const getLotteryInfo = async (lottery_no) => {
    const {adminFacetInstance} = await getLotteryContract();

    if (adminFacetInstance) {
      try {
        console.log(`Fetching lottery info for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getLotteryInfo(lottery_no);
        setLotteryInfo(result);
        console.log('Lottery Info:', result);
        return result;
      } catch (error) {
        console.error('Error fetching lottery info:', error);
      }
    } else {
      console.error('QueryFacet contract is not set');
    }
  };

  const setPaymentToken = async () => {
    if (adminFacet) {
      try {
        console.log('Setting payment token...');
        
        const tx = await adminFacet.setPaymentToken(tokenAddress);
        console.log('Payment token set');
      } catch (error) {
        console.error('Error setting payment token:', error);
      }
    } else {
      console.error('AdminFacet contract or account is not set');
    }
  };

  const getLotteryURL = async () => {
    const { lottery_no } = ticketQuery;
    const {adminFacetInstance} = await getLotteryContract();
    if (adminFacetInstance) {
      try {
        console.log(`Fetching lottery URL for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getLotteryURL(lottery_no);
        setLotteryURL(result);
        console.log('Lottery URL:', result);
      } catch (error) {
        console.error('Error fetching lottery URL:', error);
      }
    } else {
      console.error('QueryFacet contract is not set');
    }
  };

  const mintTokens = async () => {
    try {

      if (!account) {
        console.error('Account is not set');
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(account); // Use the account's signer
      
      const tokenAbi = [
        // Minimal ABI to call mint
        "function mint(address to, uint256 amount) public"
    ];
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);

    const amount = ethers.utils.parseUnits("1000", 18); // Mint 1000 tokens with 18 decimals

    const tx = await tokenContract.mint(account, amount);
    await tx.wait(); // Wait for transaction confirmation

    console.log(`Successfully minted ${amount} tokens to ${account}`);
    } catch (error) {
      console.error('Error during token minting:', error);
    }
  }

  const enterLottery = async () => {
    if (lotteryFacet && account) {
      try {
        console.log('Entering lottery...');
        await lotteryFacet.methods.enter().send({ from: account, value: web3.utils.toWei('0.0001', 'ether') });
        console.log('Entered the lottery');
      } catch (error) {
        console.error('Error entering lottery:', error);
      }
    } else {
      console.error('LotteryFacet contract or account is not set');
    }
  };

  const getLotterySales = async () => {
    const { lottery_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log(`Fetching lottery sales for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getLotterySales(lottery_no);
        setLotterySales(result);
        console.log('Lottery Sales:', result);
      } catch (error) {
        console.error('Error fetching lottery sales:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  
  const getNumPurchaseTxs = async () => {
    const { lottery_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log(`Fetching number of purchase transactions for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getNumPurchaseTxs(parseInt(lottery_no));
        setNumPurchaseTxs(result);
        console.log('Number of Purchase Transactions:', result);
      } catch (error) {
        console.error('Error fetching number of purchase transactions:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  
  const getPaymentToken = async () => {
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log('Fetching payment token...');
        const result = await adminFacetInstance.getPaymentToken();
        setPaymentTokenState(result);
        console.log('Payment Token:', result);
      } catch (error) {
        console.error('Error fetching payment token:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  
  const getStartTime = async () => {
    const { lottery_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log(`Fetching start time for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getStartTime(lottery_no);
        setStartTime(result);
        console.log('Start Time:', result);
      } catch (error) {
        console.error('Error fetching start time:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  
  const getIthPurchasedTicketTx = async () => {
    const { i, lottery_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log(`Fetching ticket data for lottery ${lottery_no}, ticket ${i}...`);
        const result = await adminFacetInstance.getIthPurchasedTicketTx(i, lottery_no);
        setTicketData(result);
        console.log('Ticket Data:', result);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  
  const getLotteryWinner = async () => {
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      try {
        console.log('Fetching lottery winner...');
        const winner = await adminFacetInstance.getWinner();
        setLotteryWinner(winner);
        console.log('Lottery Winner:', winner);
      } catch (error) {
        console.error('Error fetching lottery winner:', error);
      }
    } else {
      console.error('AdminFacet contract is not set');
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLotteryParams({ ...lotteryParams, [name]: value });
  };

  const handleTokenAddressChange = (e) => {
    setTokenAddress(e.target.value);
  };

  const handleTicketQueryChange = (e) => {
    const { name, value } = e.target;
    setTicketQuery({ ...ticketQuery, [name]: value });
  };
  
  const buyTicket = async () => {
    await getPaymentToken(); 
  
    if (!TOKEN_ADDRESS) {
      console.error('TOKEN_ADDRESS is not set');
      return;
    }
  
    if (!account) {
      console.error('Account is not set');
      return;
    }
  
    try {
      const { lottery_no } = ticketQuery; // Get the lottery number from the input
      const {quantity} = ticketQuery;
      const lot_info = await getLotteryInfo(lottery_no); // Pass lottery_no to get lottery info

      const ticketPrice = (lot_info[4].div(ethers.BigNumber.from("1000000000000000000"))).toNumber();

      console.log('Preparing to approve the recipient to spend tokens...');
      const amount = ethers.utils.parseEther((ticketPrice*quantity).toString()); // The least possible amount

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(account); // Use the account's signer
  
      // Create an instance of the ERC20 token
      const tokenInstance = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI, signer);
  
      // Address of the recipient (contract or address to receive tokens)
      const recipient = tokenInstance.address; // Replace with your recipient contract or address
  
      // Step 1: Approve the recipient to spend tokens on behalf of the account
      const approveTx = await tokenInstance.approve(recipient, amount);
      await approveTx.wait();
      console.log(`Approved ${ethers.utils.formatEther(amount)} tokens for recipient: ${recipient}`);
  
      // Step 2: Transfer the tokens (requires recipient to call `transferFrom`)
      console.log('Initiating the transfer...');
      const transferTx = await tokenInstance.transfer(recipient, amount, {
        gasLimit: 100000, // Adjust based on expected complexity
    });      
    await transferTx.wait();
      console.log(`Successfully transferred tokens from ${account} to ${recipient}`);
    } catch (error) {
      console.error('Error during token transfer:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <h2>Create Lottery</h2>
          <button onClick={() => setShowCreateLottery(!showCreateLottery)}>Create Lottery</button>
          {showCreateLottery && (
            <div>
              <input type="text" name="unixEnd" placeholder="Unix End Time" value={lotteryParams.unixEnd} onChange={handleInputChange} />
              <input type="text" name="nooftickets" placeholder="Number of Tickets" value={lotteryParams.nooftickets} onChange={handleInputChange} />
              <input type="text" name="noofwinners" placeholder="Number of Winners" value={lotteryParams.noofwinners} onChange={handleInputChange} />
              <input type="text" name="minpercentage" placeholder="Minimum Percentage" value={lotteryParams.minpercentage} onChange={handleInputChange} />
              <input type="text" name="ticketprice" placeholder="Ticket Price (ETH)" value={lotteryParams.ticketprice} onChange={handleInputChange} />
              <input type="text" name="htmlhash" placeholder="HTML Hash" value={lotteryParams.htmlhash} onChange={handleInputChange} />
              <input type="text" name="url" placeholder="URL" value={lotteryParams.url} onChange={handleInputChange} />
              <button onClick={createLottery}>Submit</button>
            </div>
          )}
        </div>
        <div>
          <h2>Set Payment Token</h2>
          <button onClick={() => setShowSetPaymentToken(!showSetPaymentToken)}>Set Payment Token</button>
          {showSetPaymentToken && (
            <div>
              <input type="text" placeholder="Token Address" value={tokenAddress} onChange={handleTokenAddressChange} />
              <button onClick={setPaymentToken}>Submit</button>
            </div>
          )}
        </div>
        <div>
          <h2>Enter Lottery</h2>
          <button onClick={enterLottery}>Enter Lottery</button>
        </div>
        <div>
          <h2>Get Lottery Winner</h2>
          <button onClick={getLotteryWinner}>Get Lottery Winner</button>
          {lotteryWinner && <p>Lottery Winner: {lotteryWinner}</p>}
        </div>
        <div>
          <h2>Get Ticket Data</h2>
          <button onClick={() => setShowGetTicketData(!showGetTicketData)}>Get Ticket Data</button>
          {showGetTicketData && (
            <div>
              <input type="text" name="i" placeholder="Ticket Index" value={ticketQuery.i} onChange={handleTicketQueryChange} />
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={getIthPurchasedTicketTx}>Submit</button>
            </div>
          )}
          {ticketData && <p>Ticket Data: {JSON.stringify(ticketData)}</p>}
        </div>
        <div>
          <h2>Get Lottery Info</h2>
          <button onClick={() => setShowGetLotteryInfo(!showGetLotteryInfo)}>Get Lottery Info</button>
          {showGetLotteryInfo && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={() => getLotteryInfo(ticketQuery.lottery_no)}>Submit</button>
            </div>
          )}
          {lotteryInfo && <p>Lottery Info: {JSON.stringify(lotteryInfo)}</p>}
        </div>
        <div>
          <h2>Get Lottery Sales</h2>
          <button onClick={() => setShowGetLotterySales(!showGetLotterySales)}>Get Lottery Sales</button>
          {showGetLotterySales && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={getLotterySales}>Submit</button>
            </div>
          )}
          {lotterySales && <p>Lottery Sales: {lotterySales.toString()}</p>}
        </div>
        <div>
          <h2>Get Lottery URL</h2>
          <button onClick={() => setShowGetLotteryURL(!showGetLotteryURL)}>Get Lottery URL</button>
          {showGetLotteryURL && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={getLotteryURL}>Submit</button>
            </div>
          )}
          {lotteryURL && <p>Lottery URL: {lotteryURL}</p>}
        </div>
        <div>
          <h2>Get Number of Purchase Transactions</h2>
          <button onClick={() => setShowGetNumPurchaseTxs(!showGetNumPurchaseTxs)}>Get Number of Purchase Transactions</button>
          {showGetNumPurchaseTxs && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={getNumPurchaseTxs}>Submit</button>
            </div>
          )}
          {numPurchaseTxs && <p>Number of Purchase Transactions: {numPurchaseTxs.toString()}</p>}
        </div>
        <div>
          <h2>Get Payment Token</h2>
          <button onClick={getPaymentToken}>Get Payment Token</button>
          {paymentToken && <p>Payment Token: {paymentToken.toString()}</p>}
        </div>
        <div>
          <h2>Get Start Time</h2>
          <button onClick={() => setShowGetStartTime(!showGetStartTime)}>Get Start Time</button>
          {showGetStartTime && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={getStartTime}>Submit</button>
            </div>
          )}
          {startTime && <p>Start Time: {startTime.toString()}</p>}
        </div>

        <div>
          <h2>Buy Ticket</h2>
          <div>
            <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
            <input type="number" name="quantity" placeholder="Quantity" value={ticketQuery.quantity} onChange={handleTicketQueryChange} />
            <input type="number" name="random_number" placeholder="Random Number" value={ticketQuery.random_number} onChange={handleTicketQueryChange} />
            <button onClick={buyTicket}>Submit</button>
          </div>
        </div>
        <div>
          <h2>Mint Tokens</h2>
          <button onClick={mintTokens}>Don't have TT tokens? Mint 1000 Tokens</button>

        </div>

      </header>
    </div>
  );
}

export default App;