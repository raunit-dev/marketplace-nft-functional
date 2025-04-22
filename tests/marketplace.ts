import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { 
  getAssociatedTokenAddressSync, 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { Marketplace } from "../target/types/marketplace";

describe("marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.marketplace as Program<Marketplace>;
  const admin = provider.wallet;
  const name = "RAUNIT";



  
  const marketplace = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    program.programId
  )[0];


  const treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId
  )[0];


  const rewardMint = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    program.programId
  )[0];


  console.log("Name:", name);
  console.log("Marketplace PDA:", marketplace.toString());
  console.log("Treasury PDA:", treasury.toString());
  console.log("Reward Mint PDA:", rewardMint.toString());

  it("Marketplace Initialized", async () => {
    const tx = await program.methods.initialize(
      1,
      name
    )
    .accountsPartial({
      admin: admin.publicKey,
      marketplace,
      treasury,
      rewardMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })
    .rpc();
    
    console.log("Your transaction signature", tx);
    
    const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
  });
});


