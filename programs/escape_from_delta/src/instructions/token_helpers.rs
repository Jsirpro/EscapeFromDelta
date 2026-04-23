use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::EscapeError;
use crate::state::validation::checked_mul_u64;

pub fn listing_fee(price_edcoins: u64) -> Result<u64> {
    let numerator = checked_mul_u64(price_edcoins, 3)?;
    numerator.checked_add(99).ok_or(EscapeError::ArithmeticOverflow.into()).map(|value| value / 100)
}

pub fn validate_token_account(
    token_account: &InterfaceAccount<TokenAccount>,
    mint: &InterfaceAccount<Mint>,
    owner: &Pubkey,
    token_program: &Interface<TokenInterface>,
) -> Result<()> {
    require_keys_eq!(token_account.mint, mint.key(), EscapeError::InvalidAccount);
    require_keys_eq!(token_account.owner, *owner, EscapeError::InvalidAccount);
    require_keys_eq!(
        *token_account.to_account_info().owner,
        token_program.key(),
        EscapeError::InvalidAccount
    );
    Ok(())
}
