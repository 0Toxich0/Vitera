using ViteraBackend.Services;
using ViteraBackend.Models;
using ViteraBackend.Middleware;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Caching.Memory;

var builder = WebApplication.CreateBuilder(args);

// ========== НАСТРОЙКА СЕРВИСОВ ==========

// Конфигурация из appsettings.json
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection("Storage"));
builder.Services.Configure<CacheOptions>(builder.Configuration.GetSection("Cache"));

// Регистрация репозитория и сервисов
builder.Services.AddSingleton<IPlaceRepository, PlaceRepository>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddSingleton<CacheStatsService>();
builder.Services.AddSingleton<IAnalyticsStore, InMemoryAnalyticsStore>();

// Кеширование
builder.Services.AddMemoryCache();
builder.Services.AddOutputCache(options =>
{
    var cacheConfig = builder.Configuration.GetSection("Cache");
    var ttl = cacheConfig.GetValue<int>("PlacesOutputCacheSeconds", 30);
    options.AddPolicy("PlacesCache", policy =>
        policy.Expire(TimeSpan.FromSeconds(ttl)).SetVaryByQuery("city"));
});

// Компрессия ответов
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
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

// ========== ПОРЯДОК MIDDLEWARE ==========

// Обработка исключений
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseExceptionHandler("/error/exception");
    app.UseHsts();
}

// Статус-коды ошибок
app.UseStatusCodePagesWithReExecute("/error/status/{0}");

// Компрессия
app.UseResponseCompression();

// CORS
app.UseCors();

// Пользовательские middleware
app.UseMiddleware<RequestLoggingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<PerformanceMiddleware>();

// Статические файлы с кешированием
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.CacheControl = "public,max-age=86400";
    }
});

// OutputCache для публичных GET
app.UseOutputCache();

// ========== ЭНДПОИНТЫ ==========

// Ошибки
app.MapGet("/error/exception", () => Results.Problem(
    title: "Внутренняя ошибка сервера",
    detail: "Попробуйте позже",
    statusCode: 500));

app.MapGet("/error/status/{code:int}", (int code) =>
{
    var message = code switch
    {
        404 => "Ресурс не найден",
        401 => "Не авторизован",
        403 => "Доступ запрещён",
        _ => "Ошибка HTTP"
    };
    return Results.Json(new { error = message, statusCode = code }, statusCode: code);
});

// API мест с кешированием
app.MapGet("/api/places", async (IPlaceRepository repo, IMemoryCache cache, CacheStatsService stats) =>
{
    const string cacheKey = "all_places";
    if (!cache.TryGetValue(cacheKey, out IEnumerable<Place>? places))
    {
        stats.AddMiss();
        places = repo.GetAllPlaces();
        var ttl = builder.Configuration.GetValue<int>("Cache:PlacesExpirationSeconds", 60);
        cache.Set(cacheKey, places, TimeSpan.FromSeconds(ttl));
    }
    else
    {
        stats.AddHit();
    }
    return Results.Ok(places);
}).CacheOutput("PlacesCache");

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

app.MapPost("/api/rank", (RankRequest prefs, IPlaceRepository repo) =>
{
    var places = repo.GetAllPlaces();
    var scored = places.Select(place => new
    {
        place.Id,
        place.Name,
        place.City,
        place.Address,
        place.Atmosphere,
        place.Type,
        place.Subcat,
        place.Price,
        place.Rating,
        place.Description,
        place.Website,
        MatchPercent = RankingHelper.CalculateMatchPercent(place, prefs)
    }).OrderByDescending(x => x.MatchPercent);
    return Results.Ok(scored);
});

// Статистика кеша
app.MapGet("/cache/stats", (CacheStatsService stats) => Results.Ok(new
{
    stats.Hits,
    stats.Misses,
    HitRate = stats.HitRate
}));

// Аналитика производительности
app.MapPost("/analytics/event", (MetricEvent metric, IAnalyticsStore store) =>
{
    store.Add(metric with { Timestamp = DateTime.UtcNow });
    return Results.Accepted();
});

app.MapGet("/analytics/report", (IAnalyticsStore store) =>
{
    var all = store.GetAll();
    var lcpValues = all.Where(m => m.Name == "LCP").Select(m => m.Value).ToList();
    var clsValues = all.Where(m => m.Name == "CLS").Select(m => m.Value).ToList();
    var inpValues = all.Where(m => m.Name == "INP").Select(m => m.Value).ToList();

    return Results.Ok(new
    {
        TotalEvents = all.Count,
        LCP = lcpValues.Count == 0 ? null : new { Avg = lcpValues.Average(), Max = lcpValues.Max(), Min = lcpValues.Min() },
        CLS = clsValues.Count == 0 ? null : new { Avg = clsValues.Average(), Max = clsValues.Max(), Min = clsValues.Min() },
        INP = inpValues.Count == 0 ? null : new { Avg = inpValues.Average(), Max = inpValues.Max(), Min = inpValues.Min() }
    });
});

app.MapGet("/analytics/raw", (IAnalyticsStore store) => store.GetLast(100));

// Конфигурация
app.MapGet("/config", (IConfiguration config) =>
    config.AsEnumerable().ToDictionary(kv => kv.Key, kv => kv.Value));

app.MapFallbackToFile("index.html");

app.Run();
