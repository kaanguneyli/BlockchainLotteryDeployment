import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import logo from './logo.svg';
import './App.css';

// Import ABIs
import AdminFacetABI from './ABIs/AdminFacet.json';
import LotteryFacetABI from './ABIs/LotteryFacet.json';
import QueryFacetABI from './ABIs/QueryFacet.json';

const LOTTERY_FACET_ADDRESS = '0x0165878a594ca255338adfa4d48449f69242eb8f';
const QUERY_FACET_ADDRESS = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853';
const ADMIN_FACET_ADDRESS = '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707';

function App() {
  const [web3, setWeb3] = useState(null);
  const [adminFacet, setAdminFacet] = useState(null);
  const [lotteryFacet, setLotteryFacet] = useState(null);
  const [queryFacet, setQueryFacet] = useState(null);
  const [account, setAccount] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [lotteryWinner, setLotteryWinner] = useState(null);
  const [ticketData, setTicketData] = useState(null);

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

  useEffect(() => {
    // Function to connect to MetaMask
    const connectMetaMask = async () => {
      if (window.ethereum) {
        try {
          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          // We use Web3 to interact with the blockchain
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          console.log(web3Instance);

          // Get the user's accounts
          const accounts = await web3Instance.eth.getAccounts();
          setAccount(accounts[0]);

          // Diamond contract address
          
          // Creating contract instances using the Diamond contract address
          const adminFacetInstance = new web3Instance.eth.Contract(AdminFacetABI, LOTTERY_FACET_ADDRESS );
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
  }, []);

  // Functions to interact with the contracts
  const createLottery = async () => {
    const { unixEnd, nooftickets, noofwinners, minpercentage, ticketprice, htmlhash, url } = lotteryParams;
    if (adminFacet && account) {
      try {
        console.log('Creating lottery...');
        await adminFacet.methods.createLottery(
          unixEnd,
          nooftickets,
          noofwinners,
          minpercentage,
          web3.utils.toWei(ticketprice, 'ether'),
          web3.utils.asciiToHex(htmlhash),
          url
        ).send({ from: account });
        console.log('Lottery created');
      } catch (error) {
        console.error('Error creating lottery:', error);
      }
    } else {
      console.error('AdminFacet contract or account is not set');
    }
  };

  const setPaymentToken = async () => {
    if (adminFacet && account) {
      try {
        console.log('Setting payment token...');
        await adminFacet.methods.setPaymentToken(tokenAddress).send({ from: account });
        console.log('Payment token set');
      } catch (error) {
        console.error('Error setting payment token:', error);
      }
    } else {
      console.error('AdminFacet contract or account is not set');
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

  const getLotteryWinner = async () => {
    if (queryFacet) {
      try {
        console.log('Fetching lottery winner...');
        const winner = await queryFacet.methods.getWinner().call();
        setLotteryWinner(winner);
        console.log('Lottery Winner:', winner);
      } catch (error) {
        console.error('Error fetching lottery winner:', error);
      }
    } else {
      console.error('QueryFacet contract is not set');
    }
  };

  const getIthPurchasedTicketTx = async () => {
    const { i, lottery_no } = ticketQuery;
    if (queryFacet) {
      try {
        console.log(`Fetching ticket data for lottery ${lottery_no}, ticket ${i}...`);
        const result = await queryFacet.methods.getIthPurchasedTicketTx(i, lottery_no).call();
        setTicketData(result);
        console.log('Ticket Data:', result);
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      }
    } else {
      console.error('QueryFacet contract is not set');
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
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
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
        </div>
        {adminData && <p>Admin Data: {adminData}</p>}
        {lotteryWinner && <p>Lottery Winner: {lotteryWinner}</p>}
        {ticketData && <p>Ticket Data: {JSON.stringify(ticketData)}</p>}
      </header>
    </div>
  );
}

export default App;