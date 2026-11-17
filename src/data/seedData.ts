import { FinanceData } from '../types/finance';

export const INCOME_CATEGORIES = [
  'Lương',
  'Thưởng',
  'Đầu tư',
  'Kinh doanh',
  'Thu nhập phụ',
  'Khác',
] as const;

export const EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Cố định',
  'Di chuyển',
  'Giải trí',
  'Mua sắm',
  'Sức khỏe',
  'Đầu tư',
  'Khác',
] as const;

export const STOCK_DIRECTORY: Record<string, { name: string; basePrice: number }> = {
  VCB: { name: 'Ngân hàng Ngoại thương (Vietcombank)', basePrice: 52800 },
  MBB: { name: 'Ngân hàng Quân đội (MBBank)', basePrice: 18900 },
  VNM: { name: 'Sữa Việt Nam (Vinamilk)', basePrice: 53600 },
  PC1: { name: 'Tập đoàn PC1', basePrice: 16450 },
  FPT: { name: 'Tập đoàn FPT', basePrice: 136500 },
  HPG: { name: 'Tập đoàn Hòa Phát', basePrice: 27300 },
  TCB: { name: 'Ngân hàng Kỹ thương (Techcombank)', basePrice: 24100 },
  ACB: { name: 'Ngân hàng Á Châu (ACB)', basePrice: 25600 },
  MWG: { name: 'Thế Giới Di Động', basePrice: 64200 },
  SSI: { name: 'Chứng khoán SSI', basePrice: 26900 },
  VHM: { name: 'Vinhomes', basePrice: 41800 },
  VIC: { name: 'Vingroup', basePrice: 42500 },
  GAS: { name: 'Tổng Công ty Khí Việt Nam', basePrice: 71400 },
  PNJ: { name: 'Vàng bạc Đá quý Phú Nhuận', basePrice: 97800 },
};

export const GOLD_BENCHMARKS: Record<string, number> = {
  'Vàng nhẫn 9999': 13_620_000, // VND per chỉ
  'Vàng miếng SJC': 13_620_000, // VND per chỉ (136.2M per lượng)
  'Vàng PNJ 24K': 13_620_000,   // VND per chỉ
  'Vàng DOJI 9999': 13_620_000, // VND per chỉ
  'Vàng 985': 12_180_000,       // VND per chỉ
  'Vàng 750 (18K)': 9_050_000,  // VND per chỉ
};

export function createSeedData(): FinanceData {
  const nowISO = '2026-11-17T03:00:00.000Z';

  return {
    openingCash: 162_500_000,
    marketLastSync: nowISO,
    marketSource: 'live',
    stocks: [
      {
        id: 'stk-vcb',
        symbol: 'VCB',
        name: 'Ngân hàng Ngoại thương (Vietcombank)',
        quantity: 500,
        avgCost: 49_500,
        currentPrice: 52_800,
        prevClose: 53_200,
        lastUpdated: nowISO,
      },
      {
        id: 'stk-mbb',
        symbol: 'MBB',
        name: 'Ngân hàng Quân đội (MBBank)',
        quantity: 1500,
        avgCost: 17_200,
        currentPrice: 18_900,
        prevClose: 18_750,
        lastUpdated: nowISO,
      },
      {
        id: 'stk-vnm',
        symbol: 'VNM',
        name: 'Sữa Việt Nam (Vinamilk)',
        quantity: 400,
        avgCost: 55_000,
        currentPrice: 53_600,
        prevClose: 53_800,
        lastUpdated: nowISO,
      },
      {
        id: 'stk-pc1',
        symbol: 'PC1',
        name: 'Tập đoàn PC1',
        quantity: 1000,
        avgCost: 15_400,
        currentPrice: 16_450,
        prevClose: 16_200,
        lastUpdated: nowISO,
      },
    ],
    gold: [
      {
        id: 'gld-9999',
        type: 'Vàng nhẫn 9999',
        unit: 'chỉ',
        quantity: 8,
        buyPrice: 12_450_000,
        currentMarketPrice: 13_620_000,
        lastUpdated: nowISO,
      },
      {
        id: 'gld-sjc',
        type: 'Vàng miếng SJC',
        unit: 'lượng',
        quantity: 2,
        buyPrice: 128_500_000,
        currentMarketPrice: 136_200_000,
        lastUpdated: nowISO,
      },
    ],
    transactions: [
      {
        id: 'tx-101',
        date: '2026-11-15',
        type: 'expense',
        category: 'Ăn uống',
        description: 'Đi siêu thị WinMart cuối tuần',
        amount: 1_450_000,
      },
      {
        id: 'tx-102',
        date: '2026-11-12',
        type: 'expense',
        category: 'Giải trí',
        description: 'Xem phim IMAX & cà phê cùng bạn',
        amount: 480_000,
      },
      {
        id: 'tx-103',
        date: '2026-11-10',
        type: 'income',
        category: 'Đầu tư',
        description: 'Cổ tức tiền mặt VNM đợt 2',
        amount: 2_800_000,
      },
      {
        id: 'tx-104',
        date: '2026-11-05',
        type: 'income',
        category: 'Lương',
        description: 'Lương tháng 11/2026',
        amount: 34_500_000,
      },
      {
        id: 'tx-105',
        date: '2026-11-03',
        type: 'expense',
        category: 'Cố định',
        description: 'Tiền thuê căn hộ & phí quản lý tháng 11',
        amount: 9_800_000,
      },
      {
        id: 'tx-106',
        date: '2026-11-02',
        type: 'expense',
        category: 'Cố định',
        description: 'Điện, nước & Internet cáp quang',
        amount: 1_320_000,
      },
      {
        id: 'tx-107',
        date: '2026-10-25',
        type: 'expense',
        category: 'Sức khỏe',
        description: 'Gia hạn thẻ tập Gym 3 tháng',
        amount: 2_400_000,
      },
      {
        id: 'tx-108',
        date: '2026-10-18',
        type: 'income',
        category: 'Thưởng',
        description: 'Thưởng hoàn thành dự án Q3',
        amount: 12_000_000,
      },
      {
        id: 'tx-109',
        date: '2026-10-05',
        type: 'income',
        category: 'Lương',
        description: 'Lương tháng 10/2026',
        amount: 34_500_000,
      },
      {
        id: 'tx-110',
        date: '2026-10-03',
        type: 'expense',
        category: 'Cố định',
        description: 'Tiền thuê căn hộ tháng 10',
        amount: 9_800_000,
      },
      {
        id: 'tx-111',
        date: '2026-09-05',
        type: 'income',
        category: 'Lương',
        description: 'Lương tháng 09/2026',
        amount: 34_500_000,
      },
      {
        id: 'tx-112',
        date: '2026-09-08',
        type: 'expense',
        category: 'Ăn uống',
        description: 'Chi tiêu sinh hoạt & ăn uống tháng 9',
        amount: 6_900_000,
      },
    ],
    debts: [
      {
        id: 'dbt-1',
        direction: 'i_owe',
        personName: 'Ngân hàng Techcombank (Thẻ tín dụng)',
        amount: 8_450_000,
        loanDate: '2026-10-20',
        dueDate: '2026-11-20',
        note: 'Sao kê kỳ tháng 11 (tự động trích nợ)',
        status: 'unpaid',
      },
      {
        id: 'dbt-2',
        direction: 'i_owe',
        personName: 'Anh Minh (Đồng nghiệp)',
        amount: 12_000_000,
        loanDate: '2026-09-15',
        dueDate: '2026-12-15',
        note: 'Góp vốn mua chung lô thiết bị',
        status: 'unpaid',
      },
      {
        id: 'dbt-3',
        direction: 'owed_to_me',
        personName: 'Trần Quốc Bảo',
        amount: 15_000_000,
        loanDate: '2026-10-05',
        dueDate: '2026-11-12',
        note: 'Cho vay tạm ứng đặt cọc xe',
        status: 'unpaid',
      },
      {
        id: 'dbt-4',
        direction: 'owed_to_me',
        personName: 'Lê Thảo Vy',
        amount: 6_500_000,
        loanDate: '2026-10-28',
        dueDate: '2026-11-21',
        note: 'Ứng trước vé máy bay nhóm du lịch',
        status: 'unpaid',
      },
      {
        id: 'dbt-5',
        direction: 'owed_to_me',
        personName: 'Nguyễn Hoàng Nam',
        amount: 4_000_000,
        loanDate: '2026-08-10',
        dueDate: '2026-09-30',
        note: 'Chuyển khoản lại tiền đặt phòng',
        status: 'paid',
      },
    ],
  };
}
