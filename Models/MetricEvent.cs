namespace ViteraBackend.Models;

public record MetricEvent(
    string Page,
    string Name,
    double Value,
    string Rating,
    DateTime Timestamp
);