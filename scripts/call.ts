import {
  encodeUint64,
  getApplicationAddress,
  makeApplicationNoOpTxn,
  makeBasicAccountTransactionSigner,
  Transaction,
  ABIContract,
  AtomicTransactionComposer,
  ABIMethod,
} from "algosdk";
import { getMethodByName } from "./utils";
import { appId, user } from "./Config";
import { algodClient, submitTransaction } from "./Utils";

async function main() {
  let txId: string;
  let txn;

  // get transaction params
  const params = await algodClient.getTransactionParams().do();

  // deposit
  const enc = new TextEncoder();
  const depositAmount = 1e6; // 1 ALGO

  //   txn = makeApplicationNoOpTxn(
  //     user.addr,
  //     { ...params, flatFee: true, fee: 2000 }, // must pay for inner transaction
  //     appId,
  //     [enc.encode("d"), encodeUint64(depositAmount)]
  //   );
  //   txId = await submitTransaction(txn, user.sk);

  //   console.log("Deposit transaction id: " + txId);

  const commonParams = {
    appID: 0,
    sender: user.addr,
    suggestedParams: params,
    signer: makeBasicAccountTransactionSigner(user),
  };

  let atc = new AtomicTransactionComposer();
  atc.addMethodCall({
    method: getMethodByName("add"),
    methodArgs: [1],
    ...commonParams,
  });
  atc.addMethodCall({
    method: getMethodByName("add"),
    methodArgs: [1],
    ...commonParams,
  });

  //   This method requires a `transaction` as its second argument. Construct the transaction and pass it in as an argument.
  //   The ATC will handle adding it to the group transaction and setting the reference in the application arguments.
  txn = {
    txn: new Transaction({
      from: user.addr,
      to: user.addr,
      amount: 10000,
      suggestedParams: params,
    }),
    signer: makeBasicAccountTransactionSigner(user),
  };
  atc.addMethodCall({
    method: getMethodByName("txntest"),
    methodArgs: [10000, txn, 1000],
    ...commonParams,
  });
}

main().catch(console.error);
