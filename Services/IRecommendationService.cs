using ViteraBackend.Models;

namespace ViteraBackend.Services;

public interface IRecommendationService
{
    IEnumerable<Place> GetRecommendations(IEnumerable<Place> allPlaces, string[] visitedIds);
}