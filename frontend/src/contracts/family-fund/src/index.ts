import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CD6VB5L3XONP63URCDSZUHBHJ4BBGUHZXAOYGKFA6VY3T2UQXBDXYHBA",
  }
} as const


/**
 * Task status constants:
 * 0 = Pending (chờ thực hiện)
 * 1 = Submitted (đã nộp, chờ duyệt)
 * 2 = Approved (đã duyệt, thưởng đã chuyển)
 * 3 = Rejected (bị từ chối, quay lại pending)
 */
export interface Task {
  assignee: string;
  completed_at: u64;
  created_at: u64;
  created_by: string;
  description: string;
  id: u64;
  reward: i128;
  status: u32;
  title: string;
}

export type DataKey = {tag: "Admin", values: void} | {tag: "Token", values: void} | {tag: "Member", values: readonly [string]} | {tag: "MemberList", values: void} | {tag: "Allowance", values: readonly [string]} | {tag: "Task", values: readonly [u64]} | {tag: "TaskCount", values: void} | {tag: "TransferReq", values: readonly [u64]} | {tag: "TransferReqCount", values: void};


export interface Allowance {
  amount: i128;
  interval: u64;
  is_active: boolean;
  last_claimed: u64;
  member: string;
}


export interface FamilyMember {
  address: string;
  is_active: boolean;
  joined_at: u64;
  name: string;
  role: u32;
}


/**
 * Transfer request status constants:
 * 0 = Pending (chờ duyệt)
 * 1 = Approved (đã duyệt, tiền đã chuyển)
 * 2 = Rejected (bị từ chối)
 */
export interface TransferRequest {
  amount: i128;
  created_at: u64;
  from: string;
  id: u64;
  reason: string;
  status: u32;
}

export const FamilyFundError = {
  /**
   * Contract chưa được khởi tạo
   */
  1: {message:"NotInitialized"},
  /**
   * Contract đã được khởi tạo rồi
   */
  2: {message:"AlreadyInitialized"},
  /**
   * Không có quyền thực hiện hành động này
   */
  3: {message:"Unauthorized"},
  /**
   * Không tìm thấy thành viên
   */
  4: {message:"MemberNotFound"},
  /**
   * Thành viên đã tồn tại
   */
  5: {message:"MemberAlreadyExists"},
  /**
   * Không đủ tiền trong quỹ
   */
  6: {message:"InsufficientFunds"},
  /**
   * Số tiền không hợp lệ (phải > 0)
   */
  7: {message:"InvalidAmount"},
  /**
   * Chưa đến lúc claim lương tháng
   */
  8: {message:"TooEarlyToClaim"},
  /**
   * Chưa thiết lập lương tháng cho thành viên này
   */
  9: {message:"NoAllowanceSet"},
  /**
   * Không tìm thấy nhiệm vụ
   */
  10: {message:"TaskNotFound"},
  /**
   * Trạng thái nhiệm vụ không hợp lệ cho hành động này
   */
  11: {message:"InvalidTaskStatus"},
  /**
   * Không tìm thấy yêu cầu chuyển tiền
   */
  12: {message:"TransferRequestNotFound"},
  /**
   * Thành viên đã bị vô hiệu hóa
   */
  13: {message:"MemberInactive"}
}

export interface Client {
  /**
   * Construct and simulate a deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Nạp tiền vào quỹ gia đình.
   * Bất kỳ ai cũng có thể nạp tiền.
   */
  deposit: ({from, amount}: {from: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem thông tin nhiệm vụ
   */
  get_task: ({task_id}: {task_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Task>>>

  /**
   * Construct and simulate a transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin chuyển tiền trực tiếp cho thành viên.
   */
  transfer: ({admin, to, amount}: {admin: string, to: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem admin hiện tại
   */
  get_admin: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a get_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem token address
   */
  get_token: (options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

  /**
   * Construct and simulate a add_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Thêm thành viên mới vào gia đình.
   * Chỉ admin mới có quyền.
   */
  add_member: ({admin, member_addr, name}: {admin: string, member_addr: string, name: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem thông tin một thành viên
   */
  get_member: ({member_addr}: {member_addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<FamilyMember>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Khởi tạo contract với admin và token address.
   * Chỉ được gọi 1 lần duy nhất.
   */
  initialize: ({admin, token}: {admin: string, token: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin tạo nhiệm vụ mới và giao cho thành viên.
   */
  create_task: ({admin, title, description, reward, assignee}: {admin: string, title: string, description: string, reward: i128, assignee: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a reject_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin từ chối nhiệm vụ → quay lại pending để thành viên làm lại.
   */
  reject_task: ({admin, task_id}: {admin: string, task_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a submit_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Thành viên báo hoàn thành nhiệm vụ (submit).
   * Chỉ người được giao mới có quyền submit.
   */
  submit_task: ({member, task_id}: {member: string, task_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve_task transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin duyệt nhiệm vụ → phần thưởng tự động chuyển cho thành viên.
   */
  approve_task: ({admin, task_id}: {admin: string, task_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem thông tin lương tháng của thành viên
   */
  get_allowance: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Allowance>>>

  /**
   * Construct and simulate a get_all_tasks transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem tất cả nhiệm vụ
   */
  get_all_tasks: (options?: MethodOptions) => Promise<AssembledTransaction<Array<Task>>>

  /**
   * Construct and simulate a remove_member transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Vô hiệu hóa thành viên (soft delete).
   * Chỉ admin mới có quyền.
   */
  remove_member: ({admin, member_addr}: {admin: string, member_addr: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a set_allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin thiết lập lương tháng cho thành viên.
   * `interval` tính bằng giây (default 30 ngày = 2_592_000).
   */
  set_allowance: ({admin, member, amount, interval}: {admin: string, member: string, amount: i128, interval: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_allowance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Thành viên claim lương tháng.
   * Chỉ claim được khi đã đủ thời gian interval.
   * Nếu bỏ lỡ nhiều kỳ, chỉ nhận được 1 kỳ mỗi lần claim.
   */
  claim_allowance: ({member}: {member: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a get_all_members transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem danh sách tất cả thành viên active
   */
  get_all_members: (options?: MethodOptions) => Promise<AssembledTransaction<Array<FamilyMember>>>

  /**
   * Construct and simulate a reject_transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin từ chối yêu cầu chuyển tiền.
   */
  reject_transfer: ({admin, request_id}: {admin: string, request_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a approve_transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Admin duyệt yêu cầu chuyển tiền → tiền được chuyển tự động.
   */
  approve_transfer: ({admin, request_id}: {admin: string, request_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_fund_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem số dư quỹ gia đình (token balance của contract).
   */
  get_fund_balance: (options?: MethodOptions) => Promise<AssembledTransaction<Result<i128>>>

  /**
   * Construct and simulate a request_transfer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Thành viên yêu cầu chuyển tiền (cần admin duyệt).
   */
  request_transfer: ({member, amount, reason}: {member: string, amount: i128, reason: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_transfer_request transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Xem chi tiết yêu cầu chuyển tiền
   */
  get_transfer_request: ({request_id}: {request_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<TransferRequest>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "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" ]),
      options
    )
  }
  public readonly fromJSON = {
    deposit: this.txFromJSON<Result<void>>,
        get_task: this.txFromJSON<Result<Task>>,
        transfer: this.txFromJSON<Result<void>>,
        get_admin: this.txFromJSON<Result<string>>,
        get_token: this.txFromJSON<Result<string>>,
        add_member: this.txFromJSON<Result<void>>,
        get_member: this.txFromJSON<Result<FamilyMember>>,
        initialize: this.txFromJSON<Result<void>>,
        create_task: this.txFromJSON<Result<u64>>,
        reject_task: this.txFromJSON<Result<void>>,
        submit_task: this.txFromJSON<Result<void>>,
        approve_task: this.txFromJSON<Result<void>>,
        get_allowance: this.txFromJSON<Result<Allowance>>,
        get_all_tasks: this.txFromJSON<Array<Task>>,
        remove_member: this.txFromJSON<Result<void>>,
        set_allowance: this.txFromJSON<Result<void>>,
        claim_allowance: this.txFromJSON<Result<i128>>,
        get_all_members: this.txFromJSON<Array<FamilyMember>>,
        reject_transfer: this.txFromJSON<Result<void>>,
        approve_transfer: this.txFromJSON<Result<void>>,
        get_fund_balance: this.txFromJSON<Result<i128>>,
        request_transfer: this.txFromJSON<Result<u64>>,
        get_transfer_request: this.txFromJSON<Result<TransferRequest>>
  }
}