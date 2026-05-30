namespace ViteraBackend.Models;

public class CacheOptions
{
    public int PlacesExpirationSeconds { get; set; } = 60;
    public int PlacesOutputCacheSeconds { get; set; } = 30;
}