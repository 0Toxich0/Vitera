using ViteraBackend.Models;

namespace ViteraBackend.Services;

public static class RankingHelper
{
    public static int CalculateMatchPercent(Place place, RankRequest prefs)
    {
        int score = 0, maxScore = 0;

        if (prefs.Atmosphere.Length > 0)
        {
            maxScore += 30;
            if (prefs.Atmosphere.Contains(place.Atmosphere)) score += 30;
            else if (prefs.Atmosphere.Any(a => place.Atmosphere.Contains(a) || a.Contains(place.Atmosphere))) score += 15;
        }

        if (prefs.Types.Length > 0)
        {
            maxScore += 30;
            if (prefs.Types.Contains(place.Type)) score += 30;
            else if (prefs.Types.Any(t => place.Type.Contains(t) || t.Contains(place.Type))) score += 15;
        }

        if (prefs.Extra.TryGetValue(place.Type, out var extraOpts) && extraOpts.Length > 0)
        {
            maxScore += 30;
            if (extraOpts.Contains(place.Subcat)) score += 30;
            else if (extraOpts.Any(opt => place.Subcat.Contains(opt) || opt.Contains(place.Subcat))) score += 15;
        }

        if (prefs.Price.Length > 0)
        {
            maxScore += 10;
            if (prefs.Price.Contains(place.Price) || (prefs.Price.Contains("любой") && !string.IsNullOrEmpty(place.Price))) score += 10;
            else if (prefs.Price.Contains("бюджетно") && place.Price == "средне (1000-3000₽)") score += 5;
        }

        if (maxScore == 0) return 0;
        return (int)Math.Round((double)score / maxScore * 100);
    }
}