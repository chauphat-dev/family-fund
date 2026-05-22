export const MOCK_DATA = {
  fundBalance: 24560.85,
  adminAddress: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
  
  members: [
    {
      address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      name: 'Bố (Admin)',
      role: 1,
      joined_at: Math.floor(Date.now() / 1000) - 86400 * 30,
      is_active: true,
      avatar: '👨',
    },
    {
      address: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
      name: 'Mẹ',
      role: 0,
      joined_at: Math.floor(Date.now() / 1000) - 86400 * 25,
      is_active: true,
      avatar: '👩',
    },
    {
      address: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF',
      name: 'Con Gái',
      role: 0,
      joined_at: Math.floor(Date.now() / 1000) - 86400 * 10,
      is_active: true,
      avatar: '👧',
    },
  ],

  allowances: [
    {
      member: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF', // Mẹ
      amount: 5000,
      interval: 2592000, // 30 days
      last_claimed: Math.floor(Date.now() / 1000) - 86400 * 15,
      is_active: true,
    },
    {
      member: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF', // Con gái
      amount: 500,
      interval: 2592000, // 30 days
      last_claimed: Math.floor(Date.now() / 1000) - 86400 * 31, // Can claim now
      is_active: true,
    },
  ],

  tasks: [
    {
      id: 0,
      title: 'Quét dọn nhà cửa',
      description: 'Lau dọn phòng khách và phòng bếp sạch sẽ',
      reward: 50,
      assignee: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF',
      created_by: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      status: 0, // Pending
      created_at: Math.floor(Date.now() / 1000) - 86400 * 2,
      completed_at: 0,
    },
    {
      id: 1,
      title: 'Rửa bát',
      description: 'Rửa bát đĩa sau bữa tối',
      reward: 20,
      assignee: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF',
      created_by: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      status: 1, // Submitted
      created_at: Math.floor(Date.now() / 1000) - 86400 * 1,
      completed_at: 0,
    },
    {
      id: 2,
      title: 'Đi siêu thị',
      description: 'Mua đồ ăn cho cả tuần',
      reward: 100,
      assignee: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
      created_by: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      status: 2, // Approved
      created_at: Math.floor(Date.now() / 1000) - 86400 * 5,
      completed_at: Math.floor(Date.now() / 1000) - 86400 * 4,
    },
  ],

  transferRequests: [
    {
      id: 0,
      from: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
      amount: 1500,
      reason: 'Tiền học phí cho con',
      status: 0, // Pending
      created_at: Math.floor(Date.now() / 1000) - 86400 * 1,
    },
    {
      id: 1,
      from: 'GCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCWHF',
      amount: 100,
      reason: 'Mua sách tham khảo',
      status: 1, // Approved
      created_at: Math.floor(Date.now() / 1000) - 86400 * 3,
    },
  ],
};
