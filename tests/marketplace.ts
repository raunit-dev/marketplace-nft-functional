import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Marketplace } from "../target/types/marketplace";

describe("marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.marketplace as Program<Marketplace>;
  const connection = provider.connection;
  const name = "m";

  const admin = provider.wallet;
  const maker = anchor.web3.Keypair.generate();

  let treasury: anchor.web3.PublicKey;
  let marketplace: anchor.web3.PublicKey;
  let rewardMint: anchor.web3.PublicKey;


  before(async () => {
    const makerAirdropSignature = await connection.requestAirdrop(
      maker.publicKey,
      4 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({
      signature: makerAirdropSignature,
      ...latestBlockhash,
    });

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
      .accountsPartial({
        admin: admin.publicKey,
        marketplace,
        treasury,
        rewardMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Your transaction signature", tx);
  });
});
