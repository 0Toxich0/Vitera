using ViteraBackend.Models;

namespace ViteraBackend.Services;

public class InMemoryAnalyticsStore : IAnalyticsStore
{
    private readonly List<MetricEvent> _events = new();
    private readonly object _lock = new();

    public void Add(MetricEvent item)
    {
        lock (_lock) _events.Add(item);
    }

    public IReadOnlyList<MetricEvent> GetLast(int count = 100)
    {
        lock (_lock) return _events.TakeLast(count).ToList();
    }

    public IReadOnlyList<MetricEvent> GetAll()
    {
        lock (_lock) return _events.ToList();
    }
}