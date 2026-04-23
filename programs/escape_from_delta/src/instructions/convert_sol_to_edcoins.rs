use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::constants::*;
use crate::state::validation::checked_add_u64;
use crate::state::validation::checked_mul_u64;
use crate::state::{GameConfig, PlayerProfile, SEED_GAME_CONFIG, SEED_PLAYER};

#[derive(Accounts)]
pub struct ConvertSolToEdcoins<'info> {
    #[account(seeds = [SEED_GAME_CONFIG], bump = game_config.bump)]
    pub game_config: Account<'info, GameConfig>,
    #[account(
        mut,
        seeds = [SEED_PLAYER, player.key().as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.wallet == player.key() @ EscapeError::Unauthorized
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub player: Signer<'info>,
    /// CHECK: SOL treasury is validated against GameConfig in the full program flow.
    #[account(mut)]
    pub sol_treasury: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ConvertSolToEdcoins>, sol_amount: u64) -> Result<u64> {
    require!(sol_amount > 0, EscapeError::InvalidNumericRange);
    require_keys_eq!(
        ctx.accounts.sol_treasury.key(),
        ctx.accounts.game_config.sol_treasury,
        EscapeError::InvalidAccount
    );
    let edcoins_credit = checked_mul_u64(sol_amount, SOL_TO_EDCOINS_RATE)?;

    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.player.key(),
        &ctx.accounts.sol_treasury.key(),
        sol_amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.player.to_account_info(),
            ctx.accounts.sol_treasury.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    let player_profile = &mut ctx.accounts.player_profile;
    player_profile.edcoins_balance =
        checked_add_u64(player_profile.edcoins_balance, edcoins_credit)?;
    player_profile.warehouse_nonce =
        player_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    Ok(edcoins_credit)
}
