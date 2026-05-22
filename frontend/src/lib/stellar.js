import { rpc, Networks } from '@stellar/stellar-sdk';

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const RPC_URL = 'https://soroban-testnet.stellar.org';
export const CONTRACT_ID = 'CDVGVCOVQV3AP7ARYZTZGWMHWOPQ7ERBGGUGIYHQ3HU54SLVQN7JVIP6';
export const TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Built-in Testnet XLM token

export const server = new rpc.Server(RPC_URL, { allowHttp: true });

// Check connection helper
export const checkConnection = async () => {
  try {
    const health = await server.getHealth();
    return health.status === 'healthy';
  } catch (error) {
    console.error('Error connecting to Soroban RPC:', error);
    return false;
  }
};
