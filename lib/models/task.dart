class Task {
  final String id;
  final String title;
  final bool isDone;

  Task({
    required this.id,
    required this.title,
    this.isDone = false,
  });

  Task copyWith(String? id, String? title, bool? isDone){
    return Task(
      id: id ?? this.id,
      title: title ?? this.title,
      isDone: isDone ?? this.isDone,
    );
  }
}