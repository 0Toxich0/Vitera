using ViteraBackend.Models;

namespace ViteraBackend.Services;

public interface IPlaceRepository
{
    IEnumerable<Place> GetAllPlaces();
    Place? GetPlaceById(string id);
}