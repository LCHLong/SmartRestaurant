/**
 * seed_reservations_and_shifts.js
 * Seeding script for Reservations and Shift Scheduling
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (d, days) => {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
};

async function seed() {
  console.log('🚀 Bắt đầu seeding dữ liệu mẫu cho Đặt bàn và Phân ca làm việc...');

  // 1. Tạo thêm tài khoản phụ nếu chưa có (waiter02, chef02) để phục vụ test đổi ca & phân ca
  const defaultPasswordHash = '$2b$10$V9i3lXskjAmxLYJZVvz6hupXqHq3L2fFiH9qDjrqpB32dkuLJIYkW'; // '123456' / 'admin123'
  
  const additionalStaff = [
    {
      email: 'waiter02@restaurant.com',
      full_name: 'Trần Văn Nam',
      role: 'waiter',
      password_hash: defaultPasswordHash,
      is_verified: true,
      phone: '0905123456'
    },
    {
      email: 'chef02@restaurant.com',
      full_name: 'Lê Thị Bếp',
      role: 'kitchen',
      password_hash: defaultPasswordHash,
      is_verified: true,
      phone: '0905654321'
    }
  ];

  for (const staff of additionalStaff) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', staff.email).single();
    if (!existing) {
      await supabase.from('users').insert([staff]);
      console.log(`  ➕ Đã thêm tài khoản nhân viên: ${staff.email} (${staff.full_name})`);
    }
  }

  // Lấy toàn bộ users cần thiết
  const { data: users } = await supabase.from('users').select('id, email, full_name, role');
  const waiter1 = users.find(u => u.email === 'waiter01@restaurant.com') || users.find(u => u.role === 'waiter');
  const waiter2 = users.find(u => u.email === 'waiter02@restaurant.com');
  const chef1 = users.find(u => u.email === 'chef@restaurant.com') || users.find(u => u.role === 'kitchen');
  const chef2 = users.find(u => u.email === 'chef02@restaurant.com');
  const admin = users.find(u => u.role === 'admin') || users.find(u => u.role === 'super_admin');
  const customer = users.find(u => u.role === 'customer');

  // Lấy danh sách bàn
  const { data: tables } = await supabase.from('tables').select('id, table_number, capacity');
  const tableMap = {};
  (tables || []).forEach(t => { tableMap[t.table_number] = t; });

  // 2. Tạo các ca làm việc (shifts)
  console.log('🕒 1. Tạo các ca làm việc tiêu chuẩn (shifts)...');
  const shiftDefinitions = [
    {
      name: 'Ca Sáng',
      start_time: '07:00:00',
      end_time: '15:00:00',
      min_staff: { waiter: 2, kitchen: 2, admin: 1 },
      is_active: true
    },
    {
      name: 'Ca Chiều',
      start_time: '14:30:00',
      end_time: '22:30:00',
      min_staff: { waiter: 2, kitchen: 2, admin: 1 },
      is_active: true
    },
    {
      name: 'Ca Gãy',
      start_time: '10:30:00',
      end_time: '14:30:00',
      min_staff: { waiter: 1, kitchen: 1, admin: 0 },
      is_active: true
    }
  ];

  const createdShifts = {};
  for (const s of shiftDefinitions) {
    const { data: existing } = await supabase.from('shifts').select('*').eq('name', s.name).single();
    if (existing) {
      createdShifts[s.name] = existing;
    } else {
      const { data: newShift, error } = await supabase.from('shifts').insert([s]).select().single();
      if (error) console.error('Lỗi tạo shift:', error);
      else createdShifts[s.name] = newShift;
    }
  }
  console.log(`  ✅ Đã tạo/đồng bộ ${Object.keys(createdShifts).length} ca làm việc.`);

  // 3. Phân công ca làm việc (shift_assignments) trong tuần hiện tại
  console.log('📅 2. Phân công lịch trực tuần (shift_assignments)...');
  const today = new Date();
  const currentDay = today.getDay(); // 0: CN, 1: T2...
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = addDays(today, diffToMonday);

  const weekDays = [0, 1, 2, 3, 4, 5, 6].map(i => formatDate(addDays(monday, i)));
  const todayStr = formatDate(today);

  // Xóa assignments cũ của tuần hiện tại để tránh duplicate
  await supabase.from('shift_assignments').delete().in('shift_date', weekDays);

  const assignmentsToInsert = [];

  weekDays.forEach((dateStr, dayIdx) => {
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    // Ca Sáng
    if (createdShifts['Ca Sáng']) {
      if (waiter1) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Sáng'].id,
          user_id: waiter1.id,
          shift_date: dateStr,
          status: isPast ? 'checked_out' : (isToday ? 'checked_in' : 'scheduled'),
          check_in_time: (isPast || isToday) ? `${dateStr}T06:55:00+07:00` : null,
          check_out_time: isPast ? `${dateStr}T15:02:00+07:00` : null,
          notes: 'Phụ trách khu vực tầng 1'
        });
      }
      if (chef1) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Sáng'].id,
          user_id: chef1.id,
          shift_date: dateStr,
          status: isPast ? 'checked_out' : (isToday ? 'checked_in' : 'scheduled'),
          check_in_time: (isPast || isToday) ? `${dateStr}T06:50:00+07:00` : null,
          check_out_time: isPast ? `${dateStr}T15:00:00+07:00` : null,
          notes: 'Bếp chính'
        });
      }
      if (admin && dayIdx % 2 === 0) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Sáng'].id,
          user_id: admin.id,
          shift_date: dateStr,
          status: isPast ? 'checked_out' : (isToday ? 'checked_in' : 'scheduled'),
          check_in_time: (isPast || isToday) ? `${dateStr}T07:00:00+07:00` : null,
          check_out_time: isPast ? `${dateStr}T15:00:00+07:00` : null,
          notes: 'Quản lý vận hành buổi sáng'
        });
      }
    }

    // Ca Chiều
    if (createdShifts['Ca Chiều']) {
      if (waiter2) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Chiều'].id,
          user_id: waiter2.id,
          shift_date: dateStr,
          status: isPast ? 'checked_out' : 'scheduled',
          check_in_time: isPast ? `${dateStr}T14:25:00+07:00` : null,
          check_out_time: isPast ? `${dateStr}T22:35:00+07:00` : null,
          notes: 'Phụ trách bàn VIP khu B & C'
        });
      }
      if (chef2) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Chiều'].id,
          user_id: chef2.id,
          shift_date: dateStr,
          status: isPast ? 'checked_out' : 'scheduled',
          check_in_time: isPast ? `${dateStr}T14:20:00+07:00` : null,
          check_out_time: isPast ? `${dateStr}T22:30:00+07:00` : null,
          notes: 'Phụ trách chảo và nướng'
        });
      }
      // Đan xen waiter1 vào ca chiều cuối tuần
      if (waiter1 && (dayIdx === 5 || dayIdx === 6)) {
        assignmentsToInsert.push({
          shift_id: createdShifts['Ca Chiều'].id,
          user_id: waiter1.id,
          shift_date: dateStr,
          status: 'scheduled',
          notes: 'Tăng cường cuối tuần'
        });
      }
    }
  });

  const { data: insertedAssignments, error: assignError } = await supabase
    .from('shift_assignments')
    .insert(assignmentsToInsert)
    .select();

  if (assignError) {
    console.error('❌ Lỗi thêm phân công ca:', assignError);
  } else {
    console.log(`  ✅ Đã phân công thành công ${insertedAssignments.length} lượt trực cho tuần!`);
  }

  // 4. Tạo yêu cầu đổi ca mẫu (shift_swap_requests)
  console.log('🔄 3. Tạo yêu cầu đổi ca mẫu (shift_swap_requests)...');
  await supabase.from('shift_swap_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  if (waiter1 && waiter2 && insertedAssignments && insertedAssignments.length > 0) {
    // Tìm assignment trong tương lai của waiter2
    const targetAssignment = insertedAssignments.find(a => a.user_id === waiter2.id && a.shift_date > todayStr);
    if (targetAssignment) {
      await supabase.from('shift_swap_requests').insert([
        {
          assignment_id: targetAssignment.id,
          requester_id: waiter2.id,
          target_user_id: waiter1.id,
          status: 'pending',
          reason: 'Em có việc bận gia đình đột xuất, nhờ anh trực đổi giúp em ca này ạ!'
        }
      ]);
      console.log('  ✅ Đã tạo 1 yêu cầu đổi ca "pending" từ Trần Văn Nam -> Phục Vụ 01');
    }

    // Tạo 1 request đã duyệt trong quá khứ để hiển thị lịch sử
    const pastAssignment = insertedAssignments.find(a => a.user_id === waiter1.id && a.shift_date <= todayStr);
    if (pastAssignment) {
      await supabase.from('shift_swap_requests').insert([
        {
          assignment_id: pastAssignment.id,
          requester_id: waiter1.id,
          target_user_id: waiter2.id,
          status: 'approved_by_admin',
          reason: 'Đổi ca thi kết thúc học phần buổi sáng'
        }
      ]);
      console.log('  ✅ Đã tạo 1 yêu cầu đổi ca lịch sử "approved_by_admin"');
    }
  }

  // 5. Tạo dữ liệu mẫu Đặt bàn (reservations)
  console.log('📋 4. Tạo dữ liệu mẫu Đặt bàn (reservations)...');
  
  // Xóa các đặt bàn cũ có booking_code bắt đầu bằng SR-TEST hoặc các mã mẫu
  await supabase.from('reservations').delete().like('booking_code', 'SR-%');

  const reservationsToInsert = [
    // --- HÔM NAY ---
    {
      booking_code: 'SR-BN82K194',
      user_id: customer ? customer.id : null,
      customer_name: 'Trần Văn Bình',
      customer_phone: '0901234567',
      customer_email: 'binhtran@gmail.com',
      table_id: tableMap['A1']?.id || null,
      guest_count: 4,
      reservation_date: todayStr,
      reservation_time: '11:30:00',
      end_time: '13:00:00',
      status: 'completed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: 'Bàn cạnh cửa sổ, không gian yên tĩnh',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-NH74M201',
      customer_name: 'Nguyễn Thị Hương',
      customer_phone: '0912345678',
      customer_email: 'huongnguyen@yahoo.com',
      table_id: tableMap['B2']?.id || null,
      guest_count: 2,
      reservation_date: todayStr,
      reservation_time: '12:00:00',
      end_time: '13:30:00',
      status: 'completed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: null,
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-HD91X452',
      customer_name: 'Hoàng Minh Đức',
      customer_phone: '0933456789',
      customer_email: 'duc.hoang@company.vn',
      table_id: tableMap['A2']?.id || null,
      guest_count: 2,
      reservation_date: todayStr,
      reservation_time: '17:30:00',
      end_time: '19:00:00',
      status: 'confirmed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: 'Hẹn hò lãng mạn, chuẩn bị hoa hồng để bàn',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-LK28W913',
      customer_name: 'Lê Tuấn Kiệt',
      customer_phone: '0988765432',
      customer_email: 'kietle99@gmail.com',
      table_id: tableMap['C1']?.id || null,
      guest_count: 6,
      reservation_date: todayStr,
      reservation_time: '18:30:00',
      end_time: '20:00:00',
      status: 'confirmed',
      deposit_amount: 200000,
      deposit_status: 'paid',
      special_requests: 'Tiệc sinh nhật, nhờ nhà hàng bảo quản bánh kem trong tủ lạnh',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-PA63R821',
      customer_name: 'Phạm Ngọc Ánh',
      customer_phone: '0977123456',
      customer_email: 'anhpham.decor@gmail.com',
      table_id: tableMap['C4']?.id || null,
      guest_count: 10,
      reservation_date: todayStr,
      reservation_time: '19:00:00',
      end_time: '20:30:00',
      status: 'confirmed',
      deposit_amount: 300000,
      deposit_status: 'paid',
      special_requests: 'Họp mặt nhóm công ty, xếp thêm 2 ghế trẻ em',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-VH55T109',
      customer_name: 'Vũ Đình Hải',
      customer_phone: '0945678901',
      customer_email: 'haivd@outlook.com',
      table_id: null, // Soft allocation: chưa gán bàn cụ thể
      guest_count: 4,
      reservation_date: todayStr,
      reservation_time: '19:30:00',
      end_time: '21:00:00',
      status: 'pending',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: 'Gần khu vực máy lạnh thoáng mát',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-DK44P762',
      customer_name: 'Đỗ Khánh Linh',
      customer_phone: '0966890123',
      customer_email: 'linhdk@gmail.com',
      table_id: tableMap['B1']?.id || null,
      guest_count: 3,
      reservation_date: todayStr,
      reservation_time: '20:00:00',
      end_time: '21:30:00',
      status: 'pending',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: null,
      buffer_minutes: 90
    },

    // --- NGÀY MAI ---
    {
      booking_code: 'SR-NC19Y843',
      customer_name: 'Ngô Bảo Châu',
      customer_phone: '0923456781',
      customer_email: 'chaungo@edu.vn',
      table_id: tableMap['A3']?.id || null,
      guest_count: 3,
      reservation_date: formatDate(addDays(today, 1)),
      reservation_time: '12:00:00',
      end_time: '13:30:00',
      status: 'confirmed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: 'Khách ăn chay không tỏi ớt',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-DC82Q305',
      customer_name: 'Dương Thùy Chi',
      customer_phone: '0934567892',
      customer_email: 'chiduong@gmail.com',
      table_id: tableMap['B3']?.id || null,
      guest_count: 4,
      reservation_date: formatDate(addDays(today, 1)),
      reservation_time: '18:00:00',
      end_time: '19:30:00',
      status: 'confirmed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: 'Bàn ngoài trời nếu trời không mưa',
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-BD71L549',
      customer_name: 'Bùi Tiến Dũng',
      customer_phone: '0945678903',
      customer_email: 'dung.bui@fpt.com',
      table_id: tableMap['C2']?.id || null,
      guest_count: 6,
      reservation_date: formatDate(addDays(today, 1)),
      reservation_time: '19:30:00',
      end_time: '21:00:00',
      status: 'pending',
      deposit_amount: 200000,
      deposit_status: 'pending',
      special_requests: 'Chuẩn bị trước nước ép cam cho 6 người',
      buffer_minutes: 90
    },

    // --- NGÀY KIA ---
    {
      booking_code: 'SR-DL99K318',
      customer_name: 'Đặng Văn Lâm',
      customer_phone: '0956789014',
      customer_email: 'lamdang@vietnam.vn',
      table_id: tableMap['C5']?.id || null,
      guest_count: 8,
      reservation_date: formatDate(addDays(today, 2)),
      reservation_time: '18:30:00',
      end_time: '20:00:00',
      status: 'confirmed',
      deposit_amount: 250000,
      deposit_status: 'paid',
      special_requests: 'Tiệc họp gia đình cuối tuần',
      buffer_minutes: 90
    },

    // --- HÔM QUA (LỊCH SỬ) ---
    {
      booking_code: 'SR-LK12Z901',
      customer_name: 'Lý Nhã Kỳ',
      customer_phone: '0967890125',
      customer_email: 'kyly@luxury.com',
      table_id: tableMap['A4']?.id || null,
      guest_count: 2,
      reservation_date: formatDate(addDays(today, -1)),
      reservation_time: '18:00:00',
      end_time: '19:30:00',
      status: 'completed',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: null,
      buffer_minutes: 90
    },
    {
      booking_code: 'SR-TQ38X112',
      customer_name: 'Trương Minh Quý',
      customer_phone: '0978901236',
      customer_email: 'quytm@gmail.com',
      table_id: tableMap['B4']?.id || null,
      guest_count: 4,
      reservation_date: formatDate(addDays(today, -1)),
      reservation_time: '19:30:00',
      end_time: '21:00:00',
      status: 'no_show',
      deposit_amount: 0,
      deposit_status: 'none',
      special_requests: null,
      cancellation_reason: 'Khách không đến nhận bàn sau 30 phút',
      buffer_minutes: 90
    }
  ];

  const { data: insertedReservations, error: resvError } = await supabase
    .from('reservations')
    .insert(reservationsToInsert)
    .select();

  if (resvError) {
    console.error('❌ Lỗi thêm đặt bàn:', resvError);
  } else {
    console.log(`  ✅ Đã thêm ${insertedReservations.length} lượt đặt bàn mẫu thành công!`);
  }

  console.log('🎉 HOÀN TẤT SEEDING DỮ LIỆU ĐẶT BÀN & CA LÀM VIỆC!');
}

seed().catch(err => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
