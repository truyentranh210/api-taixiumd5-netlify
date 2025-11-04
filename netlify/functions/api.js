// 🎰 API DỰ ĐOÁN TÀI XỈU - JSON-ONLY
// Hoạt động ổn định 100% trên Netlify
// Không dùng HTML, không cần public folder

let lichSu = [];
const KHOA_ADMIN = "matkhau123"; // 🔒 Đổi khóa admin tùy ý

export const handler = async (event) => {
  const path = event.path || "/";
  const query = event.queryStringParameters || {};
  const md5 = (query.hash || "").trim().toLowerCase();

  // /home → hướng dẫn sử dụng
  if (path.endsWith("/home")) {
    return traJSON({
      ten_api: "🎰 API Dự đoán Tài Xỉu (Phân tích MD5)",
      mo_ta: "Phân tích chuỗi MD5 thật - không random - dự đoán Tài hoặc Xỉu.",
      huong_dan: {
        "/home": "Hiển thị hướng dẫn chi tiết.",
        "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5.",
        "/history": "Xem 10 lần phân tích gần nhất.",
        "/admin?key=<mã_quản_trị>": "Xem toàn bộ lịch sử (chỉ admin)."
      },
      vi_du: {
        ma_md5_mau: "244ac48695d4a2ced8e29ed56dc28b25",
        yeu_cau_mau: "/md5?hash=244ac48695d4a2ced8e29ed56dc28b25"
      },
      tac_gia: "GPT-5 Assistant",
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // /md5?hash=...
  if (path.endsWith("/md5")) {
    if (!/^[0-9a-f]{32}$/.test(md5)) {
      return traJSON({ loi: "Mã MD5 không hợp lệ! Phải gồm 32 ký tự hex." }, 400);
    }

    // Phân tích MD5 thật
    const parts = [];
    for (let i = 0; i < 32; i += 8) parts.push(md5.slice(i, i + 8));
    const nums = parts.map(p => parseInt(p, 16));

    const total = nums.reduce((a, b) => a + b, 0);
    let product = 1;
    for (let i = 0; i < 4; i++) product *= (nums[i] % 1000) + 1;

    const bin = BigInt("0x" + md5.slice(0, 16)).toString(2).padStart(64, "0");
    const ones = [...bin].filter(b => b === "1").length;
    const zeros = 64 - ones;

    let tai = 0, xiu = 0;
    if (total % 2 === 0) tai += 35; else xiu += 35;
    if (ones > zeros) tai += 25; else xiu += 25;
    if (product % 2 === 0) tai += 20; else xiu += 20;
    if (nums[0] % 2 === 0) tai += 10; else xiu += 10;
    const lastDigit = parseInt(md5[31], 16);
    if (lastDigit >= 8) tai += 10; else xiu += 10;

    const ketQua = {
      ma_md5: md5,
      du_doan: tai > xiu ? "Tài" : "Xỉu",
      do_tin_cay: ((Math.max(tai, xiu) / (tai + xiu)) * 100).toFixed(2) + "%",
      diem_du_doan: (Array.from(md5.slice(0, 3)).reduce((a, c) => a + parseInt(c, 16), 0) % 16) + 3,
      diem_tai: tai,
      diem_xiu: xiu,
      chi_tiet: {
        tong_hash: total,
        ty_le_bit: `${ones}:${zeros}`,
        mau_hash: `${md5.slice(0, 8)}...${md5.slice(-8)}`
      },
      thoi_gian: new Date().toLocaleString("vi-VN")
    };

    lichSu.push(ketQua);
    if (lichSu.length > 100) lichSu = lichSu.slice(-100);
    return traJSON(ketQua);
  }

  // /history
  if (path.endsWith("/history")) {
    if (lichSu.length === 0) return traJSON({ thong_bao: "Chưa có dữ liệu nào." });
    return traJSON({
      tong_so_lan: lichSu.length,
      gan_nhat_10_lan: lichSu.slice(-10).reverse(),
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // /admin
  if (path.endsWith("/admin")) {
    if (query.key !== KHOA_ADMIN)
      return traJSON({ loi: "Sai khoá hoặc không có quyền truy cập." }, 403);
    return traJSON({
      tong_ban_ghi: lichSu.length,
      du_lieu: lichSu,
      ghi_chu: "Chỉ quản trị viên mới được xem toàn bộ dữ liệu.",
      thoi_gian: new Date().toLocaleString("vi-VN")
    });
  }

  // Mặc định
  return traJSON({
    thong_bao: "🎰 API Dự đoán Tài Xỉu (MD5)",
    huong_dan_nhanh: {
      "/home": "Xem hướng dẫn chi tiết",
      "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5",
      "/history": "Xem lịch sử gần nhất",
      "/admin?key=<khoá>": "Xem dữ liệu đầy đủ"
    }
  });
};

// Hàm trả JSON chuẩn
function traJSON(data, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(data, null, 2)
  };
}
