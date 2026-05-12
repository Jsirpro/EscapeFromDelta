use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::validation::checked_sub_u64;
use crate::state::{
    GameConfig, PlayerProfile, LOADOUT_POINT_PRICE_EDCOINS, LOADOUT_POINT_PURCHASE_TENTHS,
    SEED_GAME_CONFIG, SEED_PLAYER,
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, Eq, PartialEq)]
pub enum LoadoutPointKind {
    Armor,
    Weapon,
}

#[derive(Accounts)]
pub struct PurchaseLoadoutPoints<'info> {
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
}

pub fn handler(ctx: Context<PurchaseLoadoutPoints>, kind: LoadoutPointKind) -> Result<()> {
    handler_with_amount(ctx, kind, LOADOUT_POINT_PURCHASE_TENTHS)
}

pub fn handler_with_amount(
    ctx: Context<PurchaseLoadoutPoints>,
    kind: LoadoutPointKind,
    amount_tenths: u16,
) -> Result<()> {
    require!(amount_tenths > 0, EscapeError::InvalidNumericRange);
    let player_profile = &mut ctx.accounts.player_profile;
    let price = LOADOUT_POINT_PRICE_EDCOINS
        .checked_mul(u64::from(amount_tenths))
        .ok_or(EscapeError::ArithmeticOverflow)?
        .checked_div(u64::from(LOADOUT_POINT_PURCHASE_TENTHS))
        .ok_or(EscapeError::ArithmeticOverflow)?;
    player_profile.edcoins_balance = checked_sub_u64(player_profile.edcoins_balance, price)?;

    match kind {
        LoadoutPointKind::Armor => {
            player_profile.armor_point_balance = player_profile
                .armor_point_balance
                .checked_add(amount_tenths)
                .ok_or(EscapeError::ArithmeticOverflow)?;
        }
        LoadoutPointKind::Weapon => {
            player_profile.weapon_point_balance = player_profile
                .weapon_point_balance
                .checked_add(amount_tenths)
                .ok_or(EscapeError::ArithmeticOverflow)?;
        }
    }

    player_profile.warehouse_nonce =
        player_profile.warehouse_nonce.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;

    Ok(())
}
