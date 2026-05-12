use std::io::Cursor;

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

use crate::errors::EscapeError;
use crate::state::{
    AssetLockState, AssetQuality, AssetType, PlayerProfile, WarehouseAsset, SCHEMA_VERSION,
    SEED_ASSET,
};

const CREATED_FROM_RAID: u8 = 1;

pub fn create_collectible_assets_from_loot<'info>(
    payer: AccountInfo<'info>,
    player_profile: &mut Account<'info, PlayerProfile>,
    retained_loot: &[Pubkey],
    remaining_accounts: &[AccountInfo<'info>],
    system_program: AccountInfo<'info>,
) -> Result<Vec<Pubkey>> {
    require!(remaining_accounts.len() >= retained_loot.len(), EscapeError::InvalidAccount);

    let rent = Rent::get()?;
    let owner_profile = player_profile.key();
    let mut next_asset_id = player_profile.warehouse_nonce;
    let mut created_assets = Vec::with_capacity(retained_loot.len());

    for (loot_pubkey, account_info) in retained_loot.iter().zip(remaining_accounts.iter()) {
        next_asset_id = next_asset_id.checked_add(1).ok_or(EscapeError::ArithmeticOverflow)?;
        let asset_id_bytes = next_asset_id.to_le_bytes();
        let seeds_without_bump = [SEED_ASSET, owner_profile.as_ref(), asset_id_bytes.as_ref()];
        let (expected_asset_key, bump) =
            Pubkey::find_program_address(&seeds_without_bump, &crate::ID);

        require_keys_eq!(expected_asset_key, account_info.key(), EscapeError::InvalidAccount);
        require!(
            account_info.owner == &anchor_lang::solana_program::system_program::ID,
            EscapeError::InvalidAccount
        );
        require!(account_info.lamports() == 0, EscapeError::InvalidAccount);

        let account_space = 8 + WarehouseAsset::INIT_SPACE;
        let account_lamports = rent.minimum_balance(account_space);
        let signer_seeds = [SEED_ASSET, owner_profile.as_ref(), asset_id_bytes.as_ref(), &[bump]];
        invoke_signed(
            &system_instruction::create_account(
                payer.key,
                account_info.key,
                account_lamports,
                account_space as u64,
                &crate::ID,
            ),
            &[payer.clone(), account_info.clone(), system_program.clone()],
            &[&signer_seeds],
        )?;

        let asset = WarehouseAsset {
            schema_version: SCHEMA_VERSION,
            asset_id: next_asset_id,
            owner_profile,
            asset_type: AssetType::Collectible,
            quality: Some(derive_collectible_quality(loot_pubkey)),
            collectible_code: derive_collectible_code(loot_pubkey),
            armor_tenths: 0,
            weapon_tenths: 0,
            safe_case_capacity: 0,
            tradable: true,
            locked_state: AssetLockState::Available,
            created_from: CREATED_FROM_RAID,
            bump,
        };

        let mut account_data = account_info.try_borrow_mut_data()?;
        let mut cursor = Cursor::new(&mut account_data[..]);
        asset.try_serialize(&mut cursor)?;
        created_assets.push(expected_asset_key);
    }

    player_profile.warehouse_nonce = next_asset_id;
    Ok(created_assets)
}

fn derive_collectible_quality(loot_pubkey: &Pubkey) -> AssetQuality {
    let bytes = loot_pubkey.to_bytes();
    let rarity_roll = ((bytes[0] as u16) + (bytes[7] as u16) + (bytes[13] as u16)) % 100;
    if rarity_roll < 8 {
        AssetQuality::Legendary
    } else if rarity_roll < 30 {
        AssetQuality::Epic
    } else {
        AssetQuality::Rare
    }
}

fn derive_collectible_code(loot_pubkey: &Pubkey) -> String {
    let bytes = loot_pubkey.to_bytes();
    let rarity_roll = ((bytes[0] as u16) + (bytes[7] as u16) + (bytes[13] as u16)) % 100;
    let (prefix, pool_size) = if rarity_roll < 8 {
        ("legendary", 5u32)
    } else if rarity_roll < 30 {
        ("epic", 10u32)
    } else {
        ("rare", 20u32)
    };
    let pick_seed =
        (((bytes[3] as u32) << 16) | ((bytes[11] as u32) << 8) | (bytes[19] as u32)) & 0x00ff_ffff;
    let serial = (pick_seed % pool_size) + 1;
    format!("{prefix}_{serial:02}")
}
