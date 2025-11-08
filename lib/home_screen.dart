import 'package:flutter/material.dart';
import 'package:flath/theme/colors.dart';

class HomeScreen extends StatefulWidget{
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
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
                  padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 8.0),
                  decoration: BoxDecoration(
                    color: FlathColors.card,
                    borderRadius: BorderRadius.circular(17.0),
                  ),
                  child:
                    Row(
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
                        )
                      ],
                    ),
                  ),
                const SizedBox(width: 10.0),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
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
            )
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: FlathColors.accent,
        onPressed: () {  },
        shape: CircleBorder(),
        child: const Icon(
          Icons.add,
          color: FlathColors.background,
          size: 30,
        ),
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
}