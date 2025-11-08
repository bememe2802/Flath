// lib/main.dart
import 'package:flutter/material.dart';
import 'home_screen.dart'; // Sẽ import file này sau
import 'package:flath/theme/colors.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flath',
      theme: ThemeData(
        scaffoldBackgroundColor: FlathColors.background,
      ),
      home: const HomeScreen(),
    );
  }
}