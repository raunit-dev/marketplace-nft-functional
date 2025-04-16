use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint,TokenInterface};


use crate::state::marketplace::Marketplace;

#[derive(Accounts)]
#[instruction(seeds: u64)]
pub struct Initialize<`info>{
    #[account(mut)]
    
}


