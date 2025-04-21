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
  const user = anchor.web3.Keypair.generate();
  const name = new String("RAUNIT");

  const [marketplace, marketplaceBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), admin.publicKey.toBuffer(), name.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  it("Marketplace Initialized", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
