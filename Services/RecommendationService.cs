using ViteraBackend.Models;

namespace ViteraBackend.Services;

public class RecommendationService : IRecommendationService
{
    public IEnumerable<Place> GetRecommendations(IEnumerable<Place> allPlaces, string[] visitedIds)
    {
        var placesList = allPlaces.ToList();
        if (visitedIds.Length == 0)
            return placesList.OrderByDescending(p => p.Rating).Take(6);

        var catCount = placesList
            .Where(p => visitedIds.Contains(p.Id))
            .GroupBy(p => p.Type)
            .ToDictionary(g => g.Key, g => g.Count());
        var topCats = catCount.OrderByDescending(kv => kv.Value).Take(2).Select(kv => kv.Key).ToList();

        var recommended = placesList
            .Where(p => topCats.Contains(p.Type) && !visitedIds.Contains(p.Id))
            .OrderByDescending(p => p.Rating)
            .Take(8)
            .ToList();

        if (recommended.Count < 5)
        {
            var others = placesList
                .Where(p => !visitedIds.Contains(p.Id) && !topCats.Contains(p.Type))
                .OrderByDescending(p => p.Rating);
            recommended.AddRange(others.Take(8 - recommended.Count));
        }
        return recommended;
    }
}