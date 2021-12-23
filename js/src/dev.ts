import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import fs from 'fs';
import {
  Numberu64,
  generateRandomSeed,
  signTransactionInstructions,
} from './utils';
import { Schedule } from './state';
import { create } from './main';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';

/**
 *
 * Simple example of a linear unlock.
 *
 * This is just an example, please be careful using the vesting contract and test it first with test tokens.
 *
 */

/** Your RPC connection */
const connection = new Connection('');

/** ProgramId */
const TOKEN_VESTING_PROGRAM_ID = new PublicKey('');

/** Info about the source */
const SOURCE_TOKEN_ACCOUNT = new PublicKey('');

/** Info about the desintation 
 * Since we're using the associated token account, make sure this is human/on the curve
 * The corresponding ATA for the MINT needs to be created BEFORE running this
 */
const DESTINATION_OWNER = new PublicKey('');

/** Token info */
const MINT = new PublicKey('');

/** Path to your wallet */
const WALLET_PATH = '';
const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(WALLET_PATH).toString())),
);

/** There are better way to generate an array of dates but be careful as it's irreversible */
type ScheduleArgs = {
  date: Date,
  amountAtomics: number,
}
const SCHEDULES: ScheduleArgs[] = [
  { date: new Date("2021-12-23T11:00:00.000+08:00"), amountAtomics: 1_000}
]

/** Do some checks before sending the tokens */
const checks = async (destinationTokenAccount: PublicKey) => {
  const tokenInfo = await connection.getParsedAccountInfo(
    destinationTokenAccount,
  );

  // @ts-ignore
  const parsed = tokenInfo.value.data.parsed;
  if (parsed.info.mint !== MINT.toBase58()) {
    throw new Error('Invalid mint');
  }
  if (parsed.info.owner !== DESTINATION_OWNER.toBase58()) {
    throw new Error('Invalid owner');
  }
};

/** Function that locks the tokens */
const lock = async () => {
  const destinationTokenAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    MINT,
    DESTINATION_OWNER
  );
  await checks(destinationTokenAccount);

  const schedules: Schedule[] = SCHEDULES.map(({ date, amountAtomics }) => new Schedule(
    new Numberu64(date.getTime() / 1_000),
    new Numberu64(amountAtomics),
  ));

  const seed = generateRandomSeed();

  console.log(`Seed: ${seed}`);

  const instruction = await create(
    connection,
    TOKEN_VESTING_PROGRAM_ID,
    Buffer.from(seed),
    wallet.publicKey,
    wallet.publicKey,
    SOURCE_TOKEN_ACCOUNT,
    destinationTokenAccount,
    MINT,
    schedules,
  );

  const tx = await signTransactionInstructions(
    connection,
    [wallet],
    wallet.publicKey,
    instruction,
  );

  console.log(`Transaction: ${tx}`);
};

lock();
