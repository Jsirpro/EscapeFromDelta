use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::constants::*;
use crate::state::{GameConfig, PlayerProfile};

#[derive(Accounts)]
pub struct CreateOrConnectPlayer<'info> {
    #[account(seeds = [SEED_GAME_CONFIG], bump = game_config.bump)]
    pub game_config: Account<'info, GameConfig>,
    #[account(
        init_if_needed,
        payer = player,
        space = 8 + PlayerProfile::INIT_SPACE,
        seeds = [SEED_PLAYER, player.key().as_ref()],
        bump
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateOrConnectPlayer>) -> Result<()> {
    let profile = &mut ctx.accounts.player_profile;
    if profile.grant_claimed {
        require_keys_eq!(profile.wallet, ctx.accounts.player.key(), EscapeError::Unauthorized);
        return Ok(());
    }

    let game_config = &ctx.accounts.game_config;
    profile.schema_version = SCHEMA_VERSION;
    profile.wallet = ctx.accounts.player.key();
    profile.grant_claimed = true;
    profile.profile_created_at = Clock::get()?.unix_timestamp;
    profile.edcoins_balance = game_config.starter_grant_edcoins;
    profile.armor_point_balance = game_config.starter_armor_tenths;
    profile.weapon_point_balance = game_config.starter_weapon_tenths;
    profile.warehouse_nonce = 1;
    profile.next_raid_id = 1;
    profile.active_raid = None;
    profile.bump = ctx.bumps.player_profile;
    Ok(())
}
