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
    let player_profile = &mut ctx.accounts.player_profile;
    player_profile.edcoins_balance =
        checked_sub_u64(player_profile.edcoins_balance, LOADOUT_POINT_PRICE_EDCOINS)?;

    match kind {
        LoadoutPointKind::Armor => {
            player_profile.armor_point_balance = player_profile
                .armor_point_balance
                .checked_add(LOADOUT_POINT_PURCHASE_TENTHS)
                .ok_or(EscapeError::ArithmeticOverflow)?;
        }
        LoadoutPointKind::Weapon => {
            player_profile.weapon_point_balance = player_profile
                .weapon_point_balance
                .checked_add(LOADOUT_POINT_PURCHASE_TENTHS)
                .ok_or(EscapeError::ArithmeticOverflow)?;
        }
    }

    player_profile.warehouse_nonce = player_profile
        .warehouse_nonce
        .checked_add(1)
        .ok_or(EscapeError::ArithmeticOverflow)?;

    Ok(())
}
