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
  let fee = new BN(100); 

  
  const [marketplace, marketplaceBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    program.programId
  );


  const [treasury, treasuryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId
  );


  const [rewardMint, rewardMintBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    program.programId
  );

  it("Marketplace Initialized", async () => {
    const tx = await program.methods.initialize(
      fee,
      name
    )
    .accountsPartial({
      admin: admin.publicKey,
      marketplace:marketplace,
      treasury:treasury,
      rewardMint:rewardMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId
    })
    .rpc();
    
    console.log("Your transaction signature", tx);
    
    const marketplaceAccount = await program.account.marketplace.fetch(marketplace);
  });
});


