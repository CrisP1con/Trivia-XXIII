import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // CAMBIA ESTA IP por la de tu PC servidor
  static const String baseUrl = 'http://192.168.0.6:3001/api';

  Future<List<dynamic>> getMaterias() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/materias'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      print('Error al cargar materias: $e');
      return [];
    }
  }

  Future<List<dynamic>> getTemas(int materiaId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/temas?materia_id=$materiaId'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<List<dynamic>> getPreguntas(int temaId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/questions?tema_id=$temaId'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      return [];
    } catch (e) {
      print('Error al cargar preguntas: $e');
      return [];
    }
  }
}
