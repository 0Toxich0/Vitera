using System.Threading;

namespace ViteraBackend.Services;

public class CacheStatsService
{
    private int _hits;
    private int _misses;

    public void AddHit() => Interlocked.Increment(ref _hits);
    public void AddMiss() => Interlocked.Increment(ref _misses);

    public int Hits => _hits;
    public int Misses => _misses;
    public double HitRate => _hits + _misses == 0 ? 0 : (double)_hits / (_hits + _misses);
}