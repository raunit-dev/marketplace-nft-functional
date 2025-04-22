import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
  const connection = provider.connection;
  const name = "RAUNIT";

  //wallets
  const admin = provider.wallet;
  const maker = anchor.web3.Keypair.generate();
  let taker =  anchor.web3.Keypair.generate();

  //mints
  let makerMint: anchor.web3.PublicKey;
  let rewardMint: anchor.web3.PublicKey;

  //atas
  let makerAta: anchor.web3.PublicKey;
  let takerAta: anchor.web3.PublicKey;
  let takerRewardsAta: anchor.web3.PublicKey;

  //pdas
  let treasury: anchor.web3.PublicKey;
  let marketplace: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let listing: anchor.web3.PublicKey;
  
  //NFTthing
  let collectionMint: anchor.web3.PublicKey;
  let metedata: anchor.web3.PublicKey;
  let masterEdition: anchor.web3.PublicKey;
  


  before(async() => {
    
    const makerAirdropSignature = await connection.requestAirdrop(maker.publicKey,10 * LAMPORTS_PER_SOL);
    const takerAirdropSignature = await connection.requestAirdrop(taker.publicKey,10*LAMPORTS_PER_SOL);
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({ signature: makerAirdropSignature, ...latestBlockhash});
    await connection.confirmTransaction({ signature: takerAirdropSignature, ...latestBlockhash});
    await sleep(5000)
    
  })
  
  marketplace = PublicKey.findProgramAddressSync(
    [Buffer.from("marketplace"), Buffer.from(name)],
    program.programId
  )[0];


  treasury = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury"), marketplace.toBuffer()],
    program.programId
  )[0];


  rewardMint = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards"), marketplace.toBuffer()],
    program.programId
  )[0];


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


function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

