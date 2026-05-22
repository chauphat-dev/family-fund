#![no_std]

use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Vec};

mod errors;
mod types;

pub use errors::FamilyFundError;
pub use types::*;

#[contract]
pub struct FamilyFundContract;

// ═══════════════════════════════════════════════════════════════
//  Helper functions — Internal utilities
// ═══════════════════════════════════════════════════════════════

/// Lấy admin address, panic nếu contract chưa khởi tạo
fn get_admin(env: &Env) -> Result<Address, FamilyFundError> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(FamilyFundError::NotInitialized)
}

/// Lấy token address
fn get_token(env: &Env) -> Result<Address, FamilyFundError> {
    env.storage()
        .instance()
        .get(&DataKey::Token)
        .ok_or(FamilyFundError::NotInitialized)
}

/// Kiểm tra caller có phải admin không
fn require_admin(env: &Env, caller: &Address) -> Result<(), FamilyFundError> {
    let admin = get_admin(env)?;
    if *caller != admin {
        return Err(FamilyFundError::Unauthorized);
    }
    caller.require_auth();
    Ok(())
}

/// Kiểm tra member có active không
fn require_active_member(env: &Env, member: &Address) -> Result<FamilyMember, FamilyFundError> {
    let member_data: FamilyMember = env
        .storage()
        .persistent()
        .get(&DataKey::Member(member.clone()))
        .ok_or(FamilyFundError::MemberNotFound)?;

    if !member_data.is_active {
        return Err(FamilyFundError::MemberInactive);
    }
    Ok(member_data)
}

/// Lấy danh sách thành viên (hoặc tạo mới nếu chưa có)
fn get_member_list(env: &Env) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::MemberList)
        .unwrap_or(Vec::new(env))
}

/// Lấy số đếm task hiện tại
fn get_task_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TaskCount)
        .unwrap_or(0u64)
}

/// Lấy số đếm transfer request hiện tại
fn get_transfer_req_count(env: &Env) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::TransferReqCount)
        .unwrap_or(0u64)
}

/// Lấy số dư quỹ qua token contract
fn get_fund_balance_internal(env: &Env) -> Result<i128, FamilyFundError> {
    let token_address = get_token(env)?;
    let client = token::TokenClient::new(env, &token_address);
    Ok(client.balance(&env.current_contract_address()))
}

// ═══════════════════════════════════════════════════════════════
//  Contract Implementation
// ═══════════════════════════════════════════════════════════════

#[contractimpl]
impl FamilyFundContract {
    // ─────────────────────────────────────────────────────────
    //  Initialization & Admin
    // ─────────────────────────────────────────────────────────

    /// Khởi tạo contract với admin và token address.
    /// Chỉ được gọi 1 lần duy nhất.
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
    ) -> Result<(), FamilyFundError> {
        // Kiểm tra chưa được khởi tạo
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(FamilyFundError::AlreadyInitialized);
        }

        admin.require_auth();

        // Lưu admin và token vào instance storage
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);

        // Tự động thêm admin là thành viên đầu tiên
        let admin_member = FamilyMember {
            name: String::from_str(&env, "Admin"),
            address: admin.clone(),
            role: 1, // admin role
            joined_at: env.ledger().timestamp(),
            is_active: true,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Member(admin.clone()), &admin_member);

        let mut members = Vec::new(&env);
        members.push_back(admin);
        env.storage()
            .persistent()
            .set(&DataKey::MemberList, &members);

        Ok(())
    }

    /// Xem admin hiện tại
    pub fn get_admin(env: Env) -> Result<Address, FamilyFundError> {
        get_admin(&env)
    }

    /// Xem token address
    pub fn get_token(env: Env) -> Result<Address, FamilyFundError> {
        get_token(&env)
    }

    // ─────────────────────────────────────────────────────────
    //  Member Management — Quản lý thành viên
    // ─────────────────────────────────────────────────────────

    /// Thêm thành viên mới vào gia đình.
    /// Chỉ admin mới có quyền.
    pub fn add_member(
        env: Env,
        admin: Address,
        member_addr: Address,
        name: String,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        // Kiểm tra thành viên đã tồn tại chưa
        if env
            .storage()
            .persistent()
            .has(&DataKey::Member(member_addr.clone()))
        {
            return Err(FamilyFundError::MemberAlreadyExists);
        }

        let member = FamilyMember {
            name,
            address: member_addr.clone(),
            role: 0, // regular member
            joined_at: env.ledger().timestamp(),
            is_active: true,
        };

        // Lưu member data
        env.storage()
            .persistent()
            .set(&DataKey::Member(member_addr.clone()), &member);

        // Thêm vào danh sách
        let mut members = get_member_list(&env);
        members.push_back(member_addr);
        env.storage()
            .persistent()
            .set(&DataKey::MemberList, &members);

        Ok(())
    }

    /// Vô hiệu hóa thành viên (soft delete).
    /// Chỉ admin mới có quyền.
    pub fn remove_member(
        env: Env,
        admin: Address,
        member_addr: Address,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        let mut member: FamilyMember = env
            .storage()
            .persistent()
            .get(&DataKey::Member(member_addr.clone()))
            .ok_or(FamilyFundError::MemberNotFound)?;

        member.is_active = false;
        env.storage()
            .persistent()
            .set(&DataKey::Member(member_addr.clone()), &member);

        // Vô hiệu hóa allowance nếu có
        if env
            .storage()
            .persistent()
            .has(&DataKey::Allowance(member_addr.clone()))
        {
            let mut allowance: Allowance = env
                .storage()
                .persistent()
                .get(&DataKey::Allowance(member_addr.clone()))
                .unwrap();
            allowance.is_active = false;
            env.storage()
                .persistent()
                .set(&DataKey::Allowance(member_addr), &allowance);
        }

        Ok(())
    }

    /// Xem thông tin một thành viên
    pub fn get_member(env: Env, member_addr: Address) -> Result<FamilyMember, FamilyFundError> {
        env.storage()
            .persistent()
            .get(&DataKey::Member(member_addr))
            .ok_or(FamilyFundError::MemberNotFound)
    }

    /// Xem danh sách tất cả thành viên active
    pub fn get_all_members(env: Env) -> Vec<FamilyMember> {
        let addresses = get_member_list(&env);
        let mut result = Vec::new(&env);

        for addr in addresses.iter() {
            if let Some(member) = env
                .storage()
                .persistent()
                .get::<_, FamilyMember>(&DataKey::Member(addr.clone()))
            {
                if member.is_active {
                    result.push_back(member);
                }
            }
        }
        result
    }

    // ─────────────────────────────────────────────────────────
    //  Fund & Transfer — Quản lý quỹ & chuyển tiền
    // ─────────────────────────────────────────────────────────

    /// Nạp tiền vào quỹ gia đình.
    /// Bất kỳ ai cũng có thể nạp tiền.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<(), FamilyFundError> {
        if amount <= 0 {
            return Err(FamilyFundError::InvalidAmount);
        }
        from.require_auth();

        let token_address = get_token(&env)?;
        let client = token::TokenClient::new(&env, &token_address);
        client.transfer(&from, &env.current_contract_address(), &amount);

        Ok(())
    }

    /// Admin chuyển tiền trực tiếp cho thành viên.
    pub fn transfer(
        env: Env,
        admin: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        if amount <= 0 {
            return Err(FamilyFundError::InvalidAmount);
        }

        // Kiểm tra người nhận là thành viên active
        require_active_member(&env, &to)?;

        // Kiểm tra số dư quỹ
        let balance = get_fund_balance_internal(&env)?;
        if balance < amount {
            return Err(FamilyFundError::InsufficientFunds);
        }

        // Chuyển token từ contract cho thành viên
        let token_address = get_token(&env)?;
        let client = token::TokenClient::new(&env, &token_address);
        client.transfer(&env.current_contract_address(), &to, &amount);

        Ok(())
    }

    /// Thành viên yêu cầu chuyển tiền (cần admin duyệt).
    pub fn request_transfer(
        env: Env,
        member: Address,
        amount: i128,
        reason: String,
    ) -> Result<u64, FamilyFundError> {
        member.require_auth();

        if amount <= 0 {
            return Err(FamilyFundError::InvalidAmount);
        }

        // Kiểm tra thành viên active
        require_active_member(&env, &member)?;

        // Tạo request mới
        let req_id = get_transfer_req_count(&env);
        let request = TransferRequest {
            id: req_id,
            from: member,
            amount,
            reason,
            status: 0, // pending
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::TransferReq(req_id), &request);
        env.storage()
            .persistent()
            .set(&DataKey::TransferReqCount, &(req_id + 1));

        Ok(req_id)
    }

    /// Admin duyệt yêu cầu chuyển tiền → tiền được chuyển tự động.
    pub fn approve_transfer(
        env: Env,
        admin: Address,
        request_id: u64,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        let mut request: TransferRequest = env
            .storage()
            .persistent()
            .get(&DataKey::TransferReq(request_id))
            .ok_or(FamilyFundError::TransferRequestNotFound)?;

        if request.status != 0 {
            return Err(FamilyFundError::InvalidTaskStatus);
        }

        // Kiểm tra số dư quỹ
        let balance = get_fund_balance_internal(&env)?;
        if balance < request.amount {
            return Err(FamilyFundError::InsufficientFunds);
        }

        // Chuyển tiền
        let token_address = get_token(&env)?;
        let client = token::TokenClient::new(&env, &token_address);
        client.transfer(
            &env.current_contract_address(),
            &request.from,
            &request.amount,
        );

        // Cập nhật trạng thái
        request.status = 1; // approved
        env.storage()
            .persistent()
            .set(&DataKey::TransferReq(request_id), &request);

        Ok(())
    }

    /// Admin từ chối yêu cầu chuyển tiền.
    pub fn reject_transfer(
        env: Env,
        admin: Address,
        request_id: u64,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        let mut request: TransferRequest = env
            .storage()
            .persistent()
            .get(&DataKey::TransferReq(request_id))
            .ok_or(FamilyFundError::TransferRequestNotFound)?;

        if request.status != 0 {
            return Err(FamilyFundError::InvalidTaskStatus);
        }

        request.status = 2; // rejected
        env.storage()
            .persistent()
            .set(&DataKey::TransferReq(request_id), &request);

        Ok(())
    }

    /// Xem số dư quỹ gia đình (token balance của contract).
    pub fn get_fund_balance(env: Env) -> Result<i128, FamilyFundError> {
        get_fund_balance_internal(&env)
    }

    /// Xem chi tiết yêu cầu chuyển tiền
    pub fn get_transfer_request(
        env: Env,
        request_id: u64,
    ) -> Result<TransferRequest, FamilyFundError> {
        env.storage()
            .persistent()
            .get(&DataKey::TransferReq(request_id))
            .ok_or(FamilyFundError::TransferRequestNotFound)
    }

    // ─────────────────────────────────────────────────────────
    //  Monthly Allowance — Lương tháng
    // ─────────────────────────────────────────────────────────

    /// Admin thiết lập lương tháng cho thành viên.
    /// `interval` tính bằng giây (default 30 ngày = 2_592_000).
    pub fn set_allowance(
        env: Env,
        admin: Address,
        member: Address,
        amount: i128,
        interval: u64,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        if amount <= 0 {
            return Err(FamilyFundError::InvalidAmount);
        }

        // Kiểm tra thành viên tồn tại và active
        require_active_member(&env, &member)?;

        let allowance = Allowance {
            member: member.clone(),
            amount,
            interval,
            last_claimed: env.ledger().timestamp(), // bắt đầu tính từ bây giờ
            is_active: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Allowance(member), &allowance);

        Ok(())
    }

    /// Thành viên claim lương tháng.
    /// Chỉ claim được khi đã đủ thời gian interval.
    /// Nếu bỏ lỡ nhiều kỳ, chỉ nhận được 1 kỳ mỗi lần claim.
    pub fn claim_allowance(env: Env, member: Address) -> Result<i128, FamilyFundError> {
        member.require_auth();

        // Kiểm tra thành viên active
        require_active_member(&env, &member)?;

        // Lấy allowance
        let mut allowance: Allowance = env
            .storage()
            .persistent()
            .get(&DataKey::Allowance(member.clone()))
            .ok_or(FamilyFundError::NoAllowanceSet)?;

        if !allowance.is_active {
            return Err(FamilyFundError::NoAllowanceSet);
        }

        // Kiểm tra thời gian
        let now = env.ledger().timestamp();
        let elapsed = now - allowance.last_claimed;
        if elapsed < allowance.interval {
            return Err(FamilyFundError::TooEarlyToClaim);
        }

        // Tính số kỳ đã trôi qua (cho phép claim nhiều kỳ nếu bỏ lỡ)
        let periods = elapsed / allowance.interval;
        let total_amount = allowance.amount * (periods as i128);

        // Kiểm tra số dư quỹ
        let balance = get_fund_balance_internal(&env)?;
        if balance < total_amount {
            return Err(FamilyFundError::InsufficientFunds);
        }

        // Chuyển token
        let token_address = get_token(&env)?;
        let client = token::TokenClient::new(&env, &token_address);
        client.transfer(&env.current_contract_address(), &member, &total_amount);

        // Cập nhật last_claimed (snap to period boundary)
        allowance.last_claimed += periods * allowance.interval;
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(member), &allowance);

        Ok(total_amount)
    }

    /// Xem thông tin lương tháng của thành viên
    pub fn get_allowance(env: Env, member: Address) -> Result<Allowance, FamilyFundError> {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(member))
            .ok_or(FamilyFundError::NoAllowanceSet)
    }

    // ─────────────────────────────────────────────────────────
    //  Tasks & Rewards — Nhiệm vụ & Phần thưởng
    // ─────────────────────────────────────────────────────────

    /// Admin tạo nhiệm vụ mới và giao cho thành viên.
    pub fn create_task(
        env: Env,
        admin: Address,
        title: String,
        description: String,
        reward: i128,
        assignee: Address,
    ) -> Result<u64, FamilyFundError> {
        require_admin(&env, &admin)?;

        if reward <= 0 {
            return Err(FamilyFundError::InvalidAmount);
        }

        // Kiểm tra assignee là thành viên active
        require_active_member(&env, &assignee)?;

        let task_id = get_task_count(&env);
        let task = Task {
            id: task_id,
            title,
            description,
            reward,
            assignee,
            created_by: admin,
            status: 0, // pending
            created_at: env.ledger().timestamp(),
            completed_at: 0,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Task(task_id), &task);
        env.storage()
            .persistent()
            .set(&DataKey::TaskCount, &(task_id + 1));

        Ok(task_id)
    }

    /// Thành viên báo hoàn thành nhiệm vụ (submit).
    /// Chỉ người được giao mới có quyền submit.
    pub fn submit_task(env: Env, member: Address, task_id: u64) -> Result<(), FamilyFundError> {
        member.require_auth();

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .ok_or(FamilyFundError::TaskNotFound)?;

        // Chỉ assignee mới được submit
        if task.assignee != member {
            return Err(FamilyFundError::Unauthorized);
        }

        // Chỉ task pending (0) mới submit được
        if task.status != 0 {
            return Err(FamilyFundError::InvalidTaskStatus);
        }

        task.status = 1; // submitted
        env.storage()
            .persistent()
            .set(&DataKey::Task(task_id), &task);

        Ok(())
    }

    /// Admin duyệt nhiệm vụ → phần thưởng tự động chuyển cho thành viên.
    pub fn approve_task(
        env: Env,
        admin: Address,
        task_id: u64,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .ok_or(FamilyFundError::TaskNotFound)?;

        // Chỉ task submitted (1) mới approve được
        if task.status != 1 {
            return Err(FamilyFundError::InvalidTaskStatus);
        }

        // Kiểm tra số dư quỹ
        let balance = get_fund_balance_internal(&env)?;
        if balance < task.reward {
            return Err(FamilyFundError::InsufficientFunds);
        }

        // Chuyển phần thưởng
        let token_address = get_token(&env)?;
        let client = token::TokenClient::new(&env, &token_address);
        client.transfer(
            &env.current_contract_address(),
            &task.assignee,
            &task.reward,
        );

        // Cập nhật trạng thái
        task.status = 2; // approved
        task.completed_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Task(task_id), &task);

        Ok(())
    }

    /// Admin từ chối nhiệm vụ → quay lại pending để thành viên làm lại.
    pub fn reject_task(
        env: Env,
        admin: Address,
        task_id: u64,
    ) -> Result<(), FamilyFundError> {
        require_admin(&env, &admin)?;

        let mut task: Task = env
            .storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .ok_or(FamilyFundError::TaskNotFound)?;

        // Chỉ task submitted (1) mới reject được
        if task.status != 1 {
            return Err(FamilyFundError::InvalidTaskStatus);
        }

        task.status = 0; // back to pending
        env.storage()
            .persistent()
            .set(&DataKey::Task(task_id), &task);

        Ok(())
    }

    /// Xem thông tin nhiệm vụ
    pub fn get_task(env: Env, task_id: u64) -> Result<Task, FamilyFundError> {
        env.storage()
            .persistent()
            .get(&DataKey::Task(task_id))
            .ok_or(FamilyFundError::TaskNotFound)
    }

    /// Xem tất cả nhiệm vụ
    pub fn get_all_tasks(env: Env) -> Vec<Task> {
        let count = get_task_count(&env);
        let mut tasks = Vec::new(&env);

        for i in 0..count {
            if let Some(task) = env
                .storage()
                .persistent()
                .get::<_, Task>(&DataKey::Task(i))
            {
                tasks.push_back(task);
            }
        }
        tasks
    }
}

mod test;
