using System.Text.Json;
using ViteraBackend.Models;

namespace ViteraBackend.Services;

public class PlaceRepository : IPlaceRepository
{
    private readonly List<Place> _places;
    
    public PlaceRepository()
    {
        var path = Path.Combine(Directory.GetCurrentDirectory(), "Data", "places.json");
        Console.WriteLine($"🔍 Ищем файл: {path}");
        
        if (!File.Exists(path))
        {
            Console.WriteLine("❌ Файл НЕ НАЙДЕН!");
            _places = new List<Place>();
            return;
        }
        
        var json = File.ReadAllText(path);
        Console.WriteLine($"✅ Файл найден, размер: {json.Length} символов");
        
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _places = JsonSerializer.Deserialize<List<Place>>(json, options) ?? new List<Place>();
        Console.WriteLine($"📦 Десериализовано мест: {_places.Count}");
    }
    
    public IEnumerable<Place> GetAllPlaces() => _places;
    public Place? GetPlaceById(string id) => _places.FirstOrDefault(p => p.Id == id);
}