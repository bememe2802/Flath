import 'package:flutter/material.dart';

class CalendarSelector extends StatefulWidget {
  // Callback để "trả" ngày về cho Tấm trượt Add Task
  final void Function(DateTime selectedDate) onDateSelected;

  const CalendarSelector({
    Key? key,
    required this.onDateSelected,
  }) : super(key: key);

  @override
  _CalendarSelectorState createState() => _CalendarSelectorState();
}

class _CalendarSelectorState extends State<CalendarSelector> {
  @override
  Widget build(BuildContext context) {
    // Chúng ta sẽ dùng một Container "giả" để thay thế cho Lịch thật
    // để kiểm tra xem AnimatedSwitcher có hoạt động không.
    return Container(
      key: const ValueKey("calendar_mock"), // Key rất quan trọng cho AnimatedSwitcher
      height: 350, // Chiều cao giả định cho Lịch
      decoration: BoxDecoration(
        color: const Color(0xFFF7F0E7), // Một màu "ấm" (warm)
        borderRadius: BorderRadius.circular(12.0),
      ),
      margin: const EdgeInsets.only(top: 16.0), // Tạo khoảng cách với các nút Tag
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Đây là CalendarSelector (Widget Lịch)",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
                color: Color(0xFF573A2E), // Màu text "ấm"
              ),
            ),
            const SizedBox(height: 20),
            // Nút "giả" để test callback
            TextButton(
              style: TextButton.styleFrom(
                backgroundColor: const Color(0xFFE57373), // Màu accent "ấm"
              ),
              onPressed: () {
                // Khi nhấn, nó sẽ gửi lại ngày mai
                final tomorrow = DateTime.now().add(const Duration(days: 1));
                widget.onDateSelected(tomorrow);
              },
              child: const Text(
                "Test: Chọn ngày mai",
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }
}