import 'package:flutter/material.dart';
import 'package:flath/theme/colors.dart';
import '/models/task.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  final TextEditingController addNewTaskController = new TextEditingController();
  final FocusNode addNewTaskFocusNode = new FocusNode();

  final List<Task> todayTasks = [
    Task(title: 'Study KNN Algorithm', isDone: true, id: '1'),
    Task(id: '2', title: 'Plan weekly meals'),
    Task(id: '3', title: 'Data cleaning for project'),
  ];

  void addTask(String name){
    final newTask = Task(id: DateTime.now().toIso8601String(), title: name);
    setState(() {
      todayTasks.add(newTask);
    });
  }

  @override
  void dispose() {
    addNewTaskController.dispose();
    addNewTaskFocusNode.dispose(); // <-- NHỚ HỦY NÓ
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.all(15.0),
            child: Row(
              children: [
                Row(
                  children: [
                    Text(
                      "Saturday, Nov 8",
                      style: TextStyle(
                        fontSize: 23,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8.0),
                    Icon(
                      Icons.calendar_month_rounded,
                      size: 23,
                      color: FlathColors.iconGray,
                    ),
                  ],
                ),
                const SizedBox(width: 90.0),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10.0,
                    vertical: 8.0,
                  ),
                  decoration: BoxDecoration(
                    color: FlathColors.card,
                    borderRadius: BorderRadius.circular(17.0),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Icon(
                        Icons.local_fire_department_outlined,
                        color: FlathColors.accent,
                        fontWeight: FontWeight.w900,
                        size: 16,
                      ),
                      const SizedBox(width: 5.0),
                      Text(
                        "30",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10.0),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8.0,
                    vertical: 8.0,
                  ),
                  decoration: BoxDecoration(
                    color: FlathColors.card,
                    borderRadius: BorderRadius.circular(90.0),
                  ),
                  child: Icon(
                    Icons.perm_identity_rounded,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: FlathColors.card,
              borderRadius: BorderRadius.circular(20.0),
            ),
            padding: const EdgeInsets.all(16.0),
            margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.emoji_events_outlined,
                      fontWeight: FontWeight.w500,
                      color: FlathColors.accent,
                    ),
                    const SizedBox(width: 10.0),
                    Text(
                      "Pinned Mission",
                      style: TextStyle(
                        fontSize: 17,
                        color: FlathColors.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: 0.0,
                    vertical: 15.0,
                  ),
                  child: Text(
                    "Complete Python Course",
                    style: TextStyle(
                      fontSize: 23,
                      color: FlathColors.textPrimary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Progress",
                      style: TextStyle(
                        fontSize: 15.0,
                        color: FlathColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      "70%",
                      style: TextStyle(
                        fontSize: 17.0,
                        color: FlathColors.textPrimary,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10.0),
                LinearProgressIndicator(
                  value: 0.7,
                  backgroundColor: Color(0xFFe8ded3),
                  color: FlathColors.accent,
                  minHeight: 10,
                  borderRadius: BorderRadius.circular(20),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                InkWell(
                  onTap: () {},
                  borderRadius: BorderRadius.circular(20.0),
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: 16.0,
                      vertical: 8.0,
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.filter_list, color: FlathColors.iconGray),
                        const SizedBox(width: 7.0),
                        Text(
                          "Filter: All",
                          style: TextStyle(
                            fontSize: 15.5,
                            color: FlathColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                InkWell(
                  onTap: () {},
                  borderRadius: BorderRadius.circular(20.0),
                  child: Padding(
                    padding: EdgeInsetsGeometry.symmetric(
                      horizontal: 16.0,
                      vertical: 12.0,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.swap_vert_rounded,
                          color: FlathColors.iconGray,
                        ),
                        // const SizedBox(width:.0),
                        Text(
                          "Sort: Due Date",
                          style: TextStyle(
                            fontSize: 15.5,
                            color: FlathColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16.0, vertical: 0),
            child: Text(
              "TODAY",
              style: TextStyle(
                fontSize: 25,
                color: FlathColors.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          ...todayTasks
              .map(
                (task) => Column(
                  children: [
                    CheckboxListTile(
                      value: task.isDone,
                      onChanged: (bool? newValue) {
                        setState(() {
                          final int index = todayTasks.indexOf(task);
                          final Task newTask = task.copyWith(
                            null,
                            null,
                            newValue!,
                          );
                          if (index != -1) {
                            todayTasks[index] = newTask;
                          }
                        });
                      },
                      controlAffinity: ListTileControlAffinity.leading,
                      title: Text(
                        task.title,
                        style: TextStyle(
                          fontSize: 17,
                          decoration: task.isDone
                              ? TextDecoration.lineThrough
                              : TextDecoration.none,
                          color: task.isDone
                              ? FlathColors.textSecondary
                              : FlathColors.textPrimary,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      activeColor: FlathColors.accent,
                      checkColor: FlathColors.background,
                    ),
                    Divider(
                      color: Color(0xFFe8ded3),
                      thickness: 1.5,
                      height: 1.0,
                      indent: 16.0,
                      endIndent: 16.0,
                    ),
                  ],
                ),
              )
              .toList(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: FlathColors.accent,
        onPressed: () {
          showModalBottomSheet(
            context: context,

            isScrollControlled: true,

            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.vertical(top: Radius.circular(25.0)),
            ),

            builder: (_) {
              final double keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

              return SingleChildScrollView(
                child: Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: FlathColors.background,
                    borderRadius: BorderRadius.circular(15.0),
                  ),
                  child: Padding(
                    padding: EdgeInsets.only(
                      bottom: MediaQuery.of(context).viewInsets.bottom,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF7F0E7),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  autofocus: true,
                                  focusNode: addNewTaskFocusNode,
                                  controller: addNewTaskController,
                                  onSubmitted: (_) {
                                    addTask(addNewTaskController.text.trim());
                                    addNewTaskController.clear();
                                    addNewTaskFocusNode.unfocus();
                                    Navigator.pop(context);
                                  },
                                  decoration: const InputDecoration(
                                    hintText: 'Enter task name...',
                                    border: InputBorder.none,
                                    isCollapsed: true,
                                    hintStyle: TextStyle(
                                      color: FlathColors.textSecondary,
                                      fontSize: 17,
                                    )
                                  ),
                                  style: const TextStyle(
                                    fontSize: 17,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: () {
                                  addTask(addNewTaskController.text.trim());
                                  addNewTaskController.clear();
                                  addNewTaskFocusNode.unfocus();
                                  Navigator.pop(context);
                                },
                                borderRadius: BorderRadius.circular(999),
                                child: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: const BoxDecoration(
                                    color: FlathColors.accent,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.north,
                                    size: 20,
                                    fontWeight: FontWeight.w700,
                                    color: FlathColors.background,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12.0,),
                        Row(
                          children: [
                            buildTag(
                              label: "Today",
                              icon: Icons.calendar_today,
                              onTap: () {
                                print("Today tapped");
                              },
                            ),
                            SizedBox(width: 12),
                            buildTag(
                              label: "Mission",
                              icon: Icons.emoji_events,
                              onTap: () {
                                print("Mission tapped");
                              },
                            ),
                            SizedBox(width: 12),
                            buildTag(
                              label: "Reminder",
                              icon: Icons.notifications_none,
                              onTap: () {
                                print("Reminder tapped");
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                ),
              );
            },
          );
        },
        shape: CircleBorder(),
        child: const Icon(Icons.add, color: FlathColors.background, size: 30),
      ),
      bottomNavigationBar: BottomNavigationBar(
        backgroundColor: FlathColors.card,
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.check_box_outlined),
            activeIcon: Icon(Icons.check_box),
            label: 'Task',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.emoji_events_outlined),
            // activeIcon: Icon(Icons.emoji_events),
            label: 'Goals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.pets_outlined),
            // activeIcon: Icon(Icons.check_box),
            label: 'Pet',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            // activeIcon: Icon(Icons.check_box),
            label: 'Setting',
          ),
        ],

        currentIndex: _selectedIndex,
        onTap: (int index) {
          setState(() {
            _selectedIndex = index;
          });
        },

        selectedItemColor: FlathColors.accent,
        unselectedItemColor: FlathColors.iconGray,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.bold),

        showSelectedLabels: true,
        showUnselectedLabels: true,

        type: BottomNavigationBarType.fixed,
      ),
    );
  }

  Widget buildTag({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(30),
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: FlathColors.card,
          borderRadius: BorderRadius.circular(30),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: FlathColors.iconGray),
            SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(fontSize: 15, color: FlathColors.textSecondary, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
