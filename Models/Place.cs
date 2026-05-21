namespace ViteraBackend.Models;

public class Place
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string City { get; set; } = "";
    public string Address { get; set; } = "";
    public string Atmosphere { get; set; } = "";
    public string Type { get; set; } = "";
    public string Subcat { get; set; } = "";
    public string Price { get; set; } = "";
    public double Rating { get; set; } 
    public string Description { get; set; } = "";
    public string? Website { get; set; } = "";
}