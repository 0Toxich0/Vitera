using System.Text.Json;
using Microsoft.Extensions.Options;
using ViteraBackend.Models;

namespace ViteraBackend.Services;

public class PlaceRepository : IPlaceRepository
{
    private readonly List<Place> _places;
    
    public PlaceRepository(IOptions<StorageOptions> options)
    {
        var path = options.Value.PlacesFilePath;
        var fullPath = Path.Combine(Directory.GetCurrentDirectory(), path);
        Console.WriteLine($"Ищем файл: {fullPath}");
        
        if (!File.Exists(fullPath))
        {
            Console.WriteLine("Файл НЕ НАЙДЕН!");
            _places = new List<Place>();
            return;
        }
        
        var json = File.ReadAllText(fullPath);
        Console.WriteLine($"Файл найден, размер: {json.Length} символов");
        
        var optionsJson = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        _places = JsonSerializer.Deserialize<List<Place>>(json, optionsJson) ?? new List<Place>();
        Console.WriteLine($"Десериализовано мест: {_places.Count}");
    }
    
    public IEnumerable<Place> GetAllPlaces() => _places;
    public Place? GetPlaceById(string id) => _places.FirstOrDefault(p => p.Id == id);
}