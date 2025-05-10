import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Marketplace } from "../target/types/marketplace";
import { Key } from "@metaplex-foundation/mpl-token-metadata";

describe("marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.marketplace as Program<Marketplace>;
  const connection = provider.connection;
  const name = "m";

  let admin: Keypair;
  let maker: Keypair;
  let taker: Keypair;
  let treasury: PublicKey;
  let marketplace: PublicKey;
  let rewardMint: PublicKey;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=custom&customUrl=${connection.rpcEndpoint}`
    );
    return signature;
  };


  before(async () => {
 
    admin = Keypair.generate();
    const transfer1 = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: admin.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL
    });
    const tx1 = new Transaction().add(transfer1);
    await provider.sendAndConfirm(tx1);

    maker = Keypair.generate();
    const transfer2 = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: maker.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL
    })
    const tx2 = new Transaction().add(transfer2);
    await provider.sendAndConfirm(tx2);

    taker = Keypair.generate();
    const transfer3 = SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: taker.publicKey,
      lamports: 10 * LAMPORTS_PER_SOL
    })
    const tx3 = new Transaction().add(transfer3);
    await provider.sendAndConfirm(tx3);

    marketplace = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(name)],
      program.programId
    )[0];
  
    treasury = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.toBuffer()],
      program.programId
    )[0];
  
    rewardMint = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rewards"), marketplace.toBuffer()],
      program.programId
    )[0];



  });

  it("Marketplace Initialized", async () => {
    const tx = await program.methods
      .initialize(1, name)
      .accountsStrict({
        admin: admin.publicKey,
        marketplace,
        treasury,
        rewardMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([admin])
      .rpc()
      .then(confirm)
      .then(log);



    console.log("Your transaction signature", tx);
  });
});
