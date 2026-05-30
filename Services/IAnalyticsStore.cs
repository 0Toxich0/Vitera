using ViteraBackend.Models;

namespace ViteraBackend.Services;

public interface IAnalyticsStore
{
    void Add(MetricEvent item);
    IReadOnlyList<MetricEvent> GetLast(int count = 100);
    IReadOnlyList<MetricEvent> GetAll();
}