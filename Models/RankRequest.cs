using System.Text.Json.Serialization;

namespace ViteraBackend.Models;

public class RankRequest
{
    [JsonPropertyName("atmosphere")]
    public string[] Atmosphere { get; set; } = Array.Empty<string>();

    [JsonPropertyName("type")]
    public string[] Types { get; set; } = Array.Empty<string>();

    [JsonPropertyName("extra")]
    public Dictionary<string, string[]> Extra { get; set; } = new();

    [JsonPropertyName("price")]
    public string[] Price { get; set; } = Array.Empty<string>();
}