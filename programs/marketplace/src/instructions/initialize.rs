use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint,TokenInterface};


use crate::state::marketplace::Marketplace;

#[derive(Accounts)]
#[instruction(name: String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [b"marketplace", name.as_str().as_bytes()],
        bump,
        space = Marketplace::INIT_SPACE
    )]
    pub marketplace: Account<'info, Marketplace>,


    
}


