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

/* const LOTTERY_FACET_ADDRESS = '0x0165878a594ca255338adfa4d48449f69242eb8f';
const QUERY_FACET_ADDRESS = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853';
const ADMIN_FACET_ADDRESS = '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707';
 */

const DIAMOND_address = '0x62556990068106800d7dc48edae0d9801d1ebf3886db725ef4a4772d8a16cb23';


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

/*   useEffect(() => {
    // Function to connect to MetaMask
    const connectMetaMask = async () => {
      if (window.ethereum) {
        try {
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // We use Web3 to interact with the blockchain
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          // Get the user's accounts
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          // Creating contract instances using the Diamond contract address
          const adminFacetInstance = new web3Instance.eth.Contract(AdminFacetABI, ADMIN_FACET_ADDRESS);
          const lotteryFacetInstance = new web3Instance.eth.Contract(LotteryFacetABI, LOTTERY_FACET_ADDRESS);
          const queryFacetInstance = new web3Instance.eth.Contract(QueryFacetABI, QUERY_FACET_ADDRESS);

          setAdminFacet(adminFacetInstance);
          setLotteryFacet(lotteryFacetInstance);
          setQueryFacet(queryFacetInstance);

          console.log('MetaMask connected');
          console.log('AdminFacet:', adminFacetInstance);
          console.log('LotteryFacet:', lotteryFacetInstance);
          console.log('QueryFacet:', queryFacetInstance);
        } catch (error) {
          console.error('User denied account access or error occurred', error);
        }
      } else {
        console.error('MetaMask not detected');
      }
    };

    connectMetaMask();
  }, []); */

  const getLotteryContract = async () => {
    if (!window.ethereum) throw new Error("Metamask is not installed");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    // Await the network validation to ensure it's on the correct network
    const network = await provider.getNetwork();
    if (network.chainId !== 31337) {
      alert(
        "Please switch MetaMask to Hardhat Localhost Network (Chain ID 31337)"
      );
      throw new Error("Incorrect network");
    }
    const adminFacetInstance=  new ethers.Contract(DIAMOND_address, Main_Facet_ABI, signer);
  /*   const lotteryFacetInstance = new ethers.Contract(DIAMOND_address, LotteryFacetABI, signer);
    const queryFacetInstance = new ethers.Contract(DIAMOND_address, QueryFacetABI, signer); */
    setAdminFacet(adminFacetInstance);
/*     setLotteryFacet(lotteryFacetInstance);
    setQueryFacet(queryFacetInstance); */

    console.log('AdminFacet:', adminFacetInstance);
/*     console.log('LotteryFacet:', lotteryFacetInstance);
    console.log('QueryFacet:', queryFacetInstance);
    console.log(await adminFacetInstance.functions); */
    return { adminFacetInstance };
/*     return { adminFacetInstance, lotteryFacetInstance, queryFacetInstance }; */


  };

  useEffect(() => {
    getLotteryContract();
  }
  , []);



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
  const getLotteryInfo = async () => {
    const { lottery_no } = ticketQuery;
    const {adminFacetInstance} = await getLotteryContract();

    if (adminFacetInstance) {
      try {
        console.log(`Fetching lottery info for lottery ${lottery_no}...`);
        const result = await adminFacetInstance.getLotteryInfo(lottery_no);
        setLotteryInfo(result);
        console.log('Lottery Info:', result);
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

  const enterLottery = async () => {
    if (lotteryFacet && account) {
      try {
        console.log('Entering lottery...');
        await lotteryFacet.methods.enter().send({ from: account, value: web3.utils.toWei('0.1', 'ether') });
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
        const result = await adminFacetInstance.getNumPurchaseTxs(lottery_no);
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
              <button onClick={getLotteryInfo}>Submit</button>
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
      </header>
    </div>
  );
}

export default App;