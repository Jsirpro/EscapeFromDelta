use anchor_lang::prelude::*;

use crate::state::constants::*;
use crate::state::GameConfig;

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = deployer,
        space = 8 + GameConfig::INIT_SPACE,
        seeds = [SEED_GAME_CONFIG],
        bump
    )]
    pub game_config: Account<'info, GameConfig>,
    #[account(mut)]
    pub deployer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeGame>,
    edcoins_mint: Pubkey,
    token_program: Pubkey,
    treasury_edcoins_account: Pubkey,
    sol_treasury: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.game_config;
    config.schema_version = SCHEMA_VERSION;
    config.admin_authority = ctx.accounts.deployer.key();
    config.edcoins_mint = edcoins_mint;
    config.token_program = token_program;
    config.treasury_edcoins_account = treasury_edcoins_account;
    config.sol_treasury = sol_treasury;
    config.starter_grant_edcoins = EDCOINS_STARTER_GRANT;
    config.starter_armor_tenths = STARTER_ARMOR_TENTHS;
    config.starter_weapon_tenths = STARTER_WEAPON_TENTHS;
    config.sol_to_edcoins_rate = SOL_TO_EDCOINS_RATE;
    config.bump = ctx.bumps.game_config;
    Ok(())
}
