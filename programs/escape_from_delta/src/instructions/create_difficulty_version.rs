use anchor_lang::prelude::*;

use crate::errors::EscapeError;
use crate::state::{
    AdminProfile, DifficultyConfiguration, GameConfig, RiskAreaConfig, RiskLevel, SCHEMA_VERSION,
    SEED_ADMIN, SEED_DIFFICULTY, SEED_GAME_CONFIG,
};

#[derive(Accounts)]
#[instruction(entry_fee: u64, low: u16, medium: u16, high: u16)]
pub struct CreateDifficultyVersion<'info> {
    #[account(seeds = [SEED_GAME_CONFIG], bump = game_config.bump)]
    pub game_config: Account<'info, GameConfig>,
    #[account(
        seeds = [SEED_ADMIN, admin.key().as_ref()],
        bump = admin_profile.bump,
        constraint = admin_profile.wallet == admin.key() @ EscapeError::Unauthorized,
        constraint = admin_profile.active @ EscapeError::Unauthorized
    )]
    pub admin_profile: Account<'info, AdminProfile>,
    #[account(
        init,
        payer = admin,
        space = 8 + DifficultyConfiguration::INIT_SPACE,
        seeds = [
            SEED_DIFFICULTY,
            admin.key().as_ref(),
            &entry_fee.to_le_bytes(),
            &low.to_le_bytes(),
            &medium.to_le_bytes(),
            &high.to_le_bytes()
        ],
        bump
    )]
    pub difficulty_configuration: Account<'info, DifficultyConfiguration>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateDifficultyVersion>,
    entry_fee: u64,
    low: u16,
    medium: u16,
    high: u16,
) -> Result<()> {
    require!(entry_fee > 0, EscapeError::InvalidDifficultyConfig);
    require_keys_eq!(
        ctx.accounts.game_config.admin_authority,
        ctx.accounts.admin.key(),
        EscapeError::Unauthorized
    );
    require!(low <= 100 && medium <= 100 && high <= 100, EscapeError::InvalidDifficultyConfig);

    let now = Clock::get()?.unix_timestamp;
    let difficulty = &mut ctx.accounts.difficulty_configuration;
    difficulty.schema_version = SCHEMA_VERSION;
    difficulty.difficulty_id = now.max(0) as u64;
    difficulty.version = 1;
    difficulty.name = format!("Difficulty {}", difficulty.difficulty_id);
    difficulty.active = true;
    difficulty.entry_fee_edcoins = entry_fee;
    difficulty.low = risk_area(RiskLevel::Low, low);
    difficulty.medium = risk_area(RiskLevel::Medium, medium);
    difficulty.high = risk_area(RiskLevel::High, high);
    difficulty.created_by_admin = ctx.accounts.admin.key();
    difficulty.created_at = now;
    difficulty.bump = ctx.bumps.difficulty_configuration;
    Ok(())
}

fn risk_area(risk_level: RiskLevel, base_encounter_percent: u16) -> RiskAreaConfig {
    RiskAreaConfig {
        risk_level,
        area_count: 1,
        base_encounter_percent,
        enemy_combat_min_tenths: 10,
        enemy_combat_max_tenths: 50,
        loot_weight_total: 100,
    }
}
