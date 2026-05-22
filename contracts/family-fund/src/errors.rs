use soroban_sdk::contracterror;

// ═══════════════════════════════════════════════════════════════
//  FamilyFundError — Custom errors cho contract
// ═══════════════════════════════════════════════════════════════

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FamilyFundError {
    /// Contract chưa được khởi tạo
    NotInitialized = 1,
    /// Contract đã được khởi tạo rồi
    AlreadyInitialized = 2,
    /// Không có quyền thực hiện hành động này
    Unauthorized = 3,
    /// Không tìm thấy thành viên
    MemberNotFound = 4,
    /// Thành viên đã tồn tại
    MemberAlreadyExists = 5,
    /// Không đủ tiền trong quỹ
    InsufficientFunds = 6,
    /// Số tiền không hợp lệ (phải > 0)
    InvalidAmount = 7,
    /// Chưa đến lúc claim lương tháng
    TooEarlyToClaim = 8,
    /// Chưa thiết lập lương tháng cho thành viên này
    NoAllowanceSet = 9,
    /// Không tìm thấy nhiệm vụ
    TaskNotFound = 10,
    /// Trạng thái nhiệm vụ không hợp lệ cho hành động này
    InvalidTaskStatus = 11,
    /// Không tìm thấy yêu cầu chuyển tiền
    TransferRequestNotFound = 12,
    /// Thành viên đã bị vô hiệu hóa
    MemberInactive = 13,
}
