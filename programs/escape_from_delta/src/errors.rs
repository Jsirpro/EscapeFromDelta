use anchor_lang::prelude::*;

#[error_code]
pub enum EscapeError {
    #[msg("The acting wallet is not authorized for this account or action.")]
    Unauthorized,
    #[msg("The account owner, mint, PDA seed, discriminator, or schema version is invalid.")]
    InvalidAccount,
    #[msg("The requested numeric value is outside the allowed game range.")]
    InvalidNumericRange,
    #[msg("The checked arithmetic operation overflowed or underflowed.")]
    ArithmeticOverflow,
    #[msg("The player has insufficient EDcoins or SOL for this action.")]
    InsufficientFunds,
    #[msg("The player already received the one-time starter grant.")]
    StarterGrantAlreadyClaimed,
    #[msg("The player already has an active raid.")]
    RaidAlreadyActive,
    #[msg("The raid state does not allow this transition.")]
    InvalidRaidState,
    #[msg("The raid has timed out and must settle as failure.")]
    RaidTimedOut,
    #[msg("The selected equipment is invalid for this raid.")]
    InvalidEquipment,
    #[msg("The selected safe-case item set is invalid.")]
    InvalidSafeCaseSelection,
    #[msg("The selected container is invalid or already opened.")]
    InvalidContainer,
    #[msg("The marketplace listing is invalid for this action.")]
    InvalidListing,
    #[msg("The admin difficulty configuration is invalid.")]
    InvalidDifficultyConfig,
    #[msg("The random audit data is missing or malformed.")]
    InvalidRandomAudit,
    #[msg("Completed battle records are immutable.")]
    BattleRecordImmutable,
}
