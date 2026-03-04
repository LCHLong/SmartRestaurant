const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    }
  });

  io.use((socket, next) => {
    // Lấy token từ client gửi lên (thường nằm trong auth object)
    const token = socket.handshake.auth.token;

    // ✅ OPTIONAL AUTHENTICATION: Cho phép kết nối cả khi không có token
    if (!token) {
      console.log('⚠️ Guest user connected (no token)');
      socket.user = null; // Guest user
      return next();
    }

    try {
      // Verify token nếu có
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Lưu thông tin user vào socket để dùng sau này nếu cần
      socket.user = decoded;
      console.log(`✅ Authenticated user connected: ${decoded.email || decoded.id}`);
      next();
    } catch (err) {
      console.log('⚠️ Invalid token, connecting as guest');
      socket.user = null; // Token không hợp lệ, coi như guest
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ✅ SECURE Join Room với kiểm tra quyền
    socket.on('join_room', (room) => {
      const user = socket.user;

      // 🔒 Kiểm tra quyền truy cập room
      if (room === 'kitchen') {
        // 🟢 FIX: Thêm quyền cho 'super_admin' được join
        if (!user || (user.role !== 'kitchen' && user.role !== 'admin' && user.role !== 'super_admin')) {
          console.log(`❌ UNAUTHORIZED: User ${socket.id} (${user?.role}) tried to join kitchen room`);
          socket.emit('error', { message: 'Unauthorized access to kitchen room' });
          return;
        }
      } else if (room === 'waiter') {
        // 🟢 FIX: Thêm quyền cho 'super_admin'
        if (!user || (user.role !== 'waiter' && user.role !== 'admin' && user.role !== 'super_admin')) {
          console.log(`❌ UNAUTHORIZED: User ${socket.id} tried to join waiter room`);
          socket.emit('error', { message: 'Unauthorized access to waiter room' });
          return;
        }
      } else if (room.startsWith('table_')) {
        // Table rooms là public (cho khách hàng tracking orders)
        // Nhưng vẫn log để audit
        console.log(`📱 Guest/Customer joined table room: ${room}`);
      } else {
        // Room không hợp lệ
        console.log(`❌ INVALID ROOM: User ${socket.id} tried to join unknown room: ${room}`);
        socket.emit('error', { message: 'Invalid room' });
        return;
      }

      // ✅ Cho phép join room
      socket.join(room);
      console.log(`✅ User ${socket.id} (${user?.role || 'guest'}) joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };