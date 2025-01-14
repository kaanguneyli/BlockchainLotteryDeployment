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
const { keccak256, defaultAbiCoder } = ethers.utils;


/* const LOTTERY_FACET_ADDRESS = '0x0165878a594ca255338adfa4d48449f69242eb8f';
const QUERY_FACET_ADDRESS = '0xa513e6e4b8f2a923d98304ec87f64353c4d5c853';
const ADMIN_FACET_ADDRESS = '0x5fc8d32690cc91d4c39d9d3abcbd16989f875707';
 */

const DIAMOND_address = '0xfD6E07Ada020e09aADa1186285D367F58d1ADae4';
let TOKEN_ADDRESS = '0xb9eACAB6AB61dbcA9534FcEC65Ef136FE351233B';
 

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
  const [hashedRandom, setHashedRandom] = useState(null);
  const [lotteryNo, setLotteryNo] = useState(null);
  const [sticketNo, setSticketNo] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [quantity, setQuantity] = useState(null);

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
  const [ticketQuery, setTicketQuery] = useState({ i: '', lottery_no: '' , rand: 0, sticket_no: 0});

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

  const [ticketCheckResult, setTicketCheckResult] = useState(null);
  const [ticketCheckParams, setTicketCheckParams] = useState({
    lottery_no: '',
    ticketNo: ''
  });
  const [ticketCheckError, setTicketCheckError] = useState(null);
  const [revealParams, setRevealParams] = useState({
    lottery_no: '',
    sticketno: '',
    quantity: '',
    rnd_number: '',
  });
  const [revealRndError, setRevealRndError] = useState(null);
  const [checkAddrParams, setCheckAddrParams] = useState({
    addr: '',
    lottery_no: '',
    ticketNo: '',
  });
  const [addrTicketCheckResult, setAddrTicketCheckResult] = useState(null);
  const [addrTicketCheckError, setAddrTicketCheckError] = useState(null);
  const [winningTicketParams, setWinningTicketParams] = useState({
    lottery_no: '',
    i: ''
  });
  const [winningTicketResult, setWinningTicketResult] = useState(null);
  const [winningTicketError, setWinningTicketError] = useState(null);
    

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
        adminFacetInstance.on("LotteryCreated", (lottery_no) => {
          console.log("Lottery Created with No:", lottery_no.toString());
          setLotteryNo(lottery_no.toString()); // Update state with the lottery_no
        });

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

        const formattedResult = {
        startTime: result[0].toString(), // Convert BigNumber to string
        totalTickets: result[1].toString(), // Convert BigNumber to string
        winnersCount: result[2].toString(), // Convert BigNumber to string
        minPercentage: result[3].toString(), // Convert BigNumber to string
        ticketPrice: ethers.utils.formatEther(result[4]) // Convert BigNumber to string
      };

      setLotteryInfo(formattedResult);
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

        setLotteryURL(result[1]);
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

  const getHashedRandom = async () => {
    const { random_n } = ticketQuery;
    if (account) {
      var value = keccak256(defaultAbiCoder.encode(["address", "uint256"], [account, random_n]));
      setHashedRandom(value);
    }
  }

  const getIthPurchasedTicketTx = async ( i ) => {
    const { lottery_no } = ticketQuery;
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
  

  /* const withdrawRefund = async() => {
    const { lottery_no } = ticketQuery;
    const { sticket_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
    console.log(sticket_no);
    await getIthPurchasedTicketTx(ethers.BigNumber.from(sticket_no).toNumber()+1);  
    const lot_info = await getLotteryInfo(lottery_no); // Pass lottery_no to get lottery info
    var quantity = (ticketData[1].toNumber());
    const ticket_price = (lot_info[4].div(ethers.BigNumber.from("1000000000000000000"))).toNumber();

     try {
    
      if (!account) {
        console.error('Account is not set');
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(account); // Use the account's signer
      
      const tokenAbi = [
        // Minimal ABI to call mint and burn
        "function mint(address to, uint256 amount) public",
        "function burn(uint256 amount) public"

    ];
    const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenAbi, signer);

    const amount = ethers.utils.parseUnits((quantity*ticket_price).toString(), 18); 

    // TODO: CALL THE REFUND IN SOLIDITY BEFORE THE TRANSFERS
    const tx = await tokenContract.mint(account, amount);
    await tx.wait(); // Wait for transaction confirmation

    const tx2 = await tokenContract.burn(DIAMOND_address, amount);
    await tx2.wait(); // Wait for transaction confirmation
  } catch (error){
    console.error("Failed to withdraw refund", error);
  }
  } */

  const withdrawRefund = async() => {
    const { lottery_no } = ticketQuery;
    const { sticket_no } = ticketQuery;
    const { adminFacetInstance } = await getLotteryContract();
    console.log(sticket_no);
    console.log(lottery_no);
    try{
      const tx = await adminFacetInstance.withdrawTicketRefund(parseInt(lottery_no), parseInt(sticket_no), { gasLimit: 5000000 });
     tx.wait();

      console.log("Refund Successful");
    }
    catch (error){
      console.error("Refund Failed", error);
    }

  }


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLotteryParams({ ...lotteryParams, [name]: value });
  };

  const handleTokenAddressChange = (e) => {
    setTokenAddress(e.target.value);
  };

  const handleTicketQueryChange = (e) => {
    const { name, value } = e.target;
    setTicketQuery(prevState => ({ ...prevState, [name]: value }));
    ;  };
  
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
      const {random_number} = ticketQuery;
      const lot_info = await getLotteryInfo(lottery_no); // Pass lottery_no to get lottery info

      const ticketPrice = (lot_info[4].div(ethers.BigNumber.from("1000000000000000000"))).toNumber();

      console.log('Preparing to approve the recipient to spend tokens...');
      const amount = ethers.utils.parseEther((ticketPrice*quantity).toString()); // The least possible amount

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner(account); // Use the account's signer
   
      const adminFacetInstance=  new ethers.Contract(DIAMOND_address, Main_Facet_ABI, signer);

      // Create an instance of the ERC20 token
      const tokenInstance = new ethers.Contract(TOKEN_ADDRESS, ERC20ABI, signer);
  
      // Address of the recipient (contract or address to receive tokens)
      const recipient = DIAMOND_address; // Replace with your recipient contract or address
  
      // Step 1: Approve the recipient to spend tokens on behalf of the account
      const approveTx = await tokenInstance.approve(recipient, amount);
      await approveTx.wait();
      console.log(`Approved ${ethers.utils.formatEther(amount)} tokens for recipient: ${recipient}`);  
      const result = await adminFacetInstance.buyTicketTx(parseInt(lottery_no),parseInt(quantity),  random_number, { gasLimit: 5000000 });
      console.log('Ticket purchased successfully');
      console.log('Ticket Purchase Result:', result);

      adminFacetInstance.on("TicketPurchased", (lotteryNo, sticketno, buyer, quantity) => {
        setLotteryNo(lotteryNo);
        setSticketNo(sticketno-quantity);
        setBuyer(buyer);
        setQuantity(quantity);
      });
    } catch (error) {
      console.error('Error during token transfer:', error);
    }
  };

  const handleTicketCheckChange = (e) => {
    const { name, value } = e.target;
    setTicketCheckParams({ ...ticketCheckParams, [name]: value });
  };
  
  const checkIfMyTicketWon = async () => {
    const { lottery_no, ticketNo } = ticketCheckParams;
    const { adminFacetInstance } = await getLotteryContract();
  
    setTicketCheckError(null); // Reset the error state before making the call
  
    try {
      console.log(`Checking if ticket ${ticketNo} in lottery ${lottery_no} has won...`);
      const result = await adminFacetInstance.checkIfMyTicketWon(parseInt(lottery_no), parseInt(ticketNo));
      setTicketCheckResult(result);
      console.log('Ticket Check Result:', result);
    } catch (error) {
      console.error('Error checking if ticket won:', error);
      setTicketCheckError(error.message || 'An error occurred while checking your ticket.');
    }
  };

  const handleRevealInputChange = (e) => {
    const { name, value } = e.target;
    setRevealParams({ ...revealParams, [name]: value });
  };

  const revealRandomNumber = async () => {
    const { lottery_no, sticketno, quantity, rnd_number } = revealParams;
    const { adminFacetInstance } = await getLotteryContract();
  
    if (adminFacetInstance) {
      // try {
        console.log(`Revealing random number for lottery ${lottery_no}...`);
        console.log("rnd_number JS:", parseInt(rnd_number), "Type:", typeof parseInt(rnd_number));
      /*   const computedHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(["address", "uint256"], [account, parseInt(rnd_number)])
        ); */
/*         console.log("Computed Hash:", computedHash);        
 */        const tx = await adminFacetInstance.revealRndNumberTx(
          parseInt(lottery_no),
          parseInt(sticketno),
          parseInt(quantity),
          parseInt(rnd_number),
          { gasLimit: 10000000 }
        );
        await tx.wait();
        console.log('Random number revealed successfully');
        setRevealRndError(null); // Clear any previous error
      // } catch (error) {
      //   console.error('Error revealing random number:', error);
      //   const errorMessage = error?.reason || error?.data?.message || 'An error occurred. Please check your inputs and try again.';
      //   setRevealRndError(errorMessage);
      // }
    } else {
      console.error('AdminFacet contract or account is not set');
      setRevealRndError('AdminFacet contract or account is not set');
    }
  };

  const handleAddrCheckInputChange = (e) => {
    const { name, value } = e.target;
    setCheckAddrParams({ ...checkAddrParams, [name]: value });
  };

  const checkIfAddrTicketWon = async () => {
    const { addr, lottery_no, ticketNo } = checkAddrParams;
    const { adminFacetInstance } = await getLotteryContract();
  
    setAddrTicketCheckError(null); // Reset the error state before making the call
  
    if (adminFacetInstance) {
      try {
        console.log(`Checking if address ${addr}'s ticket ${ticketNo} in lottery ${lottery_no} has won...`);
        const result = await adminFacetInstance.checkIfAddrTicketWon(
          addr,
          parseInt(lottery_no),
          parseInt(ticketNo)
        );
        setAddrTicketCheckResult(result);
        console.log('Address Ticket Check Result:', result);
      } catch (error) {
        console.error('Error checking if address ticket won:', error);
        setAddrTicketCheckError(error.message || 'An error occurred while checking the address ticket.');
      }
    } else {
      console.error('AdminFacet contract or account is not set');
      setAddrTicketCheckError('AdminFacet contract or account is not set');
    }
  };

  const handleWinningTicketInputChange = (e) => {
    const { name, value } = e.target;
    setWinningTicketParams({ ...winningTicketParams, [name]: value });
  };

  const getIthWinningTicket = async () => {
    const { lottery_no, i } = winningTicketParams;
    const { adminFacetInstance } = await getLotteryContract();
  
    setWinningTicketError(null); // Reset the error state before making the call
  
    if (adminFacetInstance) {
      try {
        console.log(`Fetching the ${i}th winning ticket for lottery ${lottery_no}...`);
        const ticketNo = await adminFacetInstance.getIthWinningTicket(
          parseInt(lottery_no),
          parseInt(i)
        );
        setWinningTicketResult(ticketNo.toString());
        console.log('Winning Ticket Number:', ticketNo.toString());
      } catch (error) {
        console.error('Error fetching winning ticket:', error);
        // Display meaningful error messages
        setWinningTicketError(error.message || 'An error occurred while fetching the winning ticket.');
      }
    } else {
      console.error('AdminFacet contract or account is not set');
      setWinningTicketError('AdminFacet contract or account is not set');
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
              <input type="text" name="ticketprice" placeholder="Ticket Price (TT)" value={lotteryParams.ticketprice} onChange={handleInputChange} />
              <input type="text" name="htmlhash" placeholder="HTML Hash" value={lotteryParams.htmlhash} onChange={handleInputChange} />
              <input type="text" name="url" placeholder="URL" value={lotteryParams.url} onChange={handleInputChange} />
              <button onClick={createLottery}>Submit</button>

              {lotteryNo && <p>Newly Created Lottery Number: {lotteryNo.toString()}</p>}

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
          <h2>Get Lottery Info</h2>
          <button onClick={() => setShowGetLotteryInfo(!showGetLotteryInfo)}>Get Lottery Info</button>
          {showGetLotteryInfo && (
            <div>
              <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
              <button onClick={() => getLotteryInfo(ticketQuery.lottery_no)}>Submit</button>
            </div>
          )}
          {lotteryInfo && (
              <div>
                <p>Start Time: {lotteryInfo.startTime}</p>  
                <p>Total Tickets: {lotteryInfo.totalTickets}</p>
                <p>Winners Count: {lotteryInfo.winnersCount}</p>
                <p>Minimum Percentage: {lotteryInfo.minPercentage}</p>
                <p>Ticket Price: {lotteryInfo.ticketPrice} TT</p>
              </div>
            )}
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
      <h2>Get Hashed Number</h2>
      <input
        type="number"
        name="random_n"
        placeholder="Random Number"
        value={ticketQuery.random_n}
        onChange={handleTicketQueryChange}
      />
      <button onClick={getHashedRandom}>Submit</button>
      <p>Your Hashed Number: {hashedRandom}</p>
    </div>

        <div>
          <h2>Buy Ticket</h2>
          <div>
            <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
            <input type="number" name="quantity" placeholder="Quantity" value={ticketQuery.quantity} onChange={handleTicketQueryChange} />
            <input type="text" name="random_number" placeholder="Random Number" value={ticketQuery.random_number} onChange={handleTicketQueryChange} />
            <button onClick={buyTicket}>Submit</button>
            {lotteryNo && <p>Purshased for lottery number: {lotteryNo.toString()}</p>}
            {sticketNo && <p>Your sticketNo - save this for your reveal: {sticketNo.toString()}</p>}
            {buyer && <p>Address of purchase: {buyer.toString()}</p>}
            {quantity && <p>Quantity of tickets in this set: {quantity.toString()}</p>}
            </div>
        </div>

        <div>
          <h2>Mint Tokens</h2>
          <button onClick={mintTokens}>Don't have TT tokens? Mint 1000 Tokens</button>

        </div>

        <div>
          <h2>Reveal Random Number</h2>
          <div>
            <input
              type="text"
              name="lottery_no"
              placeholder="Lottery Number"
              value={revealParams.lottery_no}
              onChange={handleRevealInputChange}
            />
            <input
              type="text"
              name="sticketno"
              placeholder="Starting Ticket Number"
              value={revealParams.sticketno}
              onChange={handleRevealInputChange}
            />
            <input
              type="text"
              name="quantity"
              placeholder="Quantity"
              value={revealParams.quantity}
              onChange={handleRevealInputChange}
            />
            <input
              type="text"
              name="rnd_number"
              placeholder="Random Number"
              value={revealParams.rnd_number}
              onChange={handleRevealInputChange}
            />
            <button onClick={revealRandomNumber}>Submit</button>
            {revealRndError && <p style={{ color: 'red' }}>{revealRndError}</p>}
          </div>
        </div>

        <div>
          <h2>Check If My Ticket Won</h2>
          <div>
            <input
              type="text"
              name="lottery_no"
              placeholder="Lottery Number"
              value={ticketCheckParams.lottery_no}
              onChange={handleTicketCheckChange}
            />
            <input
              type="text"
              name="ticketNo"
              placeholder="Ticket Number"
              value={ticketCheckParams.ticketNo}
              onChange={handleTicketCheckChange}
            />
            <button onClick={checkIfMyTicketWon}>Check</button>
          </div>
          {ticketCheckResult !== null && (
            <p>{ticketCheckResult ? "Your ticket won!" : "Better luck next time!"}</p>
          )}
          {ticketCheckError && (
            <p style={{ color: 'red' }}>{ticketCheckError}</p>
          )}
        </div>

        <div>
          <h2>Check If Address Ticket Won</h2>
          <div>
            <input
              type="text"
              name="addr"
              placeholder="Address"
              value={checkAddrParams.addr}
              onChange={handleAddrCheckInputChange}
            />
            <input
              type="text"
              name="lottery_no"
              placeholder="Lottery Number"
              value={checkAddrParams.lottery_no}
              onChange={handleAddrCheckInputChange}
            />
            <input
              type="text"
              name="ticketNo"
              placeholder="Ticket Number"
              value={checkAddrParams.ticketNo}
              onChange={handleAddrCheckInputChange}
            />
            <button onClick={checkIfAddrTicketWon}>Check</button>
            {addrTicketCheckResult !== null && (
              <p>{addrTicketCheckResult ? "This ticket won!" : "This ticket did not win."}</p>
            )}
            {addrTicketCheckError && <p style={{ color: 'red' }}>{addrTicketCheckError}</p>}
          </div>
        </div>

        
        <div>
          <h2>Refund Ticket</h2>
          <div>
            <input type="text" name="lottery_no" placeholder="Lottery Number" value={ticketQuery.lottery_no} onChange={handleTicketQueryChange} />
            <input type="number" name="sticket_no" placeholder="sticketNo" value={ticketQuery.sticket_no} onChange={handleTicketQueryChange} />
            <button onClick={withdrawRefund}>Submit</button>
            </div>
        </div>



        <div>
          <h2>Get Ith Winning Ticket</h2>
          <div>
            <input
              type="text"
              name="lottery_no"
              placeholder="Lottery Number"
              value={winningTicketParams.lottery_no}
              onChange={handleWinningTicketInputChange}
            />
            <input
              type="text"
              name="i"
              placeholder="Index of Winner"
              value={winningTicketParams.i}
              onChange={handleWinningTicketInputChange}
            />
            <button onClick={getIthWinningTicket}>Check</button>
            {winningTicketResult !== null && (
              <p>Winning Ticket Number: {winningTicketResult}</p>
            )}
            {winningTicketError && (
              <p style={{ color: 'red' }}>{winningTicketError}</p>
            )}
          </div>
        </div>

      </header>
    </div>
  );
}

export default App;