use anchor_lang::prelude::*;

pub struct Listing {
    pub maker: Publickey,
    pub maker_mint: Publickey,
    pub bump: u8,
    pub price: u64
}

impl Space for Listing {

    const INIT_SPACE: usize = 8 + 32 + 32 + 1 + 8;
}