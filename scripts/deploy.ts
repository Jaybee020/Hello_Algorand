import {
  makeApplicationCreateTxn,
  OnApplicationComplete,
  Transaction,
} from "algosdk";
import { user } from "./Config";
import {
  algodClient,
  compilePyTeal,
  compileTeal,
  submitTransaction,
} from "./Utils";

async function main() {
  let txn: Transaction;
  let txId: string;

  // compile PyTeal smart contracts
  const approval = await compileTeal(compilePyTeal("contracts/counter"));
  const clear = await compileTeal(compilePyTeal("contracts/clear_program"));

  // declare application state storage (immutable)
  let localInts = 0;
  let localBytes = 0;
  let globalInts = 1;
  let globalBytes = 0;
  // get transaction params
  const params = await algodClient.getTransactionParams().do();

  // create unsigned transaction
  txn = makeApplicationCreateTxn(
    user.addr,
    params,
    OnApplicationComplete.NoOpOC,
    approval,
    clear,
    localInts,
    localBytes,
    globalInts,
    globalBytes
  );
  txId = await submitTransaction(txn, user.sk);
  const appId = (await algodClient.pendingTransactionInformation(txId).do())[
    "application-index"
  ];

  console.log("Deposit application id: " + appId);
}

main().catch(console.error);
