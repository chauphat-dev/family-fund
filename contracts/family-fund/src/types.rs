use soroban_sdk::{contracttype, Address, String};

// ═══════════════════════════════════════════════════════════════
//  Family Member — Thông tin thành viên gia đình
// ═══════════════════════════════════════════════════════════════

#[derive(Clone)]
#[contracttype]
pub struct FamilyMember {
    pub name: String,       // Tên thành viên
    pub address: Address,   // Địa chỉ ví
    pub role: u32,          // 0 = member, 1 = admin
    pub joined_at: u64,     // Timestamp gia nhập
    pub is_active: bool,    // Còn hoạt động không
}

// ═══════════════════════════════════════════════════════════════
//  Allowance — Lương tháng cho từng thành viên
// ═══════════════════════════════════════════════════════════════

#[derive(Clone)]
#[contracttype]
pub struct Allowance {
    pub member: Address,    // Thành viên nhận lương
    pub amount: i128,       // Số tiền mỗi kỳ
    pub interval: u64,      // Khoảng thời gian (seconds), default 30 ngày = 2_592_000
    pub last_claimed: u64,  // Timestamp lần claim cuối
    pub is_active: bool,    // Còn hoạt động không
}

// ═══════════════════════════════════════════════════════════════
//  Task — Nhiệm vụ (việc nhà, v.v.)
// ═══════════════════════════════════════════════════════════════

/// Task status constants:
/// 0 = Pending (chờ thực hiện)
/// 1 = Submitted (đã nộp, chờ duyệt)
/// 2 = Approved (đã duyệt, thưởng đã chuyển)
/// 3 = Rejected (bị từ chối, quay lại pending)
#[derive(Clone)]
#[contracttype]
pub struct Task {
    pub id: u64,              // ID nhiệm vụ
    pub title: String,        // Tên nhiệm vụ (dọn nhà, nấu cơm, ...)
    pub description: String,  // Mô tả chi tiết
    pub reward: i128,         // Phần thưởng
    pub assignee: Address,    // Người được giao
    pub created_by: Address,  // Admin tạo
    pub status: u32,          // 0=pending, 1=submitted, 2=approved, 3=rejected
    pub created_at: u64,      // Timestamp tạo
    pub completed_at: u64,    // Timestamp hoàn thành (0 nếu chưa)
}

// ═══════════════════════════════════════════════════════════════
//  TransferRequest — Yêu cầu chuyển tiền từ thành viên
// ═══════════════════════════════════════════════════════════════

/// Transfer request status constants:
/// 0 = Pending (chờ duyệt)
/// 1 = Approved (đã duyệt, tiền đã chuyển)
/// 2 = Rejected (bị từ chối)
#[derive(Clone)]
#[contracttype]
pub struct TransferRequest {
    pub id: u64,           // ID yêu cầu
    pub from: Address,     // Người yêu cầu
    pub amount: i128,      // Số tiền
    pub reason: String,    // Lý do
    pub status: u32,       // 0=pending, 1=approved, 2=rejected
    pub created_at: u64,   // Timestamp tạo
}

// ═══════════════════════════════════════════════════════════════
//  DataKey — Storage keys cho persistent/instance storage
// ═══════════════════════════════════════════════════════════════

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,                   // Address — admin chính
    Token,                   // Address — token contract address
    Member(Address),         // FamilyMember — data theo address
    MemberList,              // Vec<Address> — danh sách tất cả thành viên
    Allowance(Address),      // Allowance — lương tháng theo address
    Task(u64),               // Task — theo task ID
    TaskCount,               // u64 — đếm tổng số task
    TransferReq(u64),        // TransferRequest — theo request ID
    TransferReqCount,        // u64 — đếm tổng số transfer requests
}
