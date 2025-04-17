use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{MasterEditionAccount, Metadata, MetadataAccount},
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use crate::state::{Listing, Marketplace};

#[derive(Accounts)]
#[instructions(name: String)]

pub struct Purchase <'info> {

}

impl <'info> Purchase <'info> {
    
}

