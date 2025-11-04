import express from "express";
import serverless from "serverless-http";

const app = express();
app.use(express.json());

let lichSu = [];
const KHOA_ADMIN = "matkhau123";

// 🏠 Trang hướng dẫn
app.get(["/", "/home"], (req, res) => {
  res.json({
    ten_api: "🎰 API Dự đoán Tài Xỉu (MD5)",
    mo_ta: "Phân tích chuỗi MD5 thật - không random, kết quả JSON.",
    huong_dan: {
      "/home": "Hiển thị hướng dẫn API",
      "/md5?hash=<mã_md5>": "Phân tích chuỗi MD5",
      "/history": "Xem 10 kết quả gần nhất",
      "/admin?key=<khoá>": "Xem toàn bộ dữ liệu (admin)"
    },
    vi_du: {
      ma_md5: "244ac48695d4a2ced8e29ed56dc28b25",
      link_test: "/md5?hash=244ac48695d4a2ced8e29ed56dc28b25"
    },
    cap_nhat: new Date().toLocaleString("vi-VN")
  });
});

// 🔍 Phân tích MD5
app.get("/md5", (req, res) => {
  const md5 = (req.query.hash || "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(md5))
    return res.status(400).json({ loi: "Mã MD5 không hợp lệ (32 ký tự hex)" });

  // Tách chuỗi MD5 thành 4 phần số
  const parts = [];
  for (let i = 0; i < 32; i += 8) parts.push(md5.slice(i, i + 8));
  const nums = parts.map(p => parseInt(p, 16));

  const tong = nums.reduce((a, b) => a + b, 0);
  let tich = 1;
  for (let i = 0; i < 4; i++) tich *= (nums[i] % 1000) + 1;

  // Phân tích bit
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
    chi_tiet: {
      tong_hash: tong,
      ty_le_bit: `${bit1}:${bit0}`,
      mau_hash: `${md5.slice(0, 8)}...${md5.slice(-8)}`
    },
    thoi_gian: new Date().toLocaleString("vi-VN")
  };

  lichSu.push(ketQua);
  if (lichSu.length > 100) lichSu = lichSu.slice(-100);

  res.json(ketQua);
});

// 📜 Lịch sử
app.get("/history", (req, res) => {
  res.json({
    tong_so_lan: lichSu.length,
    gan_nhat_10_lan: lichSu.slice(-10).reverse()
  });
});

// 🔐 Admin
app.get("/admin", (req, res) => {
  if (req.query.key !== KHOA_ADMIN)
    return res.status(403).json({ loi: "Sai khoá hoặc không có quyền." });
  res.json({ tong_ban_ghi: lichSu.length, du_lieu: lichSu });
});

// ✅ Export ra serverless function
export const handler = serverless(app);
