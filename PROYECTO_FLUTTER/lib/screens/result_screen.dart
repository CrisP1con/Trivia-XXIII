import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';

class ResultScreen extends StatelessWidget {
  final int rojo;
  final int azul;

  const ResultScreen({super.key, required this.rojo, required this.azul});

  @override
  Widget build(BuildContext context) {
    String winner = (rojo > azul) ? 'EQUIPO ROJO' : (azul > rojo ? 'EQUIPO AZUL' : '¡EMPATE!');
    Color winColor = (rojo > azul) ? const Color(0xFFB91C1C) : (azul > rojo ? const Color(0xFF1D4ED8) : Colors.grey);

    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0f172a), Color(0xFF000000)],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FadeInDown(
              child: const Text(
                '¡JUEGO TERMINADO!',
                style: TextStyle(fontSize: 20, letterSpacing: 4, color: Colors.grey),
              ),
            ),
            const SizedBox(height: 20),
            ZoomIn(
              child: Text(
                winner,
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.black,
                  color: winColor,
                  shadows: [
                    Shadow(color: winColor.withOpacity(0.5), blurRadius: 30),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            const Text('HA GANADO LA PARTIDA', style: TextStyle(fontSize: 18)),
            const SizedBox(height: 60),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _scoreBox('ROJO', rojo, const Color(0xFFB91C1C)),
                const SizedBox(width: 40),
                _scoreBox('AZUL', azul, const Color(0xFF1D4ED8)),
              ],
            ),
            const SizedBox(height: 80),
            FadeInUp(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                ),
                onPressed: () {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                child: const Text('VOLVER AL INICIO', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _scoreBox(String team, int score, Color color) {
    return Column(
      children: [
        Text(team, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
        Text('$score', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.black)),
      ],
    );
  }
}
