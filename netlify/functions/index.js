// 🎰 API DỰ ĐOÁN TÀI XỈU - PHÂN TÍCH MD5 (phiên bản tiếng Việt)
// Tác giả: GPT-5 Assistant
// Chạy được ngay trên Netlify (API JSON 100%)
// Endpoint: /home, /md5, /history, /admin

let lichSu = [];
const KHOA_ADMIN = "minhhocgioi"; // 🔒 đổi khóa admin nếu muốn

// Hàm chính của API
export const handler = async (event) => {
  const duongDan = event.path || "/";
  const query = event.queryStringParameters || {};
  const md5 = (query.hash || "").trim().toLowerCase();

  // 1️⃣ /home → Thông tin và hướng dẫn sử dụng API
  if (duongDan.endsWith("/home")) {
    return traJSON({
      ten_api: "🎰 API Dự đoán Tài Xỉu (Phân tích MD5)",
      mo_ta: "Phân tích chuỗi MD5 thật - KHÔNG RANDOM - Dự đoán kết quả Tài hoặc Xỉu.",
      huong_dan: {
        "/home": "Hiển thị hướng dẫn sử dụng (trang này).",
        "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5 để dự đoán Tài/Xỉu.",
        "/history": "Xem 10 lần phân tích gần nhất.",
        "/admin?key=<khoá_quản_trị>": "Xem toàn bộ lịch sử (chỉ quản trị viên)."
      },
      vi_du: {
        ma_md5_mau: "244ac48695d4a2ced8e29ed56dc28b25",
        yeu_cau: "/md5?hash=244ac48695d4a2ced8e29ed56dc28b25"
      },
      tac_gia: "Duc Minh IOS",
      cap_nhat_luc: new Date().toLocaleString("vi-VN")
    });
  }

  // 2️⃣ /md5?hash=<chuỗi>
  if (duongDan.endsWith("/md5")) {
    if (!/^[0-9a-f]{32}$/.test(md5)) {
      return traJSON({ loi: "Mã MD5 không hợp lệ! Phải gồm 32 ký tự hex (0-9, a-f)." }, 400);
    }

    // Phân tích MD5 (thuật toán thật)
    const phan = [];
    for (let i = 0; i < 32; i += 8) phan.push(md5.slice(i, i + 8));
    const so = phan.map(p => parseInt(p, 16));

    const tong = so.reduce((a, b) => a + b, 0);
    let tich = 1;
    for (let i = 0; i < 4; i++) tich *= (so[i] % 1000) + 1;

    const nhiPhan = BigInt("0x" + md5.slice(0, 16)).toString(2).padStart(64, "0");
    const soBit1 = [...nhiPhan].filter(c => c === "1").length;
    const soBit0 = 64 - soBit1;

    let diemTai = 0, diemXiu = 0;
    if (tong % 2 === 0) diemTai += 35; else diemXiu += 35;
    if (soBit1 > soBit0) diemTai += 25; else diemXiu += 25;
    if (tich % 2 === 0) diemTai += 20; else diemXiu += 20;
    if (so[0] % 2 === 0) diemTai += 10; else diemXiu += 10;
    const chuCuoi = parseInt(md5[31], 16);
    if (chuCuoi >= 8) diemTai += 10; else diemXiu += 10;

    const duDoan = diemTai > diemXiu ? "Tài" : "Xỉu";
    const doTinCay = Math.round((Math.max(diemTai, diemXiu) / (diemTai + diemXiu)) * 10000) / 100;
    const diemDuDoan = (Array.from(md5.slice(0, 3)).reduce((a, c) => a + parseInt(c, 16), 0) % 16) + 3;

    const ketQua = {
      ma_md5: md5,
      du_doan: duDoan,
      do_tin_cay: doTinCay + "%",
      diem_du_doan: diemDuDoan,
      diem_tai: diemTai,
      diem_xiu: diemXiu,
      chi_tiet: {
        tong_gia_tri: tong,
        ty_le_bit: `${soBit1}:${soBit0}`,
        mau_hash: `${md5.slice(0, 8)}...${md5.slice(-8)}`
      },
      thoi_gian: new Date().toLocaleString("vi-VN")
    };

    // Lưu lịch sử (tối đa 100 bản ghi)
    lichSu.push(ketQua);
    if (lichSu.length > 100) lichSu = lichSu.slice(-100);

    return traJSON(ketQua);
  }

  // 3️⃣ /history → Trả 10 kết quả gần nhất
  if (duongDan.endsWith("/history")) {
    if (lichSu.length === 0) return traJSON({ thong_bao: "Chưa có dữ liệu phân tích nào." });
    return traJSON({
      tong_so_lan: lichSu.length,
      gan_nhat_10_lan: lichSu.slice(-10).reverse(),
      cap_nhat_luc: new Date().toLocaleString("vi-VN")
    });
  }

  // 4️⃣ /admin?key=<khoá_quản_trị>
  if (duongDan.endsWith("/admin")) {
    if (query.key !== KHOA_ADMIN) {
      return traJSON({ loi: "Bạn không có quyền truy cập hoặc sai khóa quản trị." }, 403);
    }
    return traJSON({
      tong_ban_ghi: lichSu.length,
      du_lieu: lichSu,
      ghi_chu: "Chỉ quản trị viên mới được xem toàn bộ dữ liệu.",
      thoi_gian: new Date().toLocaleString("vi-VN")
    });
  }

  // 5️⃣ Mặc định → Gợi ý
  return traJSON({
    thong_bao: "🎰 API Dự đoán Tài Xỉu (MD5)",
    cac_duong_dan: ["/home", "/md5?hash=<mã_md5>", "/history", "/admin?key=<mã_quản_trị>"],
    huong_dan: "Truy cập /home để xem hướng dẫn chi tiết."
  });
};

// 🧩 Hàm trả JSON chuẩn
function traJSON(duLieu, maTrangThai = 200) {
  return {
    statusCode: maTrangThai,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(duLieu, null, 2)
  };
}
