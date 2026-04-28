import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const HistoriaApp());
}

class HistoriaApp extends StatelessWidget {
  const HistoriaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Historia Juan XXIII',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF050505),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFB91C1C),
          brightness: Brightness.dark,
          primary: const Color(0xFFB91C1C),
          secondary: const Color(0xFF1D4ED8),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
