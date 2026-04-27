use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("7ueVgYfrwidjpwMCBfGyHCoVpaVNe7Ep1h2Mxv1ENBYQ");

#[program]
pub mod escape_from_delta {
    use super::*;

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        edcoins_mint: Pubkey,
        token_program: Pubkey,
        treasury_edcoins_account: Pubkey,
        sol_treasury: Pubkey,
    ) -> Result<()> {
        instructions::initialize_game::handler(
            ctx,
            edcoins_mint,
            token_program,
            treasury_edcoins_account,
            sol_treasury,
        )
    }

    pub fn create_or_connect_player(ctx: Context<CreateOrConnectPlayer>) -> Result<()> {
        instructions::create_or_connect_player::handler(ctx)
    }

    pub fn convert_sol_to_edcoins(
        ctx: Context<ConvertSolToEdcoins>,
        sol_amount: u64,
    ) -> Result<u64> {
        instructions::convert_sol_to_edcoins::handler(ctx, sol_amount)
    }

    pub fn start_raid(
        ctx: Context<StartRaid>,
        armor_tenths: u16,
        weapon_tenths: u16,
        entry_fee: u64,
        safe_case_capacity: u8,
    ) -> Result<()> {
        instructions::start_raid::handler(
            ctx,
            armor_tenths,
            weapon_tenths,
            entry_fee,
            safe_case_capacity,
        )
    }

    pub fn select_safe_case_items(
        ctx: Context<SelectSafeCaseItems>,
        selected_assets: Vec<Pubkey>,
        capacity: u8,
    ) -> Result<()> {
        instructions::select_safe_case_items::handler(ctx, selected_assets, capacity)
    }

    pub fn open_container(
        ctx: Context<OpenContainer>,
        container_index: u8,
        base: u16,
        same_area_steps: u16,
        area_changes: u16,
        final_random_value: u64,
    ) -> Result<u16> {
        instructions::open_container::handler(
            ctx,
            container_index,
            base,
            same_area_steps,
            area_changes,
            final_random_value,
        )
    }

    pub fn fight_enemy(
        ctx: Context<FightEnemy>,
        armor: u16,
        weapon: u16,
        enemy: u16,
        final_random_value: u64,
    ) -> Result<(bool, u16, u16)> {
        instructions::fight_enemy::handler(ctx, armor, weapon, enemy, final_random_value)
    }

    pub fn move_area(ctx: Context<MoveArea>, target_area: RiskLevel) -> Result<()> {
        instructions::move_area::handler(ctx, target_area)
    }

    pub fn extract_raid<'info>(ctx: Context<'_, '_, '_, 'info, ExtractRaid<'info>>) -> Result<()> {
        instructions::extract_raid::handler(ctx)
    }

    pub fn settle_failed_raid<'info>(
        ctx: Context<'_, '_, '_, 'info, SettleFailedRaid<'info>>,
    ) -> Result<(u16, u16)> {
        instructions::settle_failed_raid::handler(ctx)
    }

    pub fn create_listing(ctx: Context<CreateListing>, price_edcoins: u64) -> Result<u64> {
        instructions::create_listing::handler(ctx, price_edcoins)
    }

    pub fn purchase_listing(ctx: Context<PurchaseListing>) -> Result<()> {
        instructions::purchase_listing::handler(ctx)
    }

    pub fn purchase_loadout_points(
        ctx: Context<PurchaseLoadoutPoints>,
        kind: LoadoutPointKind,
        amount_tenths: u16,
    ) -> Result<()> {
        instructions::purchase_loadout_points::handler_with_amount(ctx, kind, amount_tenths)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }

    pub fn initialize_admin_profile(ctx: Context<InitializeAdminProfile>) -> Result<()> {
        instructions::admin_profile::handler(ctx)
    }

    pub fn create_difficulty_version(
        ctx: Context<CreateDifficultyVersion>,
        entry_fee: u64,
        low: u16,
        medium: u16,
        high: u16,
    ) -> Result<()> {
        instructions::create_difficulty_version::handler(ctx, entry_fee, low, medium, high)
    }
}
