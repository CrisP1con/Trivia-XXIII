import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:animate_do/animate_do.dart';
import '../services/api_service.dart';
import '../models/pregunta.dart';
import 'result_screen.dart';

class GameScreen extends StatefulWidget {
  final dynamic tema;
  const GameScreen({super.key, required this.tema});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  final ApiService _api = ApiService();
  VideoPlayerController? _controller;
  List<Pregunta> _preguntas = [];
  int _currentIdx = 0;
  bool _showVideo = true;
  bool _isLoading = true;

  // Marcador
  int scoreRojo = 0;
  int scoreAzul = 0;
  String turno = 'rojo'; // 'rojo' o 'azul'

  @override
  void initState() {
    super.initState();
    _loadGame();
  }

  void _loadGame() async {
    final data = await _api.getPreguntas(widget.tema['id']);
    setState(() {
      _preguntas = data.map((p) => Pregunta.fromJson(p)).toList();
      _isLoading = false;
    });

    final videoField = widget.tema['video'];
    if (videoField != null && videoField.toString().isNotEmpty) {
      // Ajustar URL para el servidor local
      String videoUrl = videoField.toString();
      if (!videoUrl.startsWith('http')) {
        videoUrl = 'http://192.168.0.6:3001$videoUrl';
      }
      
      print('Iniciando video: $videoUrl');
      _controller = VideoPlayerController.networkUrl(Uri.parse(videoUrl))
        ..initialize().then((_) {
          setState(() {});
          _controller?.play();
        }).catchError((e) {
          print('Error al cargar video: $e');
          setState(() => _showVideo = false);
        });
    } else {
      setState(() => _showVideo = false);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _answer(int index) {
    bool isCorrect = index == _preguntas[_currentIdx].respuestaCorrecta;
    
    setState(() {
      if (isCorrect) {
        if (turno == 'rojo') scoreRojo += 10; else scoreAzul += 10;
      }
      
      // Cambiar turno
      turno = (turno == 'rojo') ? 'azul' : 'rojo';

      if (_currentIdx < _preguntas.length - 1) {
        _currentIdx++;
      } else {
        // Fin del juego
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ResultScreen(rojo: scoreRojo, azul: scoreAzul)
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_preguntas.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('No hay preguntas disponibles para este tema.')),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: _showVideo && _controller != null && _controller!.value.isInitialized
                ? _buildVideoPlayer()
                : _buildQuestionArea(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white.withOpacity(0.05),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _scoreBox('ROJO', scoreRojo, const Color(0xFFB91C1C), turno == 'rojo'),
          const Text('VS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          _scoreBox('AZUL', scoreAzul, const Color(0xFF1D4ED8), turno == 'azul'),
        ],
      ),
    );
  }

  Widget _scoreBox(String label, int points, Color color, bool isActive) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        color: isActive ? color : color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(15),
        border: isActive ? Border.all(color: Colors.white, width: 2) : null,
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
          Text('$points', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.black, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildVideoPlayer() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        AspectRatio(
          aspectRatio: _controller!.value.aspectRatio,
          child: VideoPlayer(_controller!),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () => setState(() => _showVideo = false),
          child: const Text('SALTAR VIDEO Y COMENZAR'),
        ),
      ],
    );
  }

  Widget _buildQuestionArea() {
    final p = _preguntas[_currentIdx];
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'PREGUNTA ${_currentIdx + 1}/${_preguntas.length}',
            style: const TextStyle(color: Color(0xFFFDE68A), letterSpacing: 2),
          ),
          const SizedBox(height: 10),
          Text(
            p.texto,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 30),
          ...p.opciones.asMap().entries.map((entry) {
            return _optionBtn(entry.key, entry.value);
          }).toList(),
        ],
      ),
    );
  }

  Widget _optionBtn(int index, String text) {
    final letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    final letter = index < letters.length ? letters[index] : '?';
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white.withOpacity(0.1),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.all(20),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        ),
        onPressed: () => _answer(index),
        child: Row(
          children: [
            Text('$letter.', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFFFDE68A))),
            const SizedBox(width: 15),
            Expanded(child: Text(text, style: const TextStyle(color: Colors.white))),
          ],
        ),
      ),
    );
  }
}
