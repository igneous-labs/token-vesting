import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from 'fs';
import { unlock } from "./main";
import { signTransactionInstructions } from "./utils";


/**
 *
 * Simple example of unlocking after vesting is complete
 *
 * This is just an example, please be careful using the vesting contract and test it first with test tokens.
 *
 */


/** Your RPC connection */
const connection = new Connection('');

/** ProgramId */
const TOKEN_VESTING_PROGRAM_ID = new PublicKey('');

/** Vesting contract seed */
const CONTRACT_SEED = Buffer.from('');

/** Token info */
const MINT = new PublicKey('');

/** Path to your wallet */
const WALLET_PATH = '';
const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH).toString())),
);

const callUnlock = async () => {
  const instructions = await unlock(
    connection,
    TOKEN_VESTING_PROGRAM_ID,
    CONTRACT_SEED,
    MINT
  );

  const tx = await signTransactionInstructions(
    connection,
    [wallet],
    wallet.publicKey,
    instructions,
  );

  console.log(`Transaction: ${tx}`);
}

callUnlock();