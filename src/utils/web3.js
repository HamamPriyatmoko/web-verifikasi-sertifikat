// src/utils/web3.js
import Web3 from 'web3';

// Ambil dari .env, fallback ke Ganache default jika kosong
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:7545';

export const web3Read = new Web3(RPC_URL);
