using ViteraBackend.Services;
using ViteraBackend.Models;
using ViteraBackend.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<IPlaceRepository, PlaceRepository>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseCors();
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/places", (IPlaceRepository repo) => Results.Ok(repo.GetAllPlaces()));

app.MapGet("/api/places/{id}", (string id, IPlaceRepository repo) =>
{
    var place = repo.GetPlaceById(id);
    return place is null ? Results.NotFound(new { message = $"Место с id {id} не найдено" }) : Results.Ok(place);
});

app.MapPost("/api/recommendations", (RecommendationRequest req, IRecommendationService recService, IPlaceRepository repo) =>
{
    var allPlaces = repo.GetAllPlaces();
    var visitedIds = req.VisitedIds ?? Array.Empty<string>();
    var recommended = recService.GetRecommendations(allPlaces, visitedIds);
    return Results.Ok(recommended);
});

app.MapFallbackToFile("index.html");

app.Run();