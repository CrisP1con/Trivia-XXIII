class Pregunta {
  final int id;
  final String texto;
  final List<String> opciones;
  final int respuestaCorrecta;
  final String explicacion;

  Pregunta({
    required this.id,
    required this.texto,
    required this.opciones,
    required this.respuestaCorrecta,
    required this.explicacion,
  });

  factory Pregunta.fromJson(Map<String, dynamic> json) {
    return Pregunta(
      id: json['id'],
      texto: json['prompt'],
      opciones: List<String>.from(json['options'] ?? []),
      respuestaCorrecta: json['answer'],
      explicacion: json['explanation'] ?? '',
    );
  }
}
