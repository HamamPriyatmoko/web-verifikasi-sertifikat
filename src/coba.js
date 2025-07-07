import Web3 from 'web3';
import contractABI from './abi/BlockchainSertifikasi.json' assert { type: 'json' };

const web3 = new Web3('http://127.0.0.1:7545');
const contract = new web3.eth.Contract(contractABI, '0xFeCF8937A0375c4340338dF5826649D70312C155');
const hash = 'b7f79e198d23a5c07f944138af1155d4897dd22a85023ca60fb29f354aae24fc';

contract.methods
  .findSertifikatHash(hash)
  .call()
  .then((result) => console.log('Sertifikat:', result))
  .catch((err) => console.error('Error:', err));
