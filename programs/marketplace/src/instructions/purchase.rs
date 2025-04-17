use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    #[account(
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    #[account()]
    pub maker_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = maker
    )]
    pub maker_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = maker_mint,
        associated_token::authority = listing
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = maker,
        seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump,
        space = Listing::INIT_SPACE
    )]
    pub listing: Account<'info, Listing>,

    #[account()]
    pub collection_mint: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            maker_mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true
    )]
    pub metadata: Account<'info, MetadataAccount>,

    #[account(
        seeds = [
            b"metadata",
            metadata_program.key().as_ref(),
            maker_mint.key().as_ref(),
            b"edition"
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, Metadata>
}

impl<'info> List<'info> {
    pub fn withdraw_nft(&mut self) -> Result <()> {
        let cpi_program = self.token_program.to_account_info();
        let seeds = &[
            self.marketplace.key().as_ref(),
            self.maker_mint.key().as_ref(),
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_accounts = TransferChecked{
            from: self.vault.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.maker_ata.to_account_info(),
            authority: self.listing.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        transfer_checked(cpi_ctx,1,self.maker_mint.decimals)
        
    }
}