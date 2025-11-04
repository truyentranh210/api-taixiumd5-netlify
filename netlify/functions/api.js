// 🎰 API DỰ ĐOÁN TÀI XỈU - JSON-ONLY
// Hoạt động ổn định 100% trên Netlify (không cần build)

let lichSu = [];
const KHOA_ADMIN = "matkhau123"; // 🔒 Đổi nếu muốn

export const handler = async (event) => {
  const path = event.path || "/";
  const query = event.queryStringParameters || {};
  const md5 = (query.hash || "").trim().toLowerCase();

  // /home
  if (path.endsWith("/home")) {
    return traJSON({
      ten_api: "🎰 API Dự đoán Tài Xỉu (MD5)",
      mo_ta: "Phân tích MD5 thật - không random - dự đoán Tài hoặc Xỉu.",
      huong_dan: {
        "/home": "Xem hướng dẫn API",
        "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5",
        "/history": "Xem lịch sử gần nhất",
        "/admin?key=<mã_quản_trị>": "Xem toàn bộ dữ liệu (admin)"
      },
      tac_gia: "GPT-5 Assistant",
      cap_nhat: new Date().toLocaleString("vi-VN")
    });
  }

  // /md5
  if (path.endsWith("/md5")) {
    if (!/^[0-9a-f]{32}$/.test(md5))
      return traJSON({ loi: "Mã MD5 không hợp lệ! Phải gồm 32 ký tự hex." }, 400);

    const p = [];
    for (let i = 0; i < 32; i += 8) p.push(md5.slice(i, i + 8));
    const so = p.map(x => parseInt(x, 16));

    const tong = so.reduce((a, b) => a + b, 0);
    let tich = 1;
    for (let i = 0; i < 4; i++) tich *= (so[i] % 1000) + 1;

    const bin = BigInt("0x" + md5.slice(0, 16)).toString(2).padStart(64, "0");
    const bit1 = [...bin].filter(c => c === "1").length;
    const bit0 = 64 - bit1;

    let tai = 0, xiu = 0;
    if (tong % 2 === 0) tai += 35; else xiu += 35;
    if (bit1 > bit0) tai += 25; else xiu += 25;
    if (tich % 2 === 0) tai += 20; else xiu += 20;
    if (so[0] % 2 === 0) tai += 10; else xiu += 10;
    const cuoi = parseInt(md5[31], 16);
    if (cuoi >= 8) tai += 10; else xiu += 10;

    const ketQua = {
      ma_md5: md5,
      du_doan: tai > xiu ? "Tài" : "Xỉu",
      do_tin_cay: ((Math.max(tai, xiu) / (tai + xiu)) * 100).toFixed(2) + "%",
      diem_du_doan: (Array.from(md5.slice(0, 3)).reduce((a, c) => a + parseInt(c, 16), 0) % 16) + 3,
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

  // /history
  if (path.endsWith("/history"))
    return traJSON(
      lichSu.length
        ? { tong: lichSu.length, gan_nhat: lichSu.slice(-10).reverse() }
        : { thong_bao: "Chưa có dữ liệu nào." }
    );

  // /admin
  if (path.endsWith("/admin")) {
    if (query.key !== KHOA_ADMIN)
      return traJSON({ loi: "Sai khoá hoặc không có quyền truy cập." }, 403);
    return traJSON({ tong_ban_ghi: lichSu.length, du_lieu: lichSu });
  }

  // mặc định
  return traJSON({
    thong_bao: "🎰 API Dự đoán Tài Xỉu (MD5)",
    huong_dan: "/home để xem chi tiết"
  });
};

// helper JSON
function traJSON(data, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(data, null, 2)
  };
}
