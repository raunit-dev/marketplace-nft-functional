use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, Token},
};

use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Purchase<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>,

    #[account(
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>,

    pub maker_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = maker_mint,
        associated_token::authority = taker
    )]
    pub taker_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = rewards_mint,
        associated_token::authority = taker
    )]
    pub taker_rewards_ata: InterfaceAccount<'info,TokenAccount>,

    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = listing
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [marketplace.key().as_ref(), maker_mint.key().as_ref()],
        bump = listing.bump,
        close = maker
    )]
    pub listing: Account<'info, Listing>,

    #[account(
        seeds = [b"treasury", marketplace.key().as_ref()],
        bump = marketplace.treasury_bump
    )]
    pub treasury: SystemAccount<'info>,


    pub collection_mint: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"rewards", marketplace.key().as_ref()],
        bump = marketplace.rewards_bump,
        mint::decimals = 6,
        mint::authority = marketplace
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,


    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>
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
        let cpi_accounts = Transfer{
            from: self.vault.to_account_info(),
            mint: self.maker_mint.to_account_info(),
            to: self.maker_ata.to_account_info(),
            authority: self.listing.to_account_info()
        };
        let cpi_ctx = CpiContext::new(cpi_program,cpi_accounts);

        transfer(cpi_ctx,1,self.maker_mint.decimals)
        
    }
}