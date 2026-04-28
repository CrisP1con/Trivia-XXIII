import 'package:animate_do/animate_do.dart';
import '../services/api_service.dart';
import 'temas_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _materias = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMaterias();
  }

  void _loadMaterias() async {
    final data = await _api.getMaterias();
    setState(() {
      _materias = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1a0505), Color(0xFF050505)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const SizedBox(height: 40),
              FadeInDown(
                child: const Text(
                  'INSTITUTO JUAN XXIII',
                  style: TextStyle(
                    fontSize: 14,
                    letterSpacing: 4,
                    color: Color(0xFFFDE68A),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              FadeInDown(
                delay: const Duration(milliseconds: 200),
                child: const Text(
                  'Historia Argentina',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.black,
                  ),
                ),
              ),
              const SizedBox(height: 40),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        itemCount: _materias.length,
                        itemBuilder: (context, index) {
                          final m = _materias[index];
                          return FadeInUp(
                            delay: Duration(milliseconds: 100 * index),
                            child: _buildMateriaCard(m),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMateriaCard(dynamic materia) {
    return Container(
      margin: const EdgeInsets.bottom(20),
      height: 120,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => TemasScreen(materia: materia)),
          );
        },
        borderRadius: BorderRadius.circular(24),
        child: Row(
          children: [
            Container(
              width: 80,
              decoration: BoxDecoration(
                color: const Color(0xFFB91C1C).withOpacity(0.8),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  bottomLeft: Radius.circular(24),
                ),
              ),
              child: const Icon(Icons.history_edu, size: 40, color: Colors.white),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    materia['nombre'] ?? 'Sin nombre',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Toca para comenzar',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
            const SizedBox(width: 16),
          ],
        ),
      ),
    );
  }
}
