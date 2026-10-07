const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
});

// Hàm gửi mail chung
const sendEmail = async (to, subject, htmlContent, attachments = []) => {
    try {
        const mailOptions = {
            from: `"Smart Restaurant" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        };
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments;
        }
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
};

// Template 1: Gửi email Reset Password
const sendResetPasswordEmail = async (email, token) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #d32f2f;">Yêu cầu đặt lại mật khẩu</h2>
            <p>Xin chào,</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại Smart Restaurant.</p>
            <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (Link có hiệu lực trong 15 phút):</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #d32f2f; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
        </div>
    `;

    return await sendEmail(email, "Đặt lại mật khẩu - Smart Restaurant", html);
};

// Template 2: Gửi email Chào mừng/Verify (Dùng cho Register)
const sendWelcomeEmail = async (email, name) => {
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2e7d32;">Chào mừng ${name} đến với Smart Restaurant!</h2>
            <p>Tài khoản của bạn đã được tạo thành công.</p>
            <p>Hãy quét mã QR tại bàn để bắt đầu gọi món nhé!</p>
        </div>
    `;
    return await sendEmail(email, "Chào mừng thành viên mới!", html);
};

// Template 3: Gửi email Xác thực tài khoản (Verify Email)
const sendVerificationEmail = async (email, token) => {
    // Link này sẽ dẫn về Frontend, Frontend sẽ gọi API verify
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h2 style="color: #1976d2;">Xác thực tài khoản</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại Smart Restaurant.</p>
            <p>Vui lòng nhấn vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
            <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác thực ngay</a>
            <p style="margin-top: 15px; font-size: 12px; color: #666;">Link này có hiệu lực trong 24 giờ.</p>
        </div>
    `;
    return await sendEmail(email, "Kích hoạt tài khoản Smart Restaurant", html);
};

const sendStaffInvitation = async (email, full_name, password, token) => {
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2e7d32;">Lời mời tham gia hệ thống</h2>
            <p>Xin chào <strong>${full_name}</strong>,</p>
            <p>Bạn đã được cấp tài khoản để truy cập vào hệ thống Smart Restaurant.</p>
            <p><strong>Thông tin đăng nhập tạm thời:</strong></p>
            <ul>
                <li>Email: <strong>${email}</strong></li>
                <li>Mật khẩu: <strong>${password}</strong></li>
            </ul>
            <p>Vui lòng nhấn vào nút bên dưới để <strong>Kích hoạt tài khoản</strong> trước khi đăng nhập:</p>
            <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #2e7d32; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác thực tài khoản ngay</a>
            <p style="margin-top: 20px; color: #666; font-size: 12px;">Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu tiên.</p>
        </div>
    `;
    return await sendEmail(email, "Lời mời tham gia Smart Restaurant - Xác thực tài khoản", html);
};

// Template 5: Gửi email xác nhận đặt bàn kèm QR code định danh (Phase 5)
const sendReservationConfirmation = async ({
    email,
    customer_name,
    booking_code,
    reservation_date,
    reservation_time,
    guest_count,
    special_requests,
    qrImage,
    cancelToken,
    requiresDeposit,
    deposit_amount,
}) => {
    const cancelLink = `${process.env.FRONTEND_URL}/reservations/cancel?token=${cancelToken}`;

    const depositSection = requiresDeposit
        ? `<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:12px 16px;margin-top:12px;">
            <p style="margin:0;font-weight:bold;color:#856404;">⚠️ Yêu cầu đặt cọc (Nhóm ≥ 6 người)</p>
            <p style="margin:6px 0 0;color:#533f03;">Số tiền cọc: <strong>${deposit_amount?.toLocaleString('vi-VN')}đ</strong></p>
            <p style="margin:4px 0 0;font-size:12px;color:#533f03;">Vui lòng thanh toán cọc trong 24h để giữ chỗ.</p>
          </div>`
        : '';

    const specialSection = special_requests
        ? `<p style="margin:4px 0;"><strong>Ghi chú:</strong> ${special_requests}</p>`
        : '';

    const attachments = [];
    let qrImgSrc = qrImage;

    if (qrImage && qrImage.startsWith('data:image/')) {
        const base64Data = qrImage.split('base64,')[1];
        if (base64Data) {
            attachments.push({
                filename: `qr-${booking_code}.png`,
                content: Buffer.from(base64Data, 'base64'),
                cid: 'reservation_qr'
            });
            qrImgSrc = 'cid:reservation_qr';
        }
    }

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
            <div style="background:#2e7d32;padding:24px 20px;text-align:center;">
                <h1 style="color:white;margin:0;font-size:22px;">🍽️ Smart Restaurant</h1>
                <p style="color:#c8e6c9;margin:6px 0 0;font-size:14px;">Xác nhận đặt bàn thành công</p>
            </div>
            <div style="padding:24px 28px;">
                <p style="font-size:16px;">Xin chào <strong>${customer_name}</strong>,</p>
                <p>Chúng tôi đã nhận được yêu cầu đặt bàn của bạn:</p>
                <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin:16px 0;">
                    <p style="margin:4px 0;"><strong>📋 Mã đặt bàn:</strong>
                        <span style="font-size:20px;font-weight:bold;color:#2e7d32;letter-spacing:2px;"> ${booking_code}</span>
                    </p>
                    <p style="margin:4px 0;"><strong>📅 Ngày:</strong> ${reservation_date}</p>
                    <p style="margin:4px 0;"><strong>🕐 Giờ:</strong> ${reservation_time}</p>
                    <p style="margin:4px 0;"><strong>👥 Số khách:</strong> ${guest_count} người</p>
                    ${specialSection}
                </div>
                ${depositSection}
                <div style="text-align:center;margin:24px 0;">
                    <p style="color:#555;font-size:13px;margin-bottom:8px;">Xuất trình mã QR này khi đến nhà hàng để check-in:</p>
                    <img src="${qrImgSrc}" alt="QR ${booking_code}" width="160" height="160"
                         style="border:3px solid #2e7d32;border-radius:8px;padding:6px;background:white;" />
                    <p style="color:#888;font-size:11px;margin-top:6px;">Mã: <strong>${booking_code}</strong></p>
                </div>
                <div style="border-top:1px solid #eee;padding-top:16px;margin-top:16px;">
                    <p style="font-size:13px;color:#555;">Nếu bạn muốn hủy đặt bàn:</p>
                    <a href="${cancelLink}"
                       style="display:inline-block;padding:10px 22px;background:#f44336;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:13px;">
                       ❌ Hủy đặt bàn
                    </a>
                    <p style="color:#999;font-size:11px;margin-top:8px;">Link hủy có hiệu lực trong 24 giờ.</p>
                </div>
            </div>
            <div style="background:#f9f9f9;padding:14px 28px;font-size:12px;color:#999;text-align:center;">
                Smart Restaurant • Mọi thắc mắc vui lòng liên hệ trực tiếp với nhà hàng.
            </div>
        </div>
    `;

    return await sendEmail(email, `✅ Xác nhận đặt bàn [${booking_code}] - Smart Restaurant`, html, attachments);
};

module.exports = {
    sendResetPasswordEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendStaffInvitation,
    sendReservationConfirmation,
};