const COMMON_EVENT_TRANSLATION = [
  [/CPI|Consumer Price Index/i, 'CPI (Chỉ số giá tiêu dùng)'],
  [/Core CPI/i, 'CPI lõi'],
  [/PPI|Producer Price Index/i, 'PPI (Chỉ số giá sản xuất)'],
  [/Non-Farm|Nonfarm|NFP/i, 'Bảng lương phi nông nghiệp'],
  [/Unemployment Rate/i, 'Tỷ lệ thất nghiệp'],
  [/Jobless Claims/i, 'Đơn xin trợ cấp thất nghiệp'],
  [/Interest Rate Decision/i, 'Quyết định lãi suất'],
  [/Main Refinancing Rate/i, 'Lãi suất tái cấp vốn chính'],
  [/Monetary Policy Statement/i, 'Tuyên bố chính sách tiền tệ'],
  [/GDP/i, 'GDP (Tổng sản phẩm quốc nội)'],
  [/Retail Sales/i, 'Doanh số bán lẻ'],
  [/Industrial Production/i, 'Sản xuất công nghiệp'],
  [/Manufacturing/i, 'Sản xuất chế tạo'],
  [/Trade Balance/i, 'Cán cân thương mại'],
  [/Current Account/i, 'Tài khoản vãng lai'],
  [/Consumer Confidence/i, 'Niềm tin tiêu dùng'],
  [/Business Confidence/i, 'Niềm tin kinh doanh'],
  [/PMI/i, 'PMI (Chỉ số quản lý mua hàng)'],
  [/Building Permits/i, 'Giấy phép xây dựng'],
  [/Housing Starts/i, 'Khởi công nhà ở'],
  [/Existing Home Sales/i, 'Doanh số nhà cũ'],
  [/New Home Sales/i, 'Doanh số nhà mới'],
  [/Initial Jobless Claims/i, 'Đơn xin thất nghiệp lần đầu'],
  [/Fed Chair/i, 'Chủ tịch Fed'],
  [/Press Conference/i, 'Họp báo'],
  [/Prelim GDP/i, 'GDP sơ bộ'],
  [/Prelim/i, 'Sơ bộ'],
  [/Final GDP/i, 'GDP cuối cùng'],
  [/Flash/i, 'Nhanh'],
  [/m\/m|MoM/i, '(tháng/tháng)'],
  [/y\/y|YoY/i, '(năm/năm)'],
  [/q\/q|QoQ/i, '(quý/quý)'],
  [/Core Retail Sales/i, 'Doanh số bán lẻ lõi'],
  [/Average Hourly Earnings/i, 'Thu nhập trung bình theo giờ'],
  [/Average Weekly Hours/i, 'Số giờ làm việc trung bình'],
  [/ISM Manufacturing/i, 'ISM Sản xuất'],
  [/ISM Services/i, 'ISM Dịch vụ'],
  [/Philly Fed|Philadelphia Fed/i, 'Chỉ số Philly Fed'],
  [/Empire State/i, 'Chỉ số Empire State'],
  [/Durable Goods Orders/i, 'Đơn hàng hóa lâu bền'],
  [/Factory Orders/i, 'Đơn đặt hàng nhà máy'],
  [/Michigan Sentiment/i, 'Niềm tin người tiêu dùng Michigan'],
  [/CB Leading Index/i, 'Chỉ số dẫn dắt CB'],
  [/Treasury Krona Auction/i, 'Đấu giá trái phiếu'],
];

function localizeTitle(title) {
  if (!title) return 'Sự kiện kinh tế';
  let result = title.trim();
  for (const [pattern, replacement] of COMMON_EVENT_TRANSLATION) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

const COUNTRY_NAMES = {
  USD: 'Mỹ',
  EUR: 'Khu Euro',
  GBP: 'Anh',
  JPY: 'Nhật',
  CNY: 'Trung Quốc',
  AUD: 'Úc',
  CAD: 'Canada',
  CHF: 'Thụy Sĩ',
  NZD: 'New Zealand',
};

export function localizeCountry(code) {
  return COUNTRY_NAMES[code] || code;
}

export function localizeImpact(impact) {
  if (impact === 'High') return 'Cao';
  if (impact === 'Medium') return 'TB';
  return 'Thấp';
}

const MONTHS_VI = [
  'tháng 1',
  'tháng 2',
  'tháng 3',
  'tháng 4',
  'tháng 5',
  'tháng 6',
  'tháng 7',
  'tháng 8',
  'tháng 9',
  'tháng 10',
  'tháng 11',
  'tháng 12',
];

export function formatDateHeader(date) {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return 'Hôm nay';
  if (sameDay(d, tomorrow)) return 'Ngày mai';
  if (sameDay(d, yesterday)) return 'Hôm qua';

  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${MONTHS_VI[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default localizeTitle;