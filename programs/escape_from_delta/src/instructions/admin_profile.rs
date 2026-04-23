use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::{AdminProfile, GameConfig, SCHEMA_VERSION, SEED_ADMIN, SEED_GAME_CONFIG};

#[derive(Accounts)]
pub struct InitializeAdminProfile<'info> {
    #[account(seeds = [SEED_GAME_CONFIG], bump = game_config.bump)]
    pub game_config: Account<'info, GameConfig>,
    #[account(
        init_if_needed,
        payer = deployer,
        space = 8 + AdminProfile::INIT_SPACE,
        seeds = [SEED_ADMIN, deployer.key().as_ref()],
        bump
    )]
    pub admin_profile: Account<'info, AdminProfile>,
    #[account(mut)]
    pub deployer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeAdminProfile>) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.game_config.admin_authority,
        ctx.accounts.deployer.key(),
        EscapeError::Unauthorized
    );

    let admin_profile = &mut ctx.accounts.admin_profile;
    admin_profile.schema_version = SCHEMA_VERSION;
    admin_profile.wallet = ctx.accounts.deployer.key();
    admin_profile.active = true;
    admin_profile.created_at = Clock::get()?.unix_timestamp;
    admin_profile.bump = ctx.bumps.admin_profile;
    Ok(())
}
