// 🎰 API DỰ ĐOÁN TÀI XỈU - JSON THUẦN
// Không dùng HTML, tương thích hoàn toàn với Netlify
// Endpoint: /home, /md5, /history, /admin

let lichSu = [];
const KHOA_ADMIN = "minhhocgioi"; // 🔒 Đổi khóa tùy ý

export const handler = async (event) => {
  const path = event.path || "/";
  const query = event.queryStringParameters || {};
  const md5 = (query.hash || "").trim().toLowerCase();

  // 1️⃣ /home - hướng dẫn
  if (path.endsWith("/home")) {
    return traJSON({
      ten_api: "🎰 API Dự đoán Tài Xỉu (Phân tích MD5)",
      mo_ta: "Phân tích chuỗi MD5 thật, không dùng random, trả về kết quả Tài hoặc Xỉu.",
      huong_dan: {
        "/home": "Hiển thị hướng dẫn API",
        "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5 để dự đoán Tài/Xỉu",
        "/history": "Xem 10 kết quả phân tích gần nhất",
        "/admin?key=<mã_quản_trị>": "Xem toàn bộ lịch sử (chỉ admin)"
      },
      vi_du: {
        ma_md5_mau: "244ac48695d4a2ced8e29ed56dc28b25",
        yeu_cau_mau: "/md5?hash=244ac48695d4a2ced8e29ed56dc28b25"
      },
      tac_gia: "GPT-5 Assistant",
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // 2️⃣ /md5 - phân tích chuỗi
  if (path.endsWith("/md5")) {
    if (!/^[0-9a-f]{32}$/.test(md5)) {
      return traJSON({ loi: "Mã MD5 không hợp lệ! Phải gồm 32 ký tự hex." }, 400);
    }

    const phan = [];
    for (let i = 0; i < 32; i += 8) phan.push(md5.slice(i, i + 8));
    const so = phan.map(p => parseInt(p, 16));
    const tong = so.reduce((a, b) => a + b, 0);

    let tich = 1;
    for (let i = 0; i < 4; i++) tich *= (so[i] % 1000) + 1;

    const nhiPhan = BigInt("0x" + md5.slice(0, 16)).toString(2).padStart(64, "0");
    const soBit1 = [...nhiPhan].filter(c => c === "1").length;
    const soBit0 = 64 - soBit1;

    let tai = 0, xiu = 0;
    if (tong % 2 === 0) tai += 35; else xiu += 35;
    if (soBit1 > soBit0) tai += 25; else xiu += 25;
    if (tich % 2 === 0) tai += 20; else xiu += 20;
    if (so[0] % 2 === 0) tai += 10; else xiu += 10;

    const lastDigit = parseInt(md5[31], 16);
    if (lastDigit >= 8) tai += 10; else xiu += 10;

    const duDoan = tai > xiu ? "Tài" : "Xỉu";
    const doTinCay = Math.round((Math.max(tai, xiu) / (tai + xiu)) * 10000) / 100;
    const diemDuDoan = (Array.from(md5.slice(0, 3)).reduce((a, c) => a + parseInt(c, 16), 0) % 16) + 3;

    const ketQua = {
      ma_md5: md5,
      du_doan: duDoan,
      do_tin_cay: doTinCay + "%",
      diem_du_doan: diemDuDoan,
      diem_tai: tai,
      diem_xiu: xiu,
      chi_tiet: {
        tong_hash: tong,
        ty_le_bit: `${soBit1}:${soBit0}`,
        mau_hash: `${md5.slice(0, 8)}...${md5.slice(-8)}`
      },
      thoi_gian: new Date().toLocaleString("vi-VN")
    };

    lichSu.push(ketQua);
    if (lichSu.length > 100) lichSu = lichSu.slice(-100);

    return traJSON(ketQua);
  }

  // 3️⃣ /history - lịch sử gần nhất
  if (path.endsWith("/history")) {
    if (lichSu.length === 0) return traJSON({ thong_bao: "Chưa có dữ liệu phân tích nào." });
    return traJSON({
      tong_so_lan: lichSu.length,
      gan_nhat_10_lan: lichSu.slice(-10).reverse(),
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // 4️⃣ /admin - xem toàn bộ dữ liệu
  if (path.endsWith("/admin")) {
    if (query.key !== KHOA_ADMIN) return traJSON({ loi: "Sai khoá hoặc không có quyền truy cập." }, 403);
    return traJSON({
      tong_ban_ghi: lichSu.length,
      du_lieu: lichSu,
      ghi_chu: "Chỉ quản trị viên mới được xem toàn bộ dữ liệu.",
      thoi_gian: new Date().toLocaleString("vi-VN")
    });
  }

  // 5️⃣ Mặc định
  return traJSON({
    thong_bao: "🎰 API Dự đoán Tài Xỉu (MD5)",
    huong_dan_nhanh: {
      "/home": "Xem hướng dẫn chi tiết",
      "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5",
      "/history": "Xem lịch sử gần nhất",
      "/admin?key=<khoá>": "Xem dữ liệu đầy đủ (chỉ admin)"
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
