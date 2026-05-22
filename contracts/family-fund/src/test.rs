#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, Env, String,
};

// ═══════════════════════════════════════════════════════════════
//  Test Helpers
// ═══════════════════════════════════════════════════════════════

/// Tạo môi trường test cơ bản với contract, token, admin
fn setup_test() -> (Env, Address, FamilyFundContractClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    // Đăng ký contract
    let contract_id = env.register(FamilyFundContract, ());
    let client = FamilyFundContractClient::new(&env, &contract_id);

    // Tạo admin address
    let admin = Address::generate(&env);

    // Tạo token (SAC) và mint cho admin
    let token_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = sac.address();
    let sac_admin = token::StellarAssetClient::new(&env, &token_address);

    // Mint token cho admin để test deposit
    sac_admin.mint(&admin, &1_000_000_i128);

    // Khởi tạo contract
    client.initialize(&admin, &token_address);

    (env, contract_id, client, admin, token_address)
}

/// Tạo thành viên test
fn create_test_member(env: &Env) -> Address {
    Address::generate(env)
}

// ═══════════════════════════════════════════════════════════════
//  Test: Initialization
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_initialize() {
    let (_env, _contract_id, client, admin, token_address) = setup_test();

    // Verify admin
    assert_eq!(client.get_admin(), admin);

    // Verify token
    assert_eq!(client.get_token(), token_address);

    // Verify admin is also a member
    let admin_member = client.get_member(&admin);
    assert_eq!(admin_member.role, 1); // admin role
    assert!(admin_member.is_active);
}

#[test]
#[should_panic(expected = "Error(Contract, #2)")] // AlreadyInitialized
fn test_initialize_twice() {
    let (_env, _contract_id, client, admin, token_address) = setup_test();
    // Cố gắng khởi tạo lại → phải lỗi
    client.initialize(&admin, &token_address);
}

// ═══════════════════════════════════════════════════════════════
//  Test: Member Management
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_add_member() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    let name = String::from_str(&env, "Nguyen Van A");

    client.add_member(&admin, &member, &name);

    // Verify member info
    let member_data = client.get_member(&member);
    assert_eq!(member_data.address, member);
    assert_eq!(member_data.role, 0); // regular member
    assert!(member_data.is_active);
}

#[test]
#[should_panic(expected = "Error(Contract, #5)")] // MemberAlreadyExists
fn test_add_member_duplicate() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    let name = String::from_str(&env, "Nguyen Van A");

    client.add_member(&admin, &member, &name);
    client.add_member(&admin, &member, &name); // duplicate → lỗi
}

#[test]
fn test_remove_member() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));

    // Remove
    client.remove_member(&admin, &member);

    // Verify inactive
    let member_data = client.get_member(&member);
    assert!(!member_data.is_active);
}

#[test]
fn test_get_all_members() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member1 = create_test_member(&env);
    let member2 = create_test_member(&env);

    client.add_member(&admin, &member1, &String::from_str(&env, "A"));
    client.add_member(&admin, &member2, &String::from_str(&env, "B"));

    // Should have 3 members (admin + 2)
    let all = client.get_all_members();
    assert_eq!(all.len(), 3);

    // Remove one
    client.remove_member(&admin, &member2);
    let all = client.get_all_members();
    assert_eq!(all.len(), 2); // only active members
}

// ═══════════════════════════════════════════════════════════════
//  Test: Fund & Transfer
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_deposit_and_balance() {
    let (_env, _contract_id, client, admin, token_address) = setup_test();

    // Deposit 10,000 tokens
    client.deposit(&admin, &10_000_i128);

    // Check balance
    let balance = client.get_fund_balance();
    assert_eq!(balance, 10_000_i128);

    // Check admin's token balance decreased
    let token_client = token::TokenClient::new(&_env, &token_address);
    let admin_balance = token_client.balance(&admin);
    assert_eq!(admin_balance, 1_000_000 - 10_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")] // InvalidAmount
fn test_deposit_invalid_amount() {
    let (_env, _contract_id, client, admin, _token) = setup_test();
    client.deposit(&admin, &0_i128); // zero → lỗi
}

#[test]
fn test_admin_transfer() {
    let (env, _contract_id, client, admin, token_address) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));

    // Deposit first
    client.deposit(&admin, &10_000_i128);

    // Admin transfer to member
    client.transfer(&admin, &member, &5_000_i128);

    // Check balances
    assert_eq!(client.get_fund_balance(), 5_000_i128);
    let token_client = token::TokenClient::new(&env, &token_address);
    assert_eq!(token_client.balance(&member), 5_000_i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")] // InsufficientFunds
fn test_transfer_insufficient_funds() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));

    // Deposit little
    client.deposit(&admin, &100_i128);

    // Try to transfer more than available
    client.transfer(&admin, &member, &999_i128);
}

// ═══════════════════════════════════════════════════════════════
//  Test: Transfer Requests
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_request_and_approve_transfer() {
    let (env, _contract_id, client, admin, token_address) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));

    // Deposit
    client.deposit(&admin, &50_000_i128);

    // Member requests transfer
    let req_id = client.request_transfer(
        &member,
        &10_000_i128,
        &String::from_str(&env, "Mua sach hoc"),
    );
    assert_eq!(req_id, 0);

    // Verify request is pending
    let request = client.get_transfer_request(&req_id);
    assert_eq!(request.status, 0); // pending

    // Admin approves
    client.approve_transfer(&admin, &req_id);

    // Verify request is approved
    let request = client.get_transfer_request(&req_id);
    assert_eq!(request.status, 1); // approved

    // Verify member received tokens
    let token_client = token::TokenClient::new(&env, &token_address);
    assert_eq!(token_client.balance(&member), 10_000_i128);
}

#[test]
fn test_reject_transfer() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));
    client.deposit(&admin, &50_000_i128);

    let req_id = client.request_transfer(
        &member,
        &10_000_i128,
        &String::from_str(&env, "Mua game"),
    );

    // Admin rejects
    client.reject_transfer(&admin, &req_id);

    // Verify rejected
    let request = client.get_transfer_request(&req_id);
    assert_eq!(request.status, 2); // rejected
}

// ═══════════════════════════════════════════════════════════════
//  Test: Monthly Allowance
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_set_and_claim_allowance() {
    let (env, _contract_id, client, admin, token_address) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));

    // Deposit quỹ
    client.deposit(&admin, &100_000_i128);

    // Set initial timestamp
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000;
    });

    // Set allowance: 5000 tokens mỗi 30 ngày
    let thirty_days: u64 = 2_592_000;
    client.set_allowance(&admin, &member, &5_000_i128, &thirty_days);

    // Verify allowance info
    let allowance = client.get_allowance(&member);
    assert_eq!(allowance.amount, 5_000_i128);
    assert_eq!(allowance.interval, thirty_days);
    assert!(allowance.is_active);

    // Fast-forward 31 ngày
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000 + thirty_days + 86_400; // +31 days
    });

    // Claim allowance
    let claimed = client.claim_allowance(&member);
    assert_eq!(claimed, 5_000_i128); // 1 kỳ

    // Verify member received tokens
    let token_client = token::TokenClient::new(&env, &token_address);
    assert_eq!(token_client.balance(&member), 5_000_i128);
}

#[test]
fn test_claim_multiple_periods() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));
    client.deposit(&admin, &100_000_i128);

    let thirty_days: u64 = 2_592_000;

    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000;
    });

    client.set_allowance(&admin, &member, &5_000_i128, &thirty_days);

    // Fast-forward 90 ngày (3 kỳ)
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000 + thirty_days * 3;
    });

    let claimed = client.claim_allowance(&member);
    assert_eq!(claimed, 15_000_i128); // 3 kỳ × 5000
}

#[test]
#[should_panic(expected = "Error(Contract, #8)")] // TooEarlyToClaim
fn test_claim_too_early() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));
    client.deposit(&admin, &100_000_i128);

    let thirty_days: u64 = 2_592_000;

    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000;
    });

    client.set_allowance(&admin, &member, &5_000_i128, &thirty_days);

    // Only 10 days later
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000 + 864_000; // 10 days
    });

    client.claim_allowance(&member); // too early → lỗi
}

// ═══════════════════════════════════════════════════════════════
//  Test: Tasks & Rewards
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_full_task_workflow() {
    let (env, _contract_id, client, admin, token_address) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));
    client.deposit(&admin, &100_000_i128);

    // Admin tạo nhiệm vụ
    let task_id = client.create_task(
        &admin,
        &String::from_str(&env, "Don dep nha"),
        &String::from_str(&env, "Lau nha, hut bui, don phong"),
        &2_000_i128,
        &member,
    );
    assert_eq!(task_id, 0);

    // Verify task created
    let task = client.get_task(&task_id);
    assert_eq!(task.status, 0); // pending
    assert_eq!(task.reward, 2_000_i128);

    // Member submit hoàn thành
    client.submit_task(&member, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, 1); // submitted

    // Admin approve → thưởng tự động chuyển
    client.approve_task(&admin, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, 2); // approved

    // Verify member received reward
    let token_client = token::TokenClient::new(&env, &token_address);
    assert_eq!(token_client.balance(&member), 2_000_i128);

    // Verify fund balance decreased
    assert_eq!(client.get_fund_balance(), 98_000_i128);
}

#[test]
fn test_reject_and_resubmit_task() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));
    client.deposit(&admin, &100_000_i128);

    let task_id = client.create_task(
        &admin,
        &String::from_str(&env, "Rua bat"),
        &String::from_str(&env, "Rua sach bat dia"),
        &1_000_i128,
        &member,
    );

    // Submit
    client.submit_task(&member, &task_id);

    // Admin reject → quay lại pending
    client.reject_task(&admin, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, 0); // pending again

    // Member submit lại
    client.submit_task(&member, &task_id);
    let task = client.get_task(&task_id);
    assert_eq!(task.status, 1); // submitted again
}

#[test]
#[should_panic(expected = "Error(Contract, #11)")] // InvalidTaskStatus
fn test_submit_already_submitted_task() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));

    let task_id = client.create_task(
        &admin,
        &String::from_str(&env, "Test task"),
        &String::from_str(&env, "Test"),
        &1_000_i128,
        &member,
    );

    client.submit_task(&member, &task_id);
    client.submit_task(&member, &task_id); // already submitted → lỗi
}

#[test]
fn test_get_all_tasks() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Con"));

    // Tạo 3 tasks
    client.create_task(
        &admin,
        &String::from_str(&env, "Task 1"),
        &String::from_str(&env, "Desc 1"),
        &1_000_i128,
        &member,
    );
    client.create_task(
        &admin,
        &String::from_str(&env, "Task 2"),
        &String::from_str(&env, "Desc 2"),
        &2_000_i128,
        &member,
    );
    client.create_task(
        &admin,
        &String::from_str(&env, "Task 3"),
        &String::from_str(&env, "Desc 3"),
        &3_000_i128,
        &member,
    );

    let all_tasks = client.get_all_tasks();
    assert_eq!(all_tasks.len(), 3);
}

// ═══════════════════════════════════════════════════════════════
//  Test: Authorization & Error cases
// ═══════════════════════════════════════════════════════════════

#[test]
#[should_panic(expected = "Error(Contract, #3)")] // Unauthorized
fn test_non_admin_cannot_add_member() {
    let (env, _contract_id, client, _admin, _token) = setup_test();

    let not_admin = create_test_member(&env);
    let member = create_test_member(&env);

    // Non-admin tries to add member → lỗi
    client.add_member(&not_admin, &member, &String::from_str(&env, "Hacker"));
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")] // Unauthorized
fn test_non_admin_cannot_transfer() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));
    client.deposit(&admin, &10_000_i128);

    // Non-admin tries to transfer → lỗi
    client.transfer(&member, &member, &1_000_i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #13)")] // MemberInactive
fn test_cannot_transfer_to_inactive_member() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member = create_test_member(&env);
    client.add_member(&admin, &member, &String::from_str(&env, "Member"));
    client.deposit(&admin, &10_000_i128);

    // Remove member first
    client.remove_member(&admin, &member);

    // Try to transfer to inactive member → lỗi
    client.transfer(&admin, &member, &1_000_i128);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")] // Unauthorized - wrong assignee
fn test_wrong_member_cannot_submit_task() {
    let (env, _contract_id, client, admin, _token) = setup_test();

    let member1 = create_test_member(&env);
    let member2 = create_test_member(&env);
    client.add_member(&admin, &member1, &String::from_str(&env, "A"));
    client.add_member(&admin, &member2, &String::from_str(&env, "B"));

    let task_id = client.create_task(
        &admin,
        &String::from_str(&env, "Task"),
        &String::from_str(&env, "Desc"),
        &1_000_i128,
        &member1, // assigned to member1
    );

    // member2 tries to submit member1's task → lỗi
    client.submit_task(&member2, &task_id);
}

// ═══════════════════════════════════════════════════════════════
//  Test: Full End-to-End Scenario
// ═══════════════════════════════════════════════════════════════

#[test]
fn test_full_family_scenario() {
    let (env, _contract_id, client, admin, token_address) = setup_test();

    // === 1. Admin thêm các thành viên gia đình ===
    let con1 = create_test_member(&env);
    let con2 = create_test_member(&env);
    let vo = create_test_member(&env);

    client.add_member(&admin, &con1, &String::from_str(&env, "Con 1"));
    client.add_member(&admin, &con2, &String::from_str(&env, "Con 2"));
    client.add_member(&admin, &vo, &String::from_str(&env, "Vo"));

    assert_eq!(client.get_all_members().len(), 4); // admin + 3

    // === 2. Nạp quỹ gia đình ===
    client.deposit(&admin, &500_000_i128);
    assert_eq!(client.get_fund_balance(), 500_000_i128);

    // === 3. Thiết lập lương tháng ===
    let thirty_days: u64 = 2_592_000;

    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000;
    });

    client.set_allowance(&admin, &con1, &10_000_i128, &thirty_days);
    client.set_allowance(&admin, &con2, &8_000_i128, &thirty_days);
    client.set_allowance(&admin, &vo, &20_000_i128, &thirty_days);

    // === 4. 1 tháng sau: claim lương ===
    env.ledger().with_mut(|li| {
        li.timestamp = 1_000_000 + thirty_days + 1;
    });

    let claimed1 = client.claim_allowance(&con1);
    let claimed2 = client.claim_allowance(&con2);
    let claimed_vo = client.claim_allowance(&vo);

    assert_eq!(claimed1, 10_000_i128);
    assert_eq!(claimed2, 8_000_i128);
    assert_eq!(claimed_vo, 20_000_i128);

    // Fund balance giảm
    assert_eq!(client.get_fund_balance(), 500_000 - 10_000 - 8_000 - 20_000);

    // === 5. Tạo nhiệm vụ việc nhà ===
    let task1 = client.create_task(
        &admin,
        &String::from_str(&env, "Don phong"),
        &String::from_str(&env, "Don dep phong ngu sach se"),
        &5_000_i128,
        &con1,
    );

    let task2 = client.create_task(
        &admin,
        &String::from_str(&env, "Rua bat"),
        &String::from_str(&env, "Rua sach tat ca bat dia"),
        &3_000_i128,
        &con2,
    );

    // Con1 hoàn thành nhiệm vụ
    client.submit_task(&con1, &task1);
    client.approve_task(&admin, &task1);

    // Con2 submit nhưng bị reject rồi làm lại
    client.submit_task(&con2, &task2);
    client.reject_task(&admin, &task2);
    client.submit_task(&con2, &task2);
    client.approve_task(&admin, &task2);

    // === 6. Vợ yêu cầu chuyển tiền mua sắm ===
    let req = client.request_transfer(
        &vo,
        &50_000_i128,
        &String::from_str(&env, "Mua do gia dinh"),
    );
    client.approve_transfer(&admin, &req);

    // === 7. Verify tổng kết ===
    let token_client = token::TokenClient::new(&env, &token_address);

    // Con1: 10_000 (lương) + 5_000 (task) = 15_000
    assert_eq!(token_client.balance(&con1), 15_000_i128);

    // Con2: 8_000 (lương) + 3_000 (task) = 11_000
    assert_eq!(token_client.balance(&con2), 11_000_i128);

    // Vợ: 20_000 (lương) + 50_000 (request) = 70_000
    assert_eq!(token_client.balance(&vo), 70_000_i128);

    // Quỹ còn lại: 500_000 - 15_000 - 11_000 - 70_000 = 404_000
    assert_eq!(client.get_fund_balance(), 404_000_i128);
}
