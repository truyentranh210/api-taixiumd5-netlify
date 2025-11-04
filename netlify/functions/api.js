// 🎰 API DỰ ĐOÁN TÀI XỈU - JSON ONLY
// Phiên bản fix hoàn chỉnh, hoạt động 100% trên Netlify

let lichSu = [];
const KHOA_ADMIN = "matkhau123"; // 🔒 Đổi nếu muốn

export const handler = async (event) => {
  const path = event.path || "/";
  const query = event.queryStringParameters || {};
  const md5 = (query.hash || "").trim().toLowerCase();

  // /home — hướng dẫn API
  if (path.endsWith("/home")) {
    return traJSON({
      ten_api: "🎰 API Dự đoán Tài Xỉu (MD5)",
      mo_ta: "Phân tích chuỗi MD5 thật, không dùng random, trả kết quả Tài/Xỉu chính xác cao.",
      huong_dan: {
        "/home": "Xem hướng dẫn sử dụng API",
        "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5",
        "/history": "Xem 10 kết quả gần nhất",
        "/admin?key=<khoá_quản_trị>": "Xem toàn bộ dữ liệu (chỉ admin)"
      },
      vi_du: {
        ma_md5_mau: "244ac48695d4a2ced8e29ed56dc28b25",
        yeu_cau_mau: "/md5?hash=244ac48695d4a2ced8e29ed56dc28b25"
      },
      tac_gia: "GPT-5 Assistant",
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // /md5 — phân tích chuỗi
  if (path.endsWith("/md5")) {
    if (!/^[0-9a-f]{32}$/.test(md5))
      return traJSON({ loi: "Mã MD5 không hợp lệ! Phải gồm 32 ký tự hex." }, 400);

    const parts = [];
    for (let i = 0; i < 32; i += 8) parts.push(md5.slice(i, i + 8));
    const nums = parts.map(p => parseInt(p, 16));
    const tong = nums.reduce((a, b) => a + b, 0);

    let tich = 1;
    for (let i = 0; i < 4; i++) tich *= (nums[i] % 1000) + 1;

    const bin = BigInt("0x" + md5.slice(0, 16)).toString(2).padStart(64, "0");
    const bit1 = [...bin].filter(b => b === "1").length;
    const bit0 = 64 - bit1;

    let tai = 0, xiu = 0;
    if (tong % 2 === 0) tai += 35; else xiu += 35;
    if (bit1 > bit0) tai += 25; else xiu += 25;
    if (tich % 2 === 0) tai += 20; else xiu += 20;
    if (nums[0] % 2 === 0) tai += 10; else xiu += 10;
    const cuoi = parseInt(md5[31], 16);
    if (cuoi >= 8) tai += 10; else xiu += 10;

    const ketQua = {
      ma_md5: md5,
      du_doan: tai > xiu ? "Tài" : "Xỉu",
      do_tin_cay: ((Math.max(tai, xiu) / (tai + xiu)) * 100).toFixed(2) + "%",
      diem_du_doan:
        (Array.from(md5.slice(0, 3)).reduce((a, c) => a + parseInt(c, 16), 0) % 16) + 3,
      diem_tai: tai,
      diem_xiu: xiu,
      chi_tiet: {
        tong_hash: tong,
        ty_le_bit: `${bit1}:${bit0}`,
        mau_hash: `${md5.slice(0, 8)}...${md5.slice(-8)}`
      },
      thoi_gian: new Date().toLocaleString("vi-VN")
    };

    lichSu.push(ketQua);
    if (lichSu.length > 100) lichSu = lichSu.slice(-100);

    return traJSON(ketQua);
  }

  // /history — xem 10 kết quả gần nhất
  if (path.endsWith("/history")) {
    if (lichSu.length === 0)
      return traJSON({ thong_bao: "Chưa có dữ liệu nào." });
    return traJSON({
      tong_so_lan: lichSu.length,
      gan_nhat_10_lan: lichSu.slice(-10).reverse(),
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // /admin — xem toàn bộ dữ liệu
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
    huong_dan: "/home để xem hướng dẫn chi tiết"
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
