import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createNft,
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  verifySizedCollectionItem,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  KeypairSigner,
  PublicKey,
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";
import {
  TOKEN_PROGRAM_ID,
  createThawAccountInstruction,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { Marketplace } from "../target/types/marketplace";

describe("marketplace", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.marketplace as Program<Marketplace>;
  const connection = provider.connection;
  const name = "m";
  const price = new anchor.BN(1);
  const umi = createUmi(provider.connection);
  const payer = provider.wallet as NodeWallet;

  // Wallets
  const admin = provider.wallet;
  const maker = anchor.web3.Keypair.generate();
  let taker = anchor.web3.Keypair.generate();

  let makerAta: anchor.web3.PublicKey;
  let takerAta: anchor.web3.PublicKey;
  let takerRewardsAta: anchor.web3.PublicKey;

  let treasury: anchor.web3.PublicKey;
  let marketplace: anchor.web3.PublicKey;
  let rewardMint: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let listing: anchor.web3.PublicKey;

  let collectionMint: KeypairSigner;
  let metedata: KeypairSigner;
  let masterEdition: KeypairSigner;
  let nftMint: KeypairSigner;

  nftMint = generateSigner(umi);
  collectionMint = generateSigner(umi);

  const creatorWallet = umi.eddsa.createKeypairFromSecretKey(
    payer.payer.secretKey
  );
  const creator = createSignerFromKeypair(umi, creatorWallet);
  umi.use(keypairIdentity(creator));
  umi.use(mplTokenMetadata());

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

  listing = anchor.web3.PublicKey.findProgramAddressSync(
    [
      marketplace.toBuffer(),
      new anchor.web3.PublicKey(nftMint.publicKey as PublicKey).toBuffer(),
    ],
    program.programId
  )[0];

  before(async () => {
    const makerAirdropSignature = await connection.requestAirdrop(
      maker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    const takerAirdropSignature = await connection.requestAirdrop(
      taker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction({
      signature: makerAirdropSignature,
      ...latestBlockhash,
    });
    await connection.confirmTransaction({
      signature: takerAirdropSignature,
      ...latestBlockhash,
    });
    await sleep(2000);

    await createNft(umi, {
      name: "RAUNIT",
      mint: collectionMint,
      symbol: "rj",
      uri: "https://raunit.net/15",
      sellerFeeBasisPoints: percentAmount(5.5),
      collectionDetails: { __kind: "V1", size: 10 },
    }).sendAndConfirm(umi);
    console.log(`Created Collection NFT: ${collectionMint.publicKey.toString()}`);

    await createNft(umi, {
      mint: nftMint,
      name: "RAUNIT",
      symbol: "rj",
      uri: "https://raunit.net/15",
      sellerFeeBasisPoints: percentAmount(5.5),
      collection: { verified: false, key: collectionMint.publicKey },
      tokenOwner: publicKey(maker.publicKey), // Corrected to use maker's public key
    }).sendAndConfirm(umi);
    console.log(`Created NFT: ${nftMint.publicKey.toString()}`);

    const collectionMetadata = findMetadataPda(umi, {
      mint: collectionMint.publicKey,
    });
    const collectionMasterEdition = findMasterEditionPda(umi, {
      mint: collectionMint.publicKey,
    });
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });
    await verifySizedCollectionItem(umi, {
      metadata: nftMetadata,
      collectionAuthority: creator,
      collectionMint: collectionMint.publicKey,
      collection: collectionMetadata,
      collectionMasterEditionAccount: collectionMasterEdition,
    }).sendAndConfirm(umi);
    console.log("Collection NFT Verified!");

    // Get or create ATAs
    makerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        maker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        maker.publicKey
      )
    ).address;

    takerAta = (
      await getOrCreateAssociatedTokenAccount(
        connection,
        taker,
        new anchor.web3.PublicKey(nftMint.publicKey),
        taker.publicKey
      )
    ).address;

    vault = await anchor.utils.token.associatedAddress({
      mint: new anchor.web3.PublicKey(nftMint.publicKey),
      owner: listing,
    });
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

  it("Listing!", async () => {
    const nftMetadata = findMetadataPda(umi, { mint: nftMint.publicKey });
    const nftEdition = findMasterEditionPda(umi, { mint: nftMint.publicKey });

    const tx = await program.methods
      .list(price)
      .accountsPartial({
        maker: maker.publicKey,
        marketplace,
        makerMint: nftMint.publicKey,
        collectionMint: collectionMint.publicKey,
        makerAta,
        metadata: new anchor.web3.PublicKey(nftMetadata[0]),
        vault,
        masterEdition: new anchor.web3.PublicKey(nftEdition[0]),
        listing,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    console.log("\nListing Initialized!");
    console.log("Your transaction signature", tx);
  });

  it("Purchase Initialized!", async () => {
    const tx = await program.methods
      .purchase()
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        makerMint: nftMint.publicKey,
        marketplace,
        takerAta,
        vault,
        rewardMint,
        listing,
        treasury,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([taker])
      .rpc();
    console.log("\nPurchase Initialized!");
    console.log("Your transaction signature", tx);
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

